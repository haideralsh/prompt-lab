use tauri::{AppHandle, Wry};

use crate::errors::ApplicationError;
use crate::store::{open_store, StoreCategoryKey, StoreConfigKey};

pub fn resolve_editor(app: &AppHandle<Wry>) -> Result<Option<String>, ApplicationError> {
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
