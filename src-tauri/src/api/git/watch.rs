use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::{
    collections::HashMap,
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
    time::{Duration, Instant},
};
use tauri::{AppHandle, Wry};

const DEBOUNCE_DURATION_MS: u64 = 2000;

pub(crate) struct GitWatcherHandle {
    #[allow(dead_code)]
    pub(crate) watcher: RecommendedWatcher,
}

struct DebounceState {
    last_event: Mutex<Instant>,
    pending: AtomicBool,
}

static GIT_WATCHERS: OnceLock<Mutex<HashMap<String, Arc<GitWatcherHandle>>>> = OnceLock::new();
static DEBOUNCE_STATE: OnceLock<Mutex<HashMap<String, Arc<DebounceState>>>> = OnceLock::new();

fn git_watchers_registry() -> &'static Mutex<HashMap<String, Arc<GitWatcherHandle>>> {
    GIT_WATCHERS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn debounce_registry() -> &'static Mutex<HashMap<String, Arc<DebounceState>>> {
    DEBOUNCE_STATE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn get_or_create_debounce_state(root: &str) -> Arc<DebounceState> {
    let mut registry = debounce_registry().lock().unwrap();
    registry
        .entry(root.to_string())
        .or_insert_with(|| {
            Arc::new(DebounceState {
                last_event: Mutex::new(Instant::now() - Duration::from_secs(10)),
                pending: AtomicBool::new(false),
            })
        })
        .clone()
}

pub(crate) fn ensure_git_watcher_started(app: AppHandle<Wry>, root: String) {
    if !Path::new(&root).exists() {
        return;
    }

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

        let debounce_state = get_or_create_debounce_state(&watch_root);

        if let Ok(mut last_event) = debounce_state.last_event.lock() {
            *last_event = Instant::now();
        }

        if debounce_state
            .pending
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_err()
        {
            return;
        }

        let app = app_handle.clone();
        let root = watch_root.clone();
        let state = debounce_state.clone();
        let debounce_duration = Duration::from_millis(DEBOUNCE_DURATION_MS);

        std::thread::spawn(move || loop {
            std::thread::sleep(debounce_duration);

            let elapsed = state
                .last_event
                .lock()
                .map(|t| t.elapsed())
                .unwrap_or(Duration::ZERO);

            if elapsed >= debounce_duration {
                state.pending.store(false, Ordering::SeqCst);
                tauri::async_runtime::spawn(async move {
                    crate::api::git::event::emit_git_status_event(app.clone(), root.clone());
                });
                break;
            }
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
