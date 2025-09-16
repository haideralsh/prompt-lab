use serde_json::Value;
use tauri::{AppHandle, Wry};
use tauri_plugin_store::StoreExt;

use crate::errors::{codes, StoreError};

const STORE_FILE: &str = "store.json";
const KEY_APP_STATE: &str = "APP_STATE";

#[tauri::command]
pub(crate) fn load_application_data(app: AppHandle<Wry>) -> Result<Value, StoreError> {
    let store = app.store(STORE_FILE).map_err(|_| StoreError {
        code: codes::STORE_READ_ERROR,
        message: Some("Failed to open store".to_string()),
    })?;

    let data = store.get(KEY_APP_STATE).unwrap_or(Value::Null);

    Ok(data)
}
