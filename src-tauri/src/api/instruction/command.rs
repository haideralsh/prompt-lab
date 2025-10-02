use serde_json::{json, Map, Value};
use tauri::{AppHandle, Wry};
use uuid::Uuid;

use crate::{
    api::{
        instruction::lib::{get_saved_instructions, ContentLengthMode, SavedInstruction},
        tokenize::count_tokens_for_text,
    },
    errors::ApplicationError,
    store::{open_store, save_store, StoreCategoryKey, StoreDataKey},
};

#[tauri::command]
pub fn save_instruction(
    app: AppHandle<Wry>,
    directory_path: String,
    name: String,
    content: String,
) -> Result<String, ApplicationError> {
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
    save_store(&store)?;
    store.close_resource();

    Ok(instruction_id)
}

#[tauri::command]
pub fn list_instructions(
    app: AppHandle<Wry>,
    directory_path: String,
) -> Result<Vec<SavedInstruction>, ApplicationError> {
    let store = open_store(&app)?;

    let instructions = if let Some(data) = store.get(StoreCategoryKey::DATA) {
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

    store.close_resource();

    Ok(instructions)
}
