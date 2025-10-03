use std::path::PathBuf;

use tauri::{AppHandle, Wry};
use tauri_plugin_opener::OpenerExt;

use crate::errors::{codes, ApplicationError};
use crate::store::{open_store, StoreCategoryKey, StoreConfigKey};

fn resolve_editor(app: &AppHandle<Wry>) -> Result<String, ApplicationError> {
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

    if let Some(editor) = editor_from_store {
        return Ok(editor);
    }

    Err(ApplicationError {
        code: codes::FILE_OPEN_ERROR,
        message: Some(
            "No editor is configured and no default editor was found. Set one in the application settings."
                .to_string(),
        ),
    })
}

#[tauri::command]
pub(crate) fn open_file(app: AppHandle<Wry>, path: &str) -> Result<(), ApplicationError> {
    let path_buf = PathBuf::from(path);

    if !path_buf.exists() {
        return Err(ApplicationError {
            code: codes::FILE_OPEN_ERROR,
            message: Some(format!("Path does not exist: {}", path_buf.display())),
        });
    }

    let editor = resolve_editor(&app)?;
    let path_string = path_buf.to_string_lossy().into_owned();

    app.opener()
        .open_path(path_string, Some(editor))
        .map_err(|err| ApplicationError {
            code: codes::FILE_OPEN_ERROR,
            message: Some(format!(
                "Failed to open editor for {}: {}",
                path_buf.display(),
                err
            )),
        })
}
