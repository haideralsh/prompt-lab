use serde_json::json;
use tauri::{AppHandle, Wry};

use crate::api::directory::lib::PickedDirectory;
use crate::errors::ApplicationError;
use crate::store::{open_store, save_store, StoreCategoryKey, StoreStateKey};

const MAX_RECENT: usize = 5;

#[tauri::command]
pub(crate) fn get_recent_directories(
    app: AppHandle<Wry>,
) -> Result<Vec<PickedDirectory>, ApplicationError> {
    let store = open_store(&app)?;

    let list = match store.get(StoreCategoryKey::STATE) {
        Some(value) => {
            if let Some(state_obj) = value.as_object() {
                if let Some(recent_dirs) = state_obj.get(StoreStateKey::RECENTLY_OPENED_DIRECTORIES)
                {
                    serde_json::from_value::<Vec<PickedDirectory>>(recent_dirs.clone())
                        .unwrap_or_default()
                } else {
                    Vec::new()
                }
            } else {
                Vec::new()
            }
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
) -> Result<(), ApplicationError> {
    let store = open_store(&app)?;

    let mut list = match store.get(StoreCategoryKey::STATE) {
        Some(value) => {
            if let Some(state_obj) = value.as_object() {
                if let Some(recent_dirs) = state_obj.get(StoreStateKey::RECENTLY_OPENED_DIRECTORIES)
                {
                    serde_json::from_value::<Vec<PickedDirectory>>(recent_dirs.clone())
                        .unwrap_or_default()
                } else {
                    Vec::new()
                }
            } else {
                Vec::new()
            }
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

    let state = json!({
        StoreStateKey::RECENTLY_OPENED_DIRECTORIES: list
    });
    store.set(StoreCategoryKey::STATE, state);
    save_store(&store)?;

    store.close_resource();

    Ok(())
}
