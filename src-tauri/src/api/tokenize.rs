use crate::store::{save_store, StoreCategoryKey, StoreDataKey, STORE_FILE_NAME};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::{
    collections::{HashMap, HashSet},
    fs,
    sync::{OnceLock, RwLock},
    time::UNIX_EPOCH,
};
use tauri::{AppHandle, Emitter, Wry};
use tauri_plugin_store::StoreExt;
use tiktoken_rs::cl100k_base;

pub(crate) fn count_tokens_for_text(text: &str) -> usize {
    if let Ok(enc) = cl100k_base() {
        enc.encode_with_special_tokens(text).len()
    } else {
        0
    }
}

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
    let cache = cache().read().ok()?;
    cache.get(path).and_then(|e| {
        if e.mtime_ms == mtime_ms && e.size == size {
            Some(e.count)
        } else {
            None
        }
    })
}

fn set_cache(path: &str, mtime_ms: u128, size: u64, count: usize) {
    let mut cache = cache().write().expect("cache write poisoned");
    cache.insert(
        path.to_string(),
        CacheEntry {
            mtime_ms,
            size,
            count,
        },
    );
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
            if let Some(data_object) = data_value.as_object() {
                if let Some(directory_value) = data_object.get(root) {
                    if let Some(directory_object) = directory_value.as_object() {
                        if let Some(value) = directory_object.get(StoreDataKey::TOKEN_CACHE) {
                            if let Ok(map) =
                                serde_json::from_value::<HashMap<String, CacheEntry>>(value.clone())
                            {
                                if let Ok(mut c) = cache().write() {
                                    for (path, entry) in map {
                                        c.insert(path, entry);
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

    if let Ok(store) = app.store(STORE_FILE_NAME) {
        let mut data: Map<String, Value> = store
            .get(StoreCategoryKey::DATA)
            .and_then(|value| value.as_object().cloned())
            .unwrap_or_else(Map::new);

        let directory_entry = data
            .entry(root.to_string())
            .or_insert_with(|| Value::Object(Map::new()));

        if !directory_entry.is_object() {
            *directory_entry = Value::Object(Map::new());
        }

        let directory_object = directory_entry.as_object_mut().unwrap();

        let token_cache_entry = directory_object
            .entry(StoreDataKey::TOKEN_CACHE.to_string())
            .or_insert_with(|| Value::Object(Map::new()));

        if !token_cache_entry.is_object() {
            *token_cache_entry = Value::Object(Map::new());
        }

        if let Some(token_cache_object) = token_cache_entry.as_object_mut() {
            for (path, entry) in batch {
                if let Ok(entry_value) = serde_json::to_value(entry.clone()) {
                    token_cache_object.insert(path.clone(), entry_value);
                }
            }
        }

        store.set(StoreCategoryKey::DATA, Value::Object(data));
        let _ = save_store(&store);

        store.close_resource();
    }
}

pub fn spawn_token_count_task(app: AppHandle<Wry>, root: String, selection_ids: Vec<String>) {
    std::thread::spawn(move || {
        let bpe = cl100k_base().ok();
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
                        if let Some(enc) = &bpe {
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
