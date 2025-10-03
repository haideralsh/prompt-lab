use crate::store::StoreDataKey;
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub trait InstructionEntry {
    fn name(&self) -> &str;
    fn content(&self) -> &str;
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Instruction {
    pub name: String,
    pub content: String,
}

impl InstructionEntry for Instruction {
    fn name(&self) -> &str {
        &self.name
    }

    fn content(&self) -> &str {
        &self.content
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SavedInstruction {
    pub id: String,
    pub name: String,
    pub content: String,
    pub token_count: Option<usize>,
    pub added_at: Option<u64>,
    pub updated_at: Option<u64>,
}

impl InstructionEntry for SavedInstruction {
    fn name(&self) -> &str {
        &self.name
    }

    fn content(&self) -> &str {
        &self.content
    }
}

pub enum ContentLengthMode {
    Full,
    Truncated,
}

pub fn get_saved_instructions(
    directory_object: &Value,
    display_mode: ContentLengthMode,
) -> Vec<SavedInstruction> {
    let Some(directory_object) = directory_object.as_object() else {
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
            let content_value = obj.get("content")?.as_str()?.to_string();
            let content = match display_mode {
                ContentLengthMode::Full => content_value,
                ContentLengthMode::Truncated => content_value.chars().take(256).collect(),
            };
            let token_count = obj
                .get("tokenCount")
                .and_then(|v| v.as_u64())
                .map(|v| v as usize);
            let added_at = obj.get("addedAt").and_then(|v| v.as_u64());
            let updated_at = obj.get("updatedAt").and_then(|v| v.as_u64());

            Some(SavedInstruction {
                id: id.to_string(),
                name,
                content,
                token_count,
                added_at,
                updated_at,
            })
        })
        .collect()
}
