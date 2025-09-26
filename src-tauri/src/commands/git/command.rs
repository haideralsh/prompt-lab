use crate::{
    commands::git::{
        status::{compute_git_status, GitStatusComputation},
        tokenize::spawn_git_token_count_task,
        watch::ensure_git_watcher_started,
    },
    models::GitChange,
};
use tauri::{AppHandle, Wry};

#[tauri::command]
pub(crate) fn get_git_status(
    app: AppHandle<Wry>,
    directory_path: String,
) -> Option<Vec<GitChange>> {
    match compute_git_status(&app, &directory_path) {
        GitStatusComputation::NotRepository => None,
        GitStatusComputation::Finished {
            changes,
            work_items,
        } => {
            if !work_items.is_empty() {
                spawn_git_token_count_task(app.clone(), directory_path.clone(), work_items);
            }
            Some(changes)
        }
    }
}

#[tauri::command]
pub(crate) fn watch_directory_for_git_changes(app: AppHandle<Wry>, directory_path: String) {
    ensure_git_watcher_started(app, directory_path);
}
