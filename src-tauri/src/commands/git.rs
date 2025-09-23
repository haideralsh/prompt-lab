use git2::{ErrorCode, Repository, Status, StatusOptions, StatusShow};
use serde::Serialize;
use std::collections::HashMap;

use super::tokenize::count_tokens_for_text;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitChange {
    pub path: String,
    pub change_type: String,
    pub lines_added: i32,
    pub lines_deleted: i32,
    pub token_count: usize,
}

#[tauri::command]
pub(crate) fn git_status(root: String) -> Option<Vec<GitChange>> {
    let repo = match Repository::discover(&root) {
        Ok(r) => r,
        Err(e) if e.code() == ErrorCode::NotFound => return None,
        Err(_) => return Some(Vec::new()),
    };

    use git2::{DiffFindOptions, DiffOptions, Patch};

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

    let mut file_changes: HashMap<String, (i32, i32)> = HashMap::new();

    let deltas_len = diff.deltas().len();
    for i in 0..deltas_len {
        if let Ok(Some(patch)) = Patch::from_diff(&diff, i) {
            let (_ctx, adds, dels) = patch.line_stats().unwrap_or((0, 0, 0));

            let delta = patch.delta();
            if let Some(path) = delta
                .new_file()
                .path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().into_owned())
            {
                file_changes.insert(path, (adds as i32, dels as i32));
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
    let mut token_counts: HashMap<String, usize> = HashMap::new();

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
            let (lines_added, lines_deleted) = file_changes.get(&path).copied().unwrap_or((0, 0));
            let token_count = if let Some(count) = token_counts.get(&path) {
                *count
            } else {
                let count = git_diff_text(&root, vec![path.clone()])
                    .map(|diff| count_tokens_for_text(&diff))
                    .unwrap_or(0);
                token_counts.insert(path.clone(), count);
                count
            };
            out.push(GitChange {
                path,
                change_type,
                lines_added,
                lines_deleted,
                token_count,
            });
        }
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
