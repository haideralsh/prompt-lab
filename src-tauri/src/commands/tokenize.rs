use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs,
    sync::{OnceLock, RwLock},
    time::UNIX_EPOCH,
};
use tauri::{AppHandle, Emitter, Wry};
use tauri_plugin_store::StoreExt;
use tiktoken_rs::cl100k_base;

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

const STORE_FILE: &str = "store.json";
const TOKEN_CACHE_KEY_PREFIX: &str = "TOKEN_CACHE:";

fn cache_store_key(root: &str) -> String {
    format!("{}:{}", TOKEN_CACHE_KEY_PREFIX, root)
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
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TokenCountsEvent {
    files: Vec<TokenCountResult>,
}

const BATCH_SIZE: usize = 25;

pub fn ensure_cache_loaded_for_dir(app: &AppHandle<Wry>, root: &str) {
    {
        if let Ok(loaded) = loaded_dirs().read() {
            if loaded.contains(root) {
                return;
            }
        }
    }

    if let Ok(store) = app.store(STORE_FILE) {
        let key = cache_store_key(root);
        if let Some(value) = store.get(&key) {
            if let Ok(map) = serde_json::from_value::<HashMap<String, CacheEntry>>(value.clone()) {
                if let Ok(mut c) = cache().write() {
                    for (path, entry) in map {
                        c.insert(path, entry);
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

    if let Ok(store) = app.store(STORE_FILE) {
        let key = cache_store_key(root);
        let mut existing: HashMap<String, CacheEntry> = store
            .get(&key)
            .and_then(|v| serde_json::from_value::<HashMap<String, CacheEntry>>(v.clone()).ok())
            .unwrap_or_default();

        for (path, entry) in batch {
            existing.insert(path.clone(), entry.clone());
        }

        store.set(&key, serde_json::json!(existing));

        let _ = store.save();
        store.close_resource();
    }
}

pub fn spawn_token_count_task(app: AppHandle<Wry>, root: String, file_ids: Vec<String>) {
    std::thread::spawn(move || {
        let bpe = cl100k_base().ok();
        let mut batch: Vec<TokenCountResult> = Vec::new();
        let mut store_batch: Vec<(String, CacheEntry)> = Vec::new();

        for id in file_ids {
            if let Some(count) = get_cached_count(&id) {
                batch.push(TokenCountResult {
                    id,
                    token_count: count,
                });
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
                }
                batch.push(TokenCountResult { id, token_count });
            }

            if batch.len() >= BATCH_SIZE {
                let _ = app.emit(
                    "file-token-counts",
                    TokenCountsEvent {
                        files: batch.clone(),
                    },
                );

                save_cache_batch_to_store(&app, &root, &store_batch);

                batch.clear();
                store_batch.clear();
            }
        }

        if !batch.is_empty() {
            let _ = app.emit("file-token-counts", TokenCountsEvent { files: batch });
        }

        if !store_batch.is_empty() {
            save_cache_batch_to_store(&app, &root, &store_batch);
        }
    });
}
