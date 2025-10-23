use std::path::PathBuf;

use crate::api::editor::lib::resolve_editor;
use crate::errors::{codes, ApplicationError};
use crate::store::{open_store, save_store, StoreCategoryKey, StoreConfigKey};
use rfd::FileDialog;
use serde_json::{json, Map, Value};
use tauri::AppHandle;
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
pub(crate) fn set_editor<R: tauri::Runtime>(
    app: AppHandle<R>,
    editor_path: String,
) -> Result<(), ApplicationError> {
    let store = open_store(&app)?;

    let mut config = store
        .get(StoreCategoryKey::CONFIG)
        .and_then(|v| v.as_object().cloned())
        .unwrap_or_else(|| Map::new());

    set_editor_in_config(&mut config, editor_path);

    store.set(StoreCategoryKey::CONFIG, Value::Object(config));
    save_store(&store)?;

    Ok(())
}

#[tauri::command]
pub(crate) fn get_editor<R: tauri::Runtime>(
    app: AppHandle<R>,
) -> Result<Option<String>, ApplicationError> {
    let store = open_store(&app)?;

    let config = store
        .get(StoreCategoryKey::CONFIG)
        .and_then(|v| v.as_object().cloned())
        .unwrap_or_else(|| Map::new());

    Ok(get_editor_from_config(&config))
}

// Pure helper: set the editor path into a config map. This is intentionally
// independent of `tauri` so tests can exercise the logic without requiring
// a tauri runtime or mocked app handle.
pub fn set_editor_in_config(config: &mut Map<String, Value>, editor_path: String) {
    config.insert(StoreConfigKey::EDITOR.to_string(), json!(editor_path));
}

// Pure helper: read the editor path from a config map.
pub fn get_editor_from_config(config: &Map<String, Value>) -> Option<String> {
    config
        .get(StoreConfigKey::EDITOR)
        .and_then(|v| v.as_str().map(|s| s.to_string()))
}

#[tauri::command]
pub(crate) fn open_with_editor<R: tauri::Runtime>(
    app: AppHandle<R>,
    path: &str,
) -> Result<(), ApplicationError> {
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
