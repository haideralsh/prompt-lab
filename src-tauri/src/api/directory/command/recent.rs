use serde_json::{json, Value};
use tauri::{AppHandle, Wry};

use crate::api::directory::lib::PickedDirectory;
use crate::errors::ApplicationError;
use crate::store::{open_store, save_store, StoreCategoryKey, StoreStateKey};

const MAX_RECENT: usize = 5;

pub fn get_recent_directories_from_state(state: Option<&Value>) -> Vec<PickedDirectory> {
    match state {
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
    }
}

#[tauri::command]
pub(crate) fn get_recent_directories(
    app: AppHandle<Wry>,
) -> Result<Vec<PickedDirectory>, ApplicationError> {
    let store = open_store(&app)?;
    let state = store.get(StoreCategoryKey::STATE);
    let list = get_recent_directories_from_state(state.as_ref());
    store.close_resource();
    Ok(list)
}

pub fn update_recent_directories(
    current_state: Option<&Value>,
    directory: PickedDirectory,
) -> Value {
    let mut list = get_recent_directories_from_state(current_state);

    if list.len() > 0 {
        list.retain(|item| item.path != directory.path);
    }

    list.insert(0, directory);

    if list.len() > MAX_RECENT {
        list.truncate(MAX_RECENT);
    }

    json!({
        StoreStateKey::RECENTLY_OPENED_DIRECTORIES: list
    })
}

#[tauri::command]
pub(crate) fn add_recent_directory(
    app: AppHandle<Wry>,
    directory: PickedDirectory,
) -> Result<(), ApplicationError> {
    let store = open_store(&app)?;
    let current_state = store.get(StoreCategoryKey::STATE);
    let new_state = update_recent_directories(current_state.as_ref(), directory);
    store.set(StoreCategoryKey::STATE, new_state);
    save_store(&store)?;
    store.close_resource();
    Ok(())
}
