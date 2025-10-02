use crate::commands::git::{
    status::{compute_git_status, GitChange, GitStatusComputation},
    tokenize::spawn_git_token_count_task,
};
use serde::Serialize;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Wry};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GitTokenCountsEvent {
    pub(crate) root: String,
    pub(crate) files: HashMap<String, usize>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GitStatusEvent {
    pub(crate) root: String,
    pub(crate) changes: Vec<GitChange>,
}

pub(crate) fn emit_git_status_event(app: AppHandle<Wry>, directory_path: String) {
    match compute_git_status(&app, &directory_path) {
        GitStatusComputation::NotRepository => {}
        GitStatusComputation::Finished {
            changes,
            work_items,
        } => {
            if !work_items.is_empty() {
                spawn_git_token_count_task(app.clone(), directory_path.clone(), work_items);
            }

            let _ = app.emit(
                "git-status-updated",
                GitStatusEvent {
                    root: directory_path,
                    changes,
                },
            );
        }
    }
}

pub(crate) fn emit_git_token_counts_event(app: &AppHandle<Wry>, event: GitTokenCountsEvent) {
    let _ = app.emit("git-token-counts", event);
}
