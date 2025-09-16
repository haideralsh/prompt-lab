use serde_json::Value;
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_store::StoreExt;

use crate::errors::{codes, StoreError};

const STORE_FILE: &str = "store.json";
const KEY_APP_STATE: &str = "APP_STATE";

#[tauri::command]
pub(crate) fn persist_application_data_and_exit(
    app: AppHandle<Wry>,
    state: Value,
) -> Result<(), StoreError> {
    let store = app.store(STORE_FILE).map_err(|_| StoreError {
        code: codes::STORE_READ_ERROR,
        message: Some("Failed to open store".to_string()),
    })?;

    store.set(KEY_APP_STATE, state);
    store.save().map_err(|_| StoreError {
        code: codes::STORE_WRITE_ERROR,
        message: Some("Failed to save store".to_string()),
    })?;

    store.close_resource();

    let shutdown = app.state::<crate::lifecycle::ShutdownState>();
    shutdown.set_allow_exit(true);
    app.exit(0);

    Ok(())
}

#[tauri::command]
pub(crate) fn load_application_data(app: AppHandle<Wry>) -> Result<Value, StoreError> {
    let store = app.store(STORE_FILE).map_err(|_| StoreError {
        code: codes::STORE_READ_ERROR,
        message: Some("Failed to open store".to_string()),
    })?;

    let data = store.get(KEY_APP_STATE).unwrap_or(Value::Null);

    Ok(data)
}
