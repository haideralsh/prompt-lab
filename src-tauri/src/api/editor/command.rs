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

    config.insert(StoreConfigKey::EDITOR.to_string(), json!(editor_path));

    store.set(StoreCategoryKey::CONFIG, Value::Object(config));
    save_store(&store)?;

    Ok(())
}

#[tauri::command]
pub(crate) fn get_editor<R: tauri::Runtime>(
    app: AppHandle<R>,
) -> Result<Option<String>, ApplicationError> {
    let store = open_store(&app)?;

    let editor_path = store
        .get(StoreCategoryKey::CONFIG)
        .and_then(|v| v.as_object().cloned())
        .and_then(|config| config.get(StoreConfigKey::EDITOR).cloned())
        .and_then(|v| v.as_str().map(|s| s.to_string()));

    Ok(editor_path)
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

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::{mock_builder, mock_context, noop_assets};
    use tauri_plugin_store::Builder as StoreBuilder;

    // These tests are for both get_editor and set_editor functions
    // since the get_editor function is used implicitly in the test to verify store contents
    #[test]
    fn test_set_editor_happy_path() {
        let context = mock_context(noop_assets());
        let app = mock_builder()
            .plugin(StoreBuilder::new().build())
            .build(context)
            .expect("failed to build app");

        let initial = get_editor(app.handle().clone()).unwrap();
        assert!(initial.is_none());

        let editor_path = "/Applications/TestEditor.app".to_string();
        set_editor(app.handle().clone(), editor_path.clone()).expect("set_editor should succeed");

        let retrieved = get_editor(app.handle().clone()).unwrap();
        assert_eq!(retrieved, Some(editor_path));
    }

    #[test]
    fn test_set_editor_overwrites_existing() {
        let context = mock_context(noop_assets());
        let app = mock_builder()
            .plugin(StoreBuilder::new().build())
            .build(context)
            .expect("failed to build app");

        // initial set
        let first = "/Applications/FirstEditor.app".to_string();
        set_editor(app.handle().clone(), first.clone()).expect("first set should succeed");

        let retrieved = get_editor(app.handle().clone()).unwrap();
        assert_eq!(retrieved, Some(first.clone()));

        // overwrite with a new path
        let second = "/Applications/SecondEditor.app".to_string();
        set_editor(app.handle().clone(), second.clone()).expect("second set should succeed");

        let retrieved2 = get_editor(app.handle().clone()).unwrap();
        assert_eq!(retrieved2, Some(second));
    }
}
