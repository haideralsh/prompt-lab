use git2::{ErrorCode, Repository, Status, StatusOptions, StatusShow};
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitChange {
    pub path: String,
    pub change_type: String,
}

#[tauri::command]
pub(crate) fn git_status(root: String) -> Option<Vec<GitChange>> {
    let repo = match Repository::discover(root) {
        Ok(r) => r,
        Err(e) if e.code() == ErrorCode::NotFound => return None,
        Err(_) => return Some(Vec::new()),
    };

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
            out.push(GitChange { path, change_type });
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
