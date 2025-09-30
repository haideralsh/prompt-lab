use arboard::Clipboard;
use std::collections::HashSet;

use crate::commands::clipboard::lib::{
    build_clipboard_content, build_web_pages_section, format_instruction_entries,
    get_rendered_tree, page_not_found,
};
use crate::commands::git::status::git_diff_text;
use crate::commands::instructions::{extract_saved_instructions, ContentDisplay};
use crate::commands::web::load_page_contents_from_store;
use crate::errors::{codes, ClipboardError};
use crate::models::{DirectoryNode, SavedInstruction};
use crate::store::{open_store, StoreCategoryKey};
use tauri::{AppHandle, Wry};

#[tauri::command]
pub(crate) fn copy_instructions_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    instruction_ids: Vec<String>,
    instructions: Vec<SavedInstruction>,
) -> Result<(), ClipboardError> {
    let store = open_store(&app).map_err(|_| ClipboardError {
        code: codes::STORE_READ_ERROR,
        message: Some("Failed to open store".to_string()),
    })?;

    let stored_instructions_map = store
        .get(StoreCategoryKey::DATA)
        .and_then(|data| data.as_object().cloned())
        .and_then(|data_map| data_map.get(&directory_path).cloned())
        .map(|directory_value| extract_saved_instructions(&directory_value, ContentDisplay::Full))
        .unwrap_or_default();

    store.close_resource();

    let mut meta_instructions = Vec::new();
    for id in &instruction_ids {
        if let Some(entry) = stored_instructions_map.get(id) {
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

    let mut clipboard = Clipboard::new().map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to access system clipboard".to_string()),
    })?;

    clipboard.set_text(payload).map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to write to system clipboard".to_string()),
    })
}

#[tauri::command]
pub(crate) fn copy_diffs_to_clipboard(
    directory_path: String,
    paths: Vec<String>,
) -> Result<(), ClipboardError> {
    let diff = match git_diff_text(&directory_path, paths) {
        Some(content) => content,
        None => {
            return Err(ClipboardError {
                code: codes::FILE_READ_ERROR,
                message: Some("This directory does not appear to be a Git repository.".to_string()),
            })
        }
    };

    if diff.trim().is_empty() {
        return Err(ClipboardError {
            code: codes::FILE_READ_ERROR,
            message: Some("No diff available for the selected files.".to_string()),
        });
    }

    let mut clipboard = Clipboard::new().map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to access system clipboard".to_string()),
    })?;

    clipboard.set_text(diff).map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to write to system clipboard".to_string()),
    })
}

#[tauri::command]
pub(crate) fn copy_all_to_clipboard(
    app: AppHandle<Wry>,
    tree_mode: &str,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
    git_diff_paths: Vec<String>,
    root: String,
    urls: Option<Vec<String>>,
) -> Result<(), ClipboardError> {
    let rendered_tree = get_rendered_tree(tree_mode, &full_tree, &selected_nodes);

    let base_payload =
        build_clipboard_content(git_diff_paths, &selected_nodes, &rendered_tree, &root)?;

    let web_pages_section = build_web_pages_section(&app, &root, &urls)?;
    let payload = if web_pages_section.is_empty() {
        base_payload
    } else {
        format!("{}{}", base_payload, web_pages_section)
    };

    let mut clipboard = Clipboard::new().map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to access system clipboard".to_string()),
    })?;

    clipboard.set_text(payload).map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to write to system clipboard".to_string()),
    })?;

    Ok(())
}

#[tauri::command]
pub(crate) fn copy_files_to_clipboard(
    directory_path: String,
    tree_mode: &str,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
) -> Result<(), ClipboardError> {
    let rendered_tree = get_rendered_tree(tree_mode, &full_tree, &selected_nodes);

    let payload =
        build_clipboard_content(Vec::new(), &selected_nodes, &rendered_tree, &directory_path)?;

    let mut clipboard = Clipboard::new().map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to access system clipboard".to_string()),
    })?;

    clipboard.set_text(payload).map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to write to system clipboard".to_string()),
    })
}

#[tauri::command]
pub(crate) fn copy_pages_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    urls: Vec<String>,
) -> Result<(), String> {
    const PAGE_SEPARATOR: &str = "\n\nEnd of web page.\n###\n\n";

    let store = open_store(&app)?;

    let parts = load_page_contents_from_store(&store, &directory_path, &urls);

    store.close_resource();

    if parts.is_empty() {
        return Err(page_not_found());
    }

    let payload = parts.join(PAGE_SEPARATOR);

    let mut clipboard =
        Clipboard::new().map_err(|_| "Failed to access system clipboard.".to_string())?;

    clipboard
        .set_text(payload)
        .map_err(|_| "Failed to write to system clipboard.".to_string())
}
