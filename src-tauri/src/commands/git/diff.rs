use crate::{
    models::{
        GitChange, GitDiffData, GitDiffWorkItem, GitTokenCacheEntry, GitTokenCountResult,
        GitTokenCountsEvent,
    },
    store::{StoreCategoryKey, StoreDataKey, STORE_FILE_NAME},
};
use git2::{
    DiffFindOptions, DiffOptions, ErrorCode, Patch, Repository, Status, StatusOptions, StatusShow,
};
use serde_json::{Map, Value};
use std::{
    collections::{hash_map::DefaultHasher, HashMap, HashSet},
    hash::{Hash, Hasher},
    sync::{Arc, OnceLock, RwLock},
};
use tauri::{AppHandle, Emitter, Wry};
use tauri_plugin_store::StoreExt;

use crate::commands::tokenize::count_tokens_for_text;

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

fn diff_hash(bytes: &[u8]) -> String {
    let mut hasher = DefaultHasher::new();
    bytes.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

fn ensure_git_cache_loaded_for_dir(app: &AppHandle<Wry>, root: &str) {
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

fn get_git_cached_entry(root: &str, path: &str) -> Option<GitTokenCacheEntry> {
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

fn spawn_git_token_count_task(app: AppHandle<Wry>, root: String, items: Vec<GitDiffWorkItem>) {
    if items.is_empty() {
        return;
    }

    std::thread::spawn(move || {
        let mut batch: Vec<GitTokenCountResult> = Vec::new();
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

            batch.push(GitTokenCountResult {
                path: item.path.clone(),
                token_count,
                diff_hash: item.diff_hash.clone(),
            });

            if batch.len() >= GIT_TOKEN_BATCH_SIZE {
                let _ = app.emit(
                    "git-token-counts",
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
            let _ = app.emit(
                "git-token-counts",
                GitTokenCountsEvent { root, files: batch },
            );
        }
    });
}

#[tauri::command]
pub(crate) fn git_status(app: AppHandle<Wry>, root: String) -> Option<Vec<GitChange>> {
    let repo = match Repository::discover(&root) {
        Ok(r) => r,
        Err(e) if e.code() == ErrorCode::NotFound => return None,
        Err(_) => return Some(Vec::new()),
    };

    ensure_git_cache_loaded_for_dir(&app, &root);

    let head_tree = match repo.head().and_then(|h| h.peel_to_tree()) {
        Ok(t) => Some(t),
        Err(_) => match repo
            .treebuilder(None)
            .and_then(|tb| tb.write())
            .and_then(|oid| repo.find_tree(oid))
        {
            Ok(t) => Some(t),
            Err(_) => None,
        },
    };

    let mut diff_opts = DiffOptions::new();
    diff_opts
        .include_untracked(true)
        .recurse_untracked_dirs(true)
        .ignore_submodules(true)
        .include_typechange(true);

    let mut diff =
        match repo.diff_tree_to_workdir_with_index(head_tree.as_ref(), Some(&mut diff_opts)) {
            Ok(d) => d,
            Err(_) => return Some(Vec::new()),
        };

    let mut find_opts = DiffFindOptions::new();
    find_opts.renames(true).copies(true);
    let _ = diff.find_similar(Some(&mut find_opts));

    let mut file_changes: HashMap<String, GitDiffData> = HashMap::new();

    let deltas_len = diff.deltas().len();
    for i in 0..deltas_len {
        if let Ok(Some(mut patch)) = Patch::from_diff(&diff, i) {
            let (_ctx, adds, dels) = patch.line_stats().unwrap_or((0, 0, 0));

            let delta = patch.delta();
            if let Some(path) = delta
                .new_file()
                .path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().into_owned())
            {
                let diff_bytes = patch
                    .to_buf()
                    .map(|buf| {
                        let slice: &[u8] = buf.as_ref();
                        slice.to_vec()
                    })
                    .unwrap_or_default();
                let diff_hash_value = if diff_bytes.is_empty() {
                    String::new()
                } else {
                    diff_hash(&diff_bytes)
                };

                file_changes.insert(
                    path,
                    GitDiffData {
                        lines_added: adds as i32,
                        lines_deleted: dels as i32,
                        diff_bytes: Arc::new(diff_bytes),
                        diff_hash: diff_hash_value,
                    },
                );
            }
        }
    }

    let mut opts = StatusOptions::new();
    opts.show(StatusShow::IndexAndWorkdir)
        .include_untracked(true)
        .recurse_untracked_dirs(true)
        .include_ignored(false)
        .exclude_submodules(true)
        .renames_head_to_index(true)
        .renames_index_to_workdir(true)
        .renames_from_rewrites(true);

    let statuses = match repo.statuses(Some(&mut opts)) {
        Ok(s) => s,
        Err(_) => return Some(Vec::new()),
    };

    let mut out: Vec<GitChange> = Vec::new();
    let mut work_items: Vec<GitDiffWorkItem> = Vec::new();

    for entry in statuses.iter() {
        let st = entry.status();

        if st.intersects(Status::IGNORED) {
            continue;
        }

        let change_type = match classify_change(st) {
            Some(ct) => ct,
            None => continue,
        };

        let path = if st.intersects(Status::WT_RENAMED | Status::INDEX_RENAMED) {
            entry
                .index_to_workdir()
                .or_else(|| entry.head_to_index())
                .and_then(|d| {
                    d.new_file()
                        .path()
                        .or_else(|| d.old_file().path())
                        .map(|p| p.to_string_lossy().into_owned())
                })
                .or_else(|| entry.path().map(|s| s.to_string()))
        } else {
            entry.path().map(|s| s.to_string()).or_else(|| {
                entry.index_to_workdir().and_then(|d| {
                    d.new_file()
                        .path()
                        .map(|p| p.to_string_lossy().into_owned())
                })
            })
        };

        if let Some(path) = path {
            let data = file_changes.get(&path);
            let lines_added = data.map(|d| d.lines_added).unwrap_or_default();
            let lines_deleted = data.map(|d| d.lines_deleted).unwrap_or_default();
            let diff_hash_value = data
                .map(|d| d.diff_hash.clone())
                .unwrap_or_else(String::new);

            let mut token_count = None;

            if let Some(diff_data) = data {
                if !diff_data.diff_hash.is_empty() {
                    if let Some(entry) = get_git_cached_entry(&root, &path) {
                        if entry.diff_hash == diff_data.diff_hash {
                            token_count = Some(entry.token_count);
                        }
                    }

                    if token_count.is_none() {
                        work_items.push(GitDiffWorkItem {
                            path: path.clone(),
                            diff_bytes: diff_data.diff_bytes.clone(),
                            diff_hash: diff_data.diff_hash.clone(),
                        });
                    }
                }
            }

            out.push(GitChange {
                path,
                change_type,
                lines_added,
                lines_deleted,
                token_count,
                diff_hash: diff_hash_value,
            });
        }
    }

    if !work_items.is_empty() {
        spawn_git_token_count_task(app.clone(), root.clone(), work_items);
    }

    Some(out)
}

fn classify_change(st: Status) -> Option<String> {
    use git2::Status as S;

    match st {
        s if s.intersects(S::CONFLICTED) => Some("conflicted".to_owned()),
        s if s.intersects(S::WT_RENAMED | S::INDEX_RENAMED) => Some("renamed".to_owned()),
        s if s.intersects(S::WT_DELETED | S::INDEX_DELETED) => Some("deleted".to_owned()),
        s if s.intersects(S::WT_NEW | S::INDEX_NEW) => Some("created".to_owned()),
        s if s.intersects(S::WT_TYPECHANGE | S::INDEX_TYPECHANGE) => Some("typechange".to_owned()),
        s if s.intersects(S::WT_MODIFIED | S::INDEX_MODIFIED) => Some("modified".to_owned()),
        _ => None,
    }
}

pub(crate) fn git_diff_text(root: &str, paths: Vec<String>) -> Option<String> {
    use git2::{DiffFindOptions, DiffFormat, DiffOptions};

    let repo = match Repository::discover(root) {
        Ok(r) => r,
        Err(e) if e.code() == ErrorCode::NotFound => return None,
        Err(_) => return Some(String::new()),
    };

    let head_tree = match repo.head().and_then(|h| h.peel_to_tree()) {
        Ok(t) => Some(t),
        Err(_) => {
            match repo
                .treebuilder(None)
                .and_then(|tb| tb.write())
                .and_then(|oid| repo.find_tree(oid))
            {
                Ok(t) => Some(t),
                Err(_) => None,
            }
        }
    };

    let mut opts = DiffOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true)
        .ignore_submodules(true)
        .include_typechange(true);

    if !paths.is_empty() {
        for path in &paths {
            opts.pathspec(path);
        }
    }

    let mut diff = match repo.diff_tree_to_workdir_with_index(head_tree.as_ref(), Some(&mut opts)) {
        Ok(d) => d,
        Err(_) => return Some(String::new()),
    };

    let mut find_opts = DiffFindOptions::new();
    find_opts.renames(true).copies(true);
    let _ = diff.find_similar(Some(&mut find_opts));

    let mut out = String::new();
    let _ = diff.print(DiffFormat::Patch, |_, _, line| {
        out.push_str(&String::from_utf8_lossy(line.content()));
        true
    });

    Some(out)
}
