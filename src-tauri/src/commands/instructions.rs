use serde_json::{json, Map, Value};
use tauri::{AppHandle, Wry};
use uuid::Uuid;

use crate::{
    commands::tokenize::count_tokens_for_text,
    models::SavedInstruction,
    store::{open_store, StoreCategoryKey, StoreDataKey},
};

fn extract_saved_instructions_from_directory(value: &Value) -> Vec<SavedInstruction> {
    let Some(directory_object) = value.as_object() else {
        return Vec::new();
    };

    let Some(saved_instructions_value) = directory_object.get(StoreDataKey::SAVED_INSTRUCTIONS)
    else {
        return Vec::new();
    };

    let Some(saved_instructions_object) = saved_instructions_value.as_object() else {
        return Vec::new();
    };

    saved_instructions_object
        .iter()
        .filter_map(|(id, entry)| {
            let obj = entry.as_object()?;
            let name = obj.get("name")?.as_str()?.to_string();
            let content = obj.get("content")?.as_str()?.to_string();
            let token_count = obj
                .get("tokenCount")
                .and_then(|v| v.as_u64())
                .map(|v| v as usize);

            Some(SavedInstruction {
                id: id.to_string(),
                name,
                content,
                token_count,
            })
        })
        .collect()
}

#[tauri::command]
pub fn save_instruction(
    app: AppHandle<Wry>,
    directory_path: String,
    name: String,
    content: String,
) -> Result<String, String> {
    let store = open_store(&app)?;

    let instruction_id = Uuid::new_v4().to_string();
    let token_count = count_tokens_for_text(&content);

    let mut data: Map<String, Value> = store
        .get(StoreCategoryKey::DATA)
        .and_then(|value| value.as_object().cloned())
        .unwrap_or_else(Map::new);

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

    if let Some(saved_instructions_object) = saved_instructions_entry.as_object_mut() {
        saved_instructions_object.insert(
            instruction_id.clone(),
            json!({
                "id": instruction_id,
                "name": name,
                "content": content,
                "tokenCount": token_count,
            }),
        );
    }

    store.set(StoreCategoryKey::DATA, Value::Object(data));
    store.save().map_err(|e| format!("store save error: {e}"))?;
    store.close_resource();

    Ok(instruction_id)
}

#[tauri::command]
pub fn list_instructions(
    app: AppHandle<Wry>,
    directory_path: String,
) -> Result<Vec<SavedInstruction>, String> {
    let store = open_store(&app)?;

    let instructions = if let Some(data) = store.get(StoreCategoryKey::DATA) {
        if let Some(data_map) = data.as_object() {
            if let Some(dir_value) = data_map.get(&directory_path) {
                extract_saved_instructions_from_directory(dir_value)
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        }
    } else {
        Vec::new()
    };

    store.close_resource();

    Ok(instructions)
}
