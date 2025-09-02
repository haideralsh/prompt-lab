use serde::Serialize;
use std::{
    collections::HashMap,
    fs,
    sync::{OnceLock, RwLock},
    time::UNIX_EPOCH,
};
use tauri::{AppHandle, Emitter};
use tiktoken_rs::cl100k_base;

#[derive(Clone)]
struct CacheEntry {
    mtime_ms: u128,
    size: u64,
    count: usize,
}

static TOKEN_CACHE: OnceLock<RwLock<HashMap<String, CacheEntry>>> = OnceLock::new();

fn cache() -> &'static RwLock<HashMap<String, CacheEntry>> {
    TOKEN_CACHE.get_or_init(|| RwLock::new(HashMap::new()))
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

pub fn spawn_token_count_task(app: AppHandle, file_ids: Vec<String>) {
    std::thread::spawn(move || {
        let bpe = cl100k_base().ok();
        let mut batch: Vec<TokenCountResult> = Vec::new();

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
                batch.clear();
            }
        }

        let _ = app.emit("file-token-counts", TokenCountsEvent { files: batch });
    });
}
