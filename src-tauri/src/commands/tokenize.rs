use serde::{Deserialize, Serialize};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::Path,
    sync::{Mutex, OnceLock, RwLock},
    time::UNIX_EPOCH,
};
use tauri::{AppHandle, Emitter, Wry};
use tauri_plugin_store::StoreExt;
use tiktoken_rs::{cl100k_base, CoreBPE};

use crate::store::{StoreCategoryKey, StoreDataKey, STORE_FILE_NAME};

#[derive(Clone, Serialize, Deserialize)]
struct CacheEntry {
    mtime_ms: u128,
    size: u64,
    count: usize,
}

static TOKEN_CACHE: OnceLock<RwLock<HashMap<String, CacheEntry>>> = OnceLock::new();
static LOADED_DIRS: OnceLock<RwLock<HashSet<String>>> = OnceLock::new();

fn cache() -> &'static RwLock<HashMap<String, CacheEntry>> {
    TOKEN_CACHE.get_or_init(|| RwLock::new(HashMap::new()))
}

fn loaded_dirs() -> &'static RwLock<HashSet<String>> {
    LOADED_DIRS.get_or_init(|| RwLock::new(HashSet::new()))
}

static STORE_WRITE_GUARD: OnceLock<Mutex<()>> = OnceLock::new();
fn store_mutex() -> &'static Mutex<()> {
    STORE_WRITE_GUARD.get_or_init(|| Mutex::new(()))
}

static ENCODER: OnceLock<Option<CoreBPE>> = OnceLock::new();
fn encoder() -> Option<&'static CoreBPE> {
    ENCODER.get_or_init(|| cl100k_base().ok()).as_ref()
}

fn normalize_path(path: &str) -> String {
    fs::canonicalize(Path::new(path))
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| path.to_string())
}

fn file_sig(path: &str) -> Option<(u128, u64)> {
    let meta = fs::metadata(path).ok()?;

    let mtime = meta
        .modified()
        .ok()?
        .duration_since(UNIX_EPOCH)
        .ok()?
        .as_millis();

    Some((mtime, meta.len()))
}

pub fn get_cached_count(path: &str) -> Option<usize> {
    let (mtime_ms, size) = file_sig(path)?;
    let key = normalize_path(path);
    let cache = cache().read().ok()?;
    cache.get(&key).and_then(|e| {
        if e.mtime_ms == mtime_ms && e.size == size {
            Some(e.count)
        } else {
            None
        }
    })
}

fn set_cache(path: &str, mtime_ms: u128, size: u64, count: usize) {
    let key = normalize_path(path);
    if let Ok(mut cache) = cache().write() {
        cache.insert(
            key,
            CacheEntry {
                mtime_ms,
                size,
                count,
            },
        );
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TokenCountResult {
    id: String,
    token_count: usize,
    token_percentage: f64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TokenCountsEvent {
    selection_id: String,
    total_token_count: usize,
    files: Vec<TokenCountResult>,
}

const BATCH_SIZE: usize = 25;

fn selection_id_for(ids: &[String]) -> String {
    let mut sorted = ids.to_vec();
    sorted.sort();
    let mut hasher = DefaultHasher::new();
    sorted.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

pub fn ensure_cache_loaded_for_dir(app: &AppHandle<Wry>, root: &str) {
    {
        if let Ok(loaded) = loaded_dirs().read() {
            if loaded.contains(root) {
                return;
            }
        }
    }

    if let Ok(store) = app.store(STORE_FILE_NAME) {
        if let Some(data_value) = store.get(StoreCategoryKey::DATA) {
            // Expecting an object of the shape:
            // data: {
            //   "<root>": {
            //     StoreDataKey::TOKEN_CACHE: { "<path>": CacheEntry, ... }
            //   }
            // }
            if let Some(data_obj) = data_value.as_object() {
                if let Some(dir_value) = data_obj.get(root) {
                    if let Some(dir_obj) = dir_value.as_object() {
                        if let Some(token_cache_value) = dir_obj.get(StoreDataKey::TOKEN_CACHE) {
                            if let Ok(map) = serde_json::from_value::<HashMap<String, CacheEntry>>(
                                token_cache_value.clone(),
                            ) {
                                if let Ok(mut c) = cache().write() {
                                    for (path, entry) in map {
                                        c.insert(normalize_path(&path), entry);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        store.close_resource();
    }

    if let Ok(mut loaded) = loaded_dirs().write() {
        loaded.insert(root.to_string());
    }
}

fn save_cache_batch_to_store(app: &AppHandle<Wry>, root: &str, batch: &[(String, CacheEntry)]) {
    if batch.is_empty() {
        return;
    }

    let _guard = store_mutex().lock().ok();

    if let Ok(store) = app.store(STORE_FILE_NAME) {
        let mut data: serde_json::Value = store
            .get(StoreCategoryKey::DATA)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_else(|| serde_json::json!({}));

        if !data.is_object() {
            data = serde_json::json!({});
        }

        let data_obj = match data.as_object_mut() {
            Some(o) => o,
            None => {
                store.close_resource();
                return;
            }
        };

        if !data_obj.contains_key(root) {
            data_obj.insert(root.to_string(), serde_json::json!({}));
        }

        let dir_value = data_obj.get_mut(root).unwrap();
        if !dir_value.is_object() {
            *dir_value = serde_json::json!({});
        }
        let dir_obj = dir_value.as_object_mut().unwrap();

        let mut existing: HashMap<String, CacheEntry> = dir_obj
            .get(StoreDataKey::TOKEN_CACHE)
            .and_then(|v| serde_json::from_value::<HashMap<String, CacheEntry>>(v.clone()).ok())
            .unwrap_or_default();

        for (path, entry) in batch {
            existing.insert(normalize_path(path), entry.clone());
        }

        if let Ok(serialized) = serde_json::to_value(existing) {
            dir_obj.insert(StoreDataKey::TOKEN_CACHE.to_string(), serialized);
        } else {
            store.close_resource();
            return;
        }

        store.set(
            StoreCategoryKey::DATA,
            serde_json::Value::Object(data_obj.clone()),
        );

        let _ = store.save();
        store.close_resource();
    }
}

pub fn spawn_token_count_task(app: AppHandle<Wry>, root: String, selection_ids: Vec<String>) {
    std::thread::spawn(move || {
        let enc_opt = encoder();

        let sid = selection_id_for(&selection_ids);

        if selection_ids.is_empty() {
            let _ = app.emit(
                "file-token-counts",
                TokenCountsEvent {
                    selection_id: sid,
                    total_token_count: 0,
                    files: Vec::new(),
                },
            );
            return;
        }

        let mut counts: Vec<(String, usize)> = Vec::with_capacity(selection_ids.len());
        let mut store_batch: Vec<(String, CacheEntry)> = Vec::new();

        for id in selection_ids {
            if let Some(count) = get_cached_count(&id) {
                counts.push((id, count));
            } else {
                let (mtime_ms, size) = file_sig(&id).unwrap_or((0, 0));
                let token_count = fs::read(&id)
                    .ok()
                    .map(|bytes| {
                        let text = String::from_utf8_lossy(&bytes);
                        if let Some(enc) = enc_opt {
                            enc.encode_with_special_tokens(&text).len()
                        } else {
                            0
                        }
                    })
                    .unwrap_or(0);

                if mtime_ms != 0 {
                    set_cache(&id, mtime_ms, size, token_count);
                    store_batch.push((
                        id.clone(),
                        CacheEntry {
                            mtime_ms,
                            size,
                            count: token_count,
                        },
                    ));

                    if store_batch.len() >= BATCH_SIZE {
                        save_cache_batch_to_store(&app, &root, &store_batch);
                        store_batch.clear();
                    }
                }

                counts.push((id, token_count));
            }
        }

        if !store_batch.is_empty() {
            save_cache_batch_to_store(&app, &root, &store_batch);
        }

        let total: usize = counts.iter().map(|(_, c)| *c).sum();

        let mut batch: Vec<TokenCountResult> = Vec::new();
        for (id, token_count) in counts {
            let token_percentage = if total > 0 {
                (token_count as f64 / total as f64) * 100.0
            } else {
                0.0
            };

            batch.push(TokenCountResult {
                id,
                token_count,
                token_percentage,
            });

            if batch.len() >= BATCH_SIZE {
                let _ = app.emit(
                    "file-token-counts",
                    TokenCountsEvent {
                        selection_id: sid.clone(),
                        total_token_count: total,
                        files: batch.clone(),
                    },
                );
                batch.clear();
            }
        }

        if !batch.is_empty() {
            let _ = app.emit(
                "file-token-counts",
                TokenCountsEvent {
                    selection_id: sid,
                    total_token_count: total,
                    files: batch,
                },
            );
        }
    });
}
