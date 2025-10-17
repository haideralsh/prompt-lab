use std::path::PathBuf;

use crate::errors::{codes, ApplicationError};
use crate::store::{open_store, save_store, StoreCategoryKey, StoreConfigKey};
use rfd::FileDialog;
use serde_json::{json, Map, Value};
use tauri::{AppHandle, Wry};
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub(crate) fn pick_editor() -> Result<String, ApplicationError> {
    let picked = FileDialog::new()
        .set_title("Choose an editor application")
        .pick_file();

    match picked {
        Some(path) => Ok(path.to_string_lossy().into_owned()),
        None => Err(ApplicationError {
            code: codes::DIALOG_CANCELLED,
            message: None,
        }),
    }
}

#[tauri::command]
pub(crate) fn set_editor(app: AppHandle<Wry>, editor_path: String) -> Result<(), ApplicationError> {
    let store = open_store(&app)?;

    let mut config = store
        .get(StoreCategoryKey::CONFIG)
        .and_then(|v| v.as_object().cloned())
        .unwrap_or_else(|| Map::new());

    config.insert(StoreConfigKey::EDITOR.to_string(), json!(editor_path));

    store.set(StoreCategoryKey::CONFIG, Value::Object(config));
    save_store(&store)?;

    Ok(())
}

#[tauri::command]
pub(crate) fn get_editor(app: AppHandle<Wry>) -> Result<Option<String>, ApplicationError> {
    let store = open_store(&app)?;

    let editor_path = store
        .get(StoreCategoryKey::CONFIG)
        .and_then(|v| v.as_object().cloned())
        .and_then(|config| config.get(StoreConfigKey::EDITOR).cloned())
        .and_then(|v| v.as_str().map(|s| s.to_string()));

    Ok(editor_path)
}

fn resolve_editor(app: &AppHandle<Wry>) -> Result<Option<String>, ApplicationError> {
    let store = open_store(app)?;

    let editor_from_store = store
        .get(StoreCategoryKey::CONFIG)
        .and_then(|value| value.as_object().cloned())
        .and_then(|config| config.get(StoreConfigKey::EDITOR).cloned())
        .and_then(|value| match value {
            serde_json::Value::String(value) => {
                let trimmed = value.trim().to_string();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed)
                }
            }
            _ => None,
        });

    store.close_resource();

    Ok(editor_from_store)
}

#[tauri::command]
pub(crate) fn open_with_editor(app: AppHandle<Wry>, path: &str) -> Result<(), ApplicationError> {
    let path_buf = PathBuf::from(path);

    if !path_buf.exists() {
        return Err(ApplicationError {
            code: codes::FILE_OPEN_ERROR,
            message: Some(format!("Path does not exist: {}", path_buf.display())),
        });
    }

    let editor = resolve_editor(&app)?;

    // TODO: still not sure if we should error out, or just use the system default editor.

    // if editor.is_none() {
    //     return Err(ApplicationError {
    //         code: codes::FILE_OPEN_ERROR,
    //         message: Some(
    //             "No editor configured. Configure an editor to use in the settings.".to_string(),
    //         ),
    //     });
    // }

    let path_string = path_buf.to_string_lossy().into_owned();

    app.opener()
        .open_path(path_string, editor)
        .map_err(|err| ApplicationError {
            code: codes::FILE_OPEN_ERROR,
            message: Some(format!(
                "Failed to open editor for {}: {}",
                path_buf.display(),
                err
            )),
        })
}
