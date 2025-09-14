use tauri::{Emitter, RunEvent};

pub fn handle_run_event(app_handle: &tauri::AppHandle, event: RunEvent) {
    match event {
        RunEvent::Exit => {
            let _ = app_handle.emit("application_exiting", ());
        }
        _ => {}
    }
}
