use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Emitter, Manager, RunEvent, WindowEvent};

pub struct ShutdownState {
    allow_exit: AtomicBool,
}

impl Default for ShutdownState {
    fn default() -> Self {
        Self {
            allow_exit: AtomicBool::new(false),
        }
    }
}

impl ShutdownState {
    pub fn allow_exit(&self) -> bool {
        self.allow_exit.load(Ordering::SeqCst)
    }

    pub fn set_allow_exit(&self, val: bool) {
        self.allow_exit.store(val, Ordering::SeqCst);
    }
}

pub fn handle_run_event(app_handle: &tauri::AppHandle, event: RunEvent) {
    match event {
        RunEvent::Exit => {
            let shutdown = app_handle.state::<ShutdownState>();
            if !shutdown.allow_exit() {
                let _ = app_handle.emit("application_exiting", ());
            }
        }

        RunEvent::ExitRequested { api, .. } => {
            let shutdown = app_handle.state::<ShutdownState>();
            if !shutdown.allow_exit() {
                api.prevent_exit();
                let _ = app_handle.emit("application_exiting", ());
            }
        }
        RunEvent::WindowEvent { event, .. } => {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let shutdown = app_handle.state::<ShutdownState>();
                if !shutdown.allow_exit() {
                    api.prevent_close();
                    let _ = app_handle.emit("application_exiting", ());
                }
            }
        }
        _ => {}
    }
}

pub fn handle_window_event(window: &tauri::Window, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        let app = window.app_handle();
        let shutdown = app.state::<ShutdownState>();
        if !shutdown.allow_exit() {
            api.prevent_close();
            let _ = app.emit("application_exiting", ());
        }
    }
}
