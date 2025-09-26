use super::event;
use crate::{
    commands::tokenize::count_tokens_for_text,
    models::{GitDiffWorkItem, GitTokenCacheEntry, GitTokenCountsEvent},
    store::{StoreCategoryKey, StoreDataKey, STORE_FILE_NAME},
};
use serde_json::{Map, Value};
use std::{
    collections::{HashMap, HashSet},
    sync::{OnceLock, RwLock},
};
use tauri::{AppHandle, Wry};
use tauri_plugin_store::StoreExt;

const GIT_TOKEN_BATCH_SIZE: usize = 25;

static GIT_TOKEN_CACHE: OnceLock<RwLock<HashMap<String, HashMap<String, GitTokenCacheEntry>>>> =
    OnceLock::new();
static GIT_LOADED_DIRS: OnceLock<RwLock<HashSet<String>>> = OnceLock::new();

fn git_cache() -> &'static RwLock<HashMap<String, HashMap<String, GitTokenCacheEntry>>> {
    GIT_TOKEN_CACHE.get_or_init(|| RwLock::new(HashMap::new()))
}

fn git_loaded_dirs() -> &'static RwLock<HashSet<String>> {
    GIT_LOADED_DIRS.get_or_init(|| RwLock::new(HashSet::new()))
}

pub fn ensure_git_cache_loaded_for_dir(app: &AppHandle<Wry>, root: &str) {
    {
        if let Ok(loaded) = git_loaded_dirs().read() {
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
                        if let Some(value) = directory_object.get(StoreDataKey::GIT_TOKEN_CACHE) {
                            if let Ok(map) = serde_json::from_value::<
                                HashMap<String, GitTokenCacheEntry>,
                            >(value.clone())
                            {
                                if let Ok(mut cache) = git_cache().write() {
                                    let entry = cache.entry(root.to_string()).or_default();
                                    for (path, cache_entry) in map {
                                        entry.insert(path, cache_entry);
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

    if let Ok(mut loaded) = git_loaded_dirs().write() {
        loaded.insert(root.to_string());
    }
}

fn save_git_cache_batch_to_store(
    app: &AppHandle<Wry>,
    root: &str,
    batch: &[(String, GitTokenCacheEntry)],
) {
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
            .entry(StoreDataKey::GIT_TOKEN_CACHE.to_string())
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

        let _ = store.save();
        store.close_resource();
    }
}

pub fn get_git_cached_entry(root: &str, path: &str) -> Option<GitTokenCacheEntry> {
    let cache = git_cache().read().ok()?;
    cache
        .get(root)
        .and_then(|directory| directory.get(path).cloned())
}

fn set_git_cache_entry(root: &str, path: &str, entry: GitTokenCacheEntry) {
    if let Ok(mut cache) = git_cache().write() {
        let directory = cache.entry(root.to_string()).or_default();
        directory.insert(path.to_string(), entry);
    }
}

pub fn spawn_git_token_count_task(app: AppHandle<Wry>, root: String, items: Vec<GitDiffWorkItem>) {
    if items.is_empty() {
        return;
    }

    std::thread::spawn(move || {
        let mut batch: HashMap<String, usize> = HashMap::new();
        let mut store_batch: Vec<(String, GitTokenCacheEntry)> = Vec::new();

        for item in items {
            if item.diff_hash.is_empty() {
                continue;
            }

            let cached_entry = get_git_cached_entry(&root, &item.path);
            let mut token_count = None;

            if let Some(entry) = cached_entry {
                if entry.diff_hash == item.diff_hash {
                    token_count = Some(entry.token_count);
                }
            }

            let token_count = if let Some(count) = token_count {
                count
            } else {
                let diff_text = String::from_utf8_lossy(item.diff_bytes.as_ref());
                let count = count_tokens_for_text(&diff_text);
                let entry = GitTokenCacheEntry {
                    diff_hash: item.diff_hash.clone(),
                    token_count: count,
                };
                set_git_cache_entry(&root, &item.path, entry.clone());
                store_batch.push((item.path.clone(), entry));
                count
            };

            batch.insert(item.path.clone(), token_count);

            if batch.len() >= GIT_TOKEN_BATCH_SIZE {
                event::emit_git_token_counts_event(
                    &app,
                    GitTokenCountsEvent {
                        root: root.clone(),
                        files: batch.clone(),
                    },
                );
                batch.clear();
            }

            if store_batch.len() >= GIT_TOKEN_BATCH_SIZE {
                save_git_cache_batch_to_store(&app, &root, &store_batch);
                store_batch.clear();
            }
        }

        if !store_batch.is_empty() {
            save_git_cache_batch_to_store(&app, &root, &store_batch);
        }

        if !batch.is_empty() {
            event::emit_git_token_counts_event(&app, GitTokenCountsEvent { root, files: batch });
        }
    });
}
