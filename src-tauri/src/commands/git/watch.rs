use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::{
    collections::HashMap,
    path::Path,
    sync::{Arc, Mutex, OnceLock},
};
use tauri::{AppHandle, Wry};

pub(crate) struct GitWatcherHandle {
    #[allow(dead_code)]
    pub(crate) watcher: RecommendedWatcher,
}

static GIT_WATCHERS: OnceLock<Mutex<HashMap<String, Arc<GitWatcherHandle>>>> = OnceLock::new();

fn git_watchers_registry() -> &'static Mutex<HashMap<String, Arc<GitWatcherHandle>>> {
    GIT_WATCHERS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub(crate) fn ensure_git_watcher_started(app: AppHandle<Wry>, root: String) {
    if !Path::new(&root).exists() {
        return;
    }

    // Avoid duplicate watchers for the same root
    if let Ok(registry) = git_watchers_registry().lock() {
        if registry.contains_key(&root) {
            return;
        }
    }

    let watch_root = root.clone();
    let app_handle = app.clone();

    let mut watcher = match notify::recommended_watcher(move |res: notify::Result<Event>| {
        if res.is_err() {
            return;
        }

        let app = app_handle.clone();
        let root = watch_root.clone();

        tauri::async_runtime::spawn(async move {
            // Emit event on changes
            crate::commands::git::event::emit_git_status_event(app.clone(), root.clone());
        });
    }) {
        Ok(watcher) => watcher,
        Err(_) => return,
    };

    if watcher
        .watch(Path::new(&root), RecursiveMode::Recursive)
        .is_err()
    {
        return;
    }

    if let Ok(mut registry) = git_watchers_registry().lock() {
        if registry.contains_key(&root) {
            return;
        }

        registry.insert(root, Arc::new(GitWatcherHandle { watcher }));
    }
}
