use serde_json::json;
use tauri::{AppHandle, Wry};
use tauri_plugin_store::StoreExt;

use crate::errors::{codes, StoreError};
use crate::models::PickedDirectory;

const STORE_FILE: &str = "store.json";
const KEY_RECENT: &str = "RECENTLY_OPENED";
const MAX_RECENT: usize = 5;

#[tauri::command]
pub(crate) fn get_recent_directories(
    app: AppHandle<Wry>,
) -> Result<Vec<PickedDirectory>, StoreError> {
    let store = app.store(STORE_FILE).map_err(|_| StoreError {
        code: codes::STORE_READ_ERROR,
        message: Some("Failed to open store".to_string()),
    })?;

    let list = match store.get(KEY_RECENT) {
        Some(value) => {
            serde_json::from_value::<Vec<PickedDirectory>>(value.clone()).unwrap_or_default()
        }
        None => Vec::new(),
    };

    store.close_resource();

    Ok(list)
}

#[tauri::command]
pub(crate) fn add_recent_directory(
    app: AppHandle<Wry>,
    directory: PickedDirectory,
) -> Result<(), StoreError> {
    let store = app.store(STORE_FILE).map_err(|_| StoreError {
        code: codes::STORE_READ_ERROR,
        message: Some("Failed to open store".to_string()),
    })?;

    let mut list = match store.get(KEY_RECENT) {
        Some(value) => {
            serde_json::from_value::<Vec<PickedDirectory>>(value.clone()).unwrap_or_default()
        }
        None => Vec::new(),
    };

    if list.len() > 0 {
        list.retain(|item| item.path != directory.path);
    }

    list.insert(0, directory);

    if list.len() > MAX_RECENT {
        list.truncate(MAX_RECENT);
    }

    store.set(KEY_RECENT, json!(list));
    store.save().map_err(|_| StoreError {
        code: codes::STORE_WRITE_ERROR,
        message: Some("Failed to save store".to_string()),
    })?;

    store.close_resource();

    Ok(())
}
