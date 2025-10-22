use tauri::AppHandle;

use crate::errors::ApplicationError;
use crate::store::{open_store, StoreCategoryKey, StoreConfigKey};
use serde_json::{Map, Value};

pub fn resolve_editor<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Option<String>, ApplicationError> {
    let store = open_store(app)?;

    let editor_from_store = store
        .get(StoreCategoryKey::CONFIG)
        .and_then(|value| value.as_object().cloned())
        .and_then(|config| get_editor_from_config(&config));

    store.close_resource();

    Ok(editor_from_store)
}

// Pure helper: read the editor path from a config map. This mirrors the
// logic used by `resolve_editor` but is independent of `tauri` so tests
// can exercise the trimming/empty-string behavior without a runtime.
pub(crate) fn get_editor_from_config(config: &Map<String, Value>) -> Option<String> {
    config
        .get(StoreConfigKey::EDITOR)
        .and_then(|v| v.as_str().map(|s| s.trim().to_string()))
        .and_then(|s| if s.is_empty() { None } else { Some(s) })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{Map, Value};

    #[test]
    fn test_get_editor_from_config_missing() {
        let config = Map::new();

        assert_eq!(get_editor_from_config(&config), None);
    }

    #[test]
    fn test_get_editor_from_config_valid() {
        let mut config = Map::new();
        let editor_path = "/Applications/TestEditor.app".to_string();
        config.insert(
            StoreConfigKey::EDITOR.to_string(),
            Value::String(editor_path.clone()),
        );

        assert_eq!(get_editor_from_config(&config), Some(editor_path));
    }

    #[test]
    fn test_get_editor_from_config_whitespace_only() {
        let mut config = Map::new();
        config.insert(
            StoreConfigKey::EDITOR.to_string(),
            Value::String("   \n\t  ".to_string()),
        );

        assert_eq!(get_editor_from_config(&config), None);
    }
}
