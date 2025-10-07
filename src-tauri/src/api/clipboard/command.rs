use std::collections::HashSet;
use tauri::{AppHandle, Wry};

use crate::api::clipboard::lib::{
    build_clipboard_content, build_web_pages_section, format_instruction_entries,
    get_rendered_tree, write_to_clipboard,
};
use crate::api::git::status::git_diff_text;
use crate::api::instruction::lib::{get_saved_instructions, ContentLengthMode, Instruction};
use crate::api::tree::index::DirectoryNode;
use crate::api::web::lib::load_page_contents_from_store;
use crate::errors::ApplicationError;
use crate::store::{open_store, StoreCategoryKey};

#[tauri::command]
pub(crate) fn copy_instructions_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    instruction_ids: Vec<String>,
    instructions: Vec<Instruction>,
) -> Result<(), ApplicationError> {
    let store = open_store(&app)?;

    let stored_instructions = store
        .get(StoreCategoryKey::DATA)
        .and_then(|data| data.as_object().cloned())
        .and_then(|data_map| data_map.get(&directory_path).cloned())
        .map(|directory_value| get_saved_instructions(&directory_value, ContentLengthMode::Full))
        .unwrap_or_default();

    store.close_resource();

    let mut meta_instructions = Vec::new();
    for id in &instruction_ids {
        if let Some(entry) = stored_instructions.iter().find(|i| i.id == *id) {
            meta_instructions.push(entry.clone());
        }
    }

    let meta_section = format_instruction_entries(&meta_instructions);
    let user_section = format_instruction_entries(&instructions);

    let mut sections = Vec::new();
    if !meta_section.is_empty() {
        sections.push(format!(
            "<meta_instructions>\n{}\n</meta_instructions>",
            meta_section
        ));
    }

    if !user_section.is_empty() {
        sections.push(format!(
            "<user_instructions>\n{}\n</user_instructions>",
            user_section
        ));
    }

    let payload = sections.join("\n\n");

    write_to_clipboard(&app, payload)
}

#[tauri::command]
pub(crate) fn copy_diffs_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    paths: Vec<String>,
) -> Result<(), ApplicationError> {
    let diff = match git_diff_text(&directory_path, paths) {
        Some(content) => content,
        None => return Ok(()),
    };

    write_to_clipboard(&app, diff)
}

#[tauri::command]
pub(crate) fn copy_all_to_clipboard(
    app: AppHandle<Wry>,
    tree_mode: String,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
    git_diff_paths: Vec<String>,
    root: String,
    urls: Option<Vec<String>>,
) -> Result<(), ApplicationError> {
    let rendered_tree = get_rendered_tree(&tree_mode, &full_tree, &selected_nodes);

    let base_payload =
        build_clipboard_content(git_diff_paths, &selected_nodes, &rendered_tree, &root)?;

    let web_pages_section = build_web_pages_section(&app, &root, &urls)?;
    let payload = if web_pages_section.is_empty() {
        base_payload
    } else {
        format!("{}{}", base_payload, web_pages_section)
    };

    write_to_clipboard(&app, payload)
}

#[tauri::command]
pub(crate) fn copy_files_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    tree_mode: String,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
) -> Result<(), ApplicationError> {
    let rendered_tree = get_rendered_tree(&tree_mode, &full_tree, &selected_nodes);

    let payload =
        build_clipboard_content(Vec::new(), &selected_nodes, &rendered_tree, &directory_path)?;

    write_to_clipboard(&app, payload)
}

#[tauri::command]
pub(crate) fn copy_pages_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    urls: Vec<String>,
) -> Result<(), ApplicationError> {
    const PAGE_SEPARATOR: &str = "\n\nEnd of web page.\n###\n\n";

    let parts = load_page_contents_from_store(&app, &directory_path, &urls)?;

    let payload = parts.join(PAGE_SEPARATOR);

    write_to_clipboard(&app, payload)
}
