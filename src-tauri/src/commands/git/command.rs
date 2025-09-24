use crate::{
    commands::git::diff::{
        classify_change, diff_hash, ensure_git_cache_loaded_for_dir, get_git_cached_entry,
        spawn_git_token_count_task,
    },
    models::{GitChange, GitDiffData, GitDiffWorkItem},
};
use git2::{
    DiffFindOptions, DiffOptions, ErrorCode, Patch, Repository, Status, StatusOptions, StatusShow,
};
use std::{collections::HashMap, sync::Arc};
use tauri::{AppHandle, Wry};

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
