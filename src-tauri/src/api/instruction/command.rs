use serde_json::{json, Map, Value};
use std::{
    cmp::Ordering,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Wry};
use uuid::Uuid;

use crate::{
    api::{
        instruction::lib::{get_saved_instructions, ContentLengthMode, SavedInstruction},
        tokenize::count_tokens_for_text,
    },
    errors::{codes, ApplicationError},
    store::{open_store, save_store, StoreCategoryKey, StoreDataKey},
};

#[tauri::command]
pub fn upsert_instruction(
    app: AppHandle<Wry>,
    directory_path: String,
    name: String,
    content: String,
    instruction_id: Option<String>,
) -> Result<Option<String>, ApplicationError> {
    let store = open_store(&app)?;

    let current_timestamp = || match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_millis() as u64,
        Err(_) => 0,
    };

    let token_count = count_tokens_for_text(&content);
    let mut data: Map<String, Value> = store
        .get(StoreCategoryKey::DATA)
        .and_then(|value| value.as_object().cloned())
        .unwrap_or_else(Map::new);

    if let Some(instruction_id) = instruction_id {
        let mut updated = false;

        'outer: for directory_value in data.values_mut() {
            let Some(directory_object) = directory_value.as_object_mut() else {
                continue;
            };

            let Some(saved_instructions_value) =
                directory_object.get_mut(StoreDataKey::SAVED_INSTRUCTIONS)
            else {
                continue;
            };

            let Some(saved_instructions_object) = saved_instructions_value.as_object_mut() else {
                continue;
            };

            if saved_instructions_object.contains_key(&instruction_id) {
                let now = current_timestamp();
                let added_at = saved_instructions_object
                    .get(&instruction_id)
                    .and_then(|value| value.as_object())
                    .and_then(|obj| obj.get("addedAt"))
                    .and_then(|value| value.as_u64())
                    .unwrap_or(now);

                saved_instructions_object.insert(
                    instruction_id.clone(),
                    json!({
                        "id": instruction_id.clone(),
                        "name": name.clone(),
                        "content": content.clone(),
                        "tokenCount": token_count,
                        "addedAt": added_at,
                        "updatedAt": now,
                    }),
                );
                updated = true;
                break 'outer;
            }
        }

        if updated {
            store.set(StoreCategoryKey::DATA, Value::Object(data));
            save_store(&store)?;
            store.close_resource();
            return Ok(Some(instruction_id));
        }

        store.close_resource();
        return Ok(None);
    }

    let directory_entry = data
        .entry(directory_path.clone())
        .or_insert_with(|| Value::Object(Map::new()));

    if !directory_entry.is_object() {
        *directory_entry = Value::Object(Map::new());
    }

    let directory_object = directory_entry
        .as_object_mut()
        .expect("directory_entry must be an object");

    let saved_instructions_entry = directory_object
        .entry(StoreDataKey::SAVED_INSTRUCTIONS.to_string())
        .or_insert_with(|| Value::Object(Map::new()));

    if !saved_instructions_entry.is_object() {
        *saved_instructions_entry = Value::Object(Map::new());
    }

    let Some(saved_instructions_object) = saved_instructions_entry.as_object_mut() else {
        store.close_resource();
        return Ok(None);
    };

    let instruction_id = Uuid::new_v4().to_string();
    let now = current_timestamp();

    saved_instructions_object.insert(
        instruction_id.clone(),
        json!({
            "id": instruction_id,
            "name": name,
            "content": content,
            "tokenCount": token_count,
            "addedAt": now,
            "updatedAt": now,
        }),
    );

    store.set(StoreCategoryKey::DATA, Value::Object(data));
    save_store(&store)?;
    store.close_resource();

    Ok(Some(instruction_id))
}

#[tauri::command]
pub fn delete_instructions(
    app: AppHandle<Wry>,
    directory_path: String,
    instructions_ids: Vec<String>,
) -> Result<(), ApplicationError> {
    let store = open_store(&app)?;

    let mut data: Map<String, Value> = store
        .get(StoreCategoryKey::DATA)
        .and_then(|value| value.as_object().cloned())
        .unwrap_or_else(Map::new);

    let mut should_remove_directory_entry = false;

    if let Some(directory_value) = data.get_mut(&directory_path) {
        if let Some(directory_object) = directory_value.as_object_mut() {
            let mut should_remove_saved_instructions_key = false;

            if let Some(saved_instructions_value) =
                directory_object.get_mut(StoreDataKey::SAVED_INSTRUCTIONS)
            {
                if let Some(saved_instructions_object) = saved_instructions_value.as_object_mut() {
                    for instruction_id in instructions_ids {
                        saved_instructions_object.remove(&instruction_id);
                    }

                    if saved_instructions_object.is_empty() {
                        should_remove_saved_instructions_key = true;
                    }
                }
            }

            if should_remove_saved_instructions_key {
                directory_object.remove(StoreDataKey::SAVED_INSTRUCTIONS);
            }

            should_remove_directory_entry = directory_object.is_empty();
        }
    }

    if should_remove_directory_entry {
        data.remove(&directory_path);
    }

    store.set(StoreCategoryKey::DATA, Value::Object(data));
    save_store(&store)?;
    store.close_resource();

    Ok(())
}

#[tauri::command]
pub fn get_instruction(
    app: AppHandle<Wry>,
    directory_path: String,
    instruction_id: String,
) -> Result<SavedInstruction, ApplicationError> {
    let store = open_store(&app)?;

    let instruction = if let Some(data) = store.get(StoreCategoryKey::DATA) {
        if let Some(data_map) = data.as_object() {
            if let Some(dir) = data_map.get(&directory_path) {
                get_saved_instructions(dir, ContentLengthMode::Full)
                    .into_iter()
                    .find(|entry| entry.id == instruction_id)
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    store.close_resource();

    instruction.ok_or(ApplicationError {
        code: codes::STORE_READ_ERROR,
        message: Some("Instruction not found".to_string()),
    })
}

#[tauri::command]
pub fn list_instructions(
    app: AppHandle<Wry>,
    directory_path: String,
) -> Result<Vec<SavedInstruction>, ApplicationError> {
    let store = open_store(&app)?;

    let mut instructions = if let Some(data) = store.get(StoreCategoryKey::DATA) {
        if let Some(data_map) = data.as_object() {
            if let Some(dir) = data_map.get(&directory_path) {
                get_saved_instructions(dir, ContentLengthMode::Truncated)
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        }
    } else {
        Vec::new()
    };

    instructions.sort_by(|a, b| match (a.added_at, b.added_at) {
        (Some(a_ts), Some(b_ts)) => a_ts.cmp(&b_ts),
        (Some(_), None) => Ordering::Less,
        (None, Some(_)) => Ordering::Greater,
        (None, None) => Ordering::Equal,
    });

    store.close_resource();

    Ok(instructions)
}

#[tauri::command]
pub fn count_instruction_tokens(
    title: Option<String>,
    content: String,
) -> Result<usize, ApplicationError> {
    let instruction = match title {
        Some(t) => format!("{}\n{}", t, content),
        None => content,
    };

    Ok(count_tokens_for_text(&instruction))
}
