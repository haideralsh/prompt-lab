use arboard::Clipboard;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;

use crate::commands::git::git_diff_text;
use crate::commands::tree::render::{render_full_tree, render_selected_tree};
use crate::commands::web::load_page_contents_from_store;
use crate::errors::{codes, ClipboardError};
use crate::models::DirectoryNode;
use crate::store::{StoreCategoryKey, StoreDataKey, STORE_FILE_NAME};
use tauri::{AppHandle, Wry};
use tauri_plugin_store::StoreExt;

const FILE_CONTENTS_OPENING_TAG: &str = "<file_contents>";
const FILE_CONTENTS_CLOSING_TAG: &str = "</file_contents>";

const TREE_OPENING_TAG: &str = "<file_tree>";
const TREE_CLOSING_TAG: &str = "</file_tree>";
const TREE_LEGEND: &str =
    "The contents of the files marked with an asterisk (*) are included below.";

const GIT_DIFF_OPENING_TAG: &str = "<git_diff>";
const GIT_DIFF_CLOSING_TAG: &str = "</git_diff>";

const WEB_PAGES_OPENING_TAG: &str = "<web_pages>";
const WEB_PAGES_CLOSING_TAG: &str = "</web_pages>";
const WEB_PAGES_SEPARATOR: &str = "\n* * *\n";

fn page_not_found() -> String {
    PAGE_NOT_FOUND_ERROR.to_string()
}

const PAGE_NOT_FOUND_ERROR: &str = "Saved page not found.";

fn concatenate_files(selected_files: &HashSet<String>) -> Result<String, ClipboardError> {
    let mut concatenated_files = String::new();

    let mut file_strs: Vec<&String> = selected_files.iter().collect();
    file_strs.sort();

    for file_str in file_strs {
        let file = PathBuf::from(file_str);

        if !file.is_file() {
            continue;
        }

        let bytes = fs::read(&file).map_err(|_| ClipboardError {
            code: codes::FILE_READ_ERROR,
            message: Some(format!("Failed to read file: {}", file.display())),
        })?;

        let header = format!("File: {}\n", file.display());
        let ext = file.extension().and_then(|ext| ext.to_str()).unwrap_or("");
        let wrapper_start = format!("```{}\n", ext);
        let text = String::from_utf8_lossy(&bytes);
        let wrapper_end = "```";

        concatenated_files.push_str(&format!(
            "{}{}{}{}",
            header, wrapper_start, text, wrapper_end
        ));
    }

    Ok(concatenated_files)
}

fn build_file_tree(rendered_tree: &str, root: &str) -> String {
    if rendered_tree.is_empty() {
        return "".to_string();
    }

    format!(
        "{}\n{}\n{}\n\n{}\n{}\n",
        TREE_OPENING_TAG, root, rendered_tree, TREE_LEGEND, TREE_CLOSING_TAG,
    )
}

fn build_git_diff(root: &str, add_git_diff: bool) -> String {
    if add_git_diff {
        if let Some(diff) = git_diff_text(root) {
            return format!(
                "{}\n{}\n{}",
                GIT_DIFF_OPENING_TAG, diff, GIT_DIFF_CLOSING_TAG
            );
        }
    }

    "".to_string()
}

fn build_web_pages_section(
    app: &AppHandle<Wry>,
    directory_path: &str,
    urls_opt: &Option<Vec<String>>,
) -> Result<String, ClipboardError> {
    let urls = match urls_opt {
        Some(u) if !u.is_empty() => u,
        _ => return Ok(String::new()),
    };

    let store = app.store(STORE_FILE_NAME).map_err(|_| ClipboardError {
        code: codes::STORE_READ_ERROR,
        message: Some("Failed to open store".to_string()),
    })?;

    let parts = load_page_contents_from_store(&store, directory_path, urls);

    store.close_resource();

    if parts.is_empty() {
        return Ok(String::new());
    }

    let payload = parts.join(WEB_PAGES_SEPARATOR);
    Ok(format!(
        "{}\n{}\n{}\n",
        WEB_PAGES_OPENING_TAG, payload, WEB_PAGES_CLOSING_TAG
    ))
}

fn build_clipboard_content(
    add_git_diff: bool,
    selected_nodes: &HashSet<String>,
    rendered_tree: &str,
    root: &str,
) -> Result<String, ClipboardError> {
    let concatenated_files = concatenate_files(selected_nodes)?;
    let git_diff = build_git_diff(root, add_git_diff);
    let file_tree = build_file_tree(rendered_tree, root);

    Ok(format!(
        "{}\n{}\n{}\n{}\n{}\n",
        file_tree,
        FILE_CONTENTS_OPENING_TAG,
        concatenated_files,
        FILE_CONTENTS_CLOSING_TAG,
        git_diff,
    ))
}

#[tauri::command]
pub(crate) fn copy_files_to_clipboard(
    app: AppHandle<Wry>,
    tree_mode: &str,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
    add_git_diff: bool,
    root: String,
    urls: Option<Vec<String>>,
) -> Result<(), ClipboardError> {
    let rendered_tree = match tree_mode {
        "selected" => render_selected_tree(&full_tree, &selected_nodes),
        "full" => render_full_tree(&full_tree, &selected_nodes),
        "none" | _ => String::new(),
    };

    let base_payload =
        build_clipboard_content(add_git_diff, &selected_nodes, &rendered_tree, &root)?;

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
pub fn copy_page_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    url: String,
) -> Result<(), String> {
    let store = app
        .store(STORE_FILE_NAME)
        .map_err(|e| format!("store open error: {e}"))?;

    let data_value = store
        .get(StoreCategoryKey::DATA)
        .ok_or_else(page_not_found)?;

    let data_object = data_value.as_object().ok_or_else(page_not_found)?;

    let directory_value = data_object
        .get(&directory_path)
        .ok_or_else(page_not_found)?;

    let directory_object = directory_value.as_object().ok_or_else(page_not_found)?;

    let saved_pages_value = directory_object
        .get(StoreDataKey::SAVED_WEB_PAGES)
        .ok_or_else(page_not_found)?;

    let saved_pages_object = saved_pages_value.as_object().ok_or_else(page_not_found)?;

    let page_value = saved_pages_object.get(&url).ok_or_else(page_not_found)?;

    let content_text = page_value
        .get("content")
        .and_then(|content_value| content_value.as_str())
        .ok_or_else(page_not_found)?;

    store.close_resource();

    let mut clipboard =
        Clipboard::new().map_err(|_| "Failed to access system clipboard.".to_string())?;

    clipboard
        .set_text(content_text)
        .map_err(|_| "Failed to write to system clipboard.".to_string())
}

#[tauri::command]
pub fn copy_all_pages_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    urls: Vec<String>,
) -> Result<(), String> {
    const PAGE_SEPARATOR: &str = "\n* * *\n";

    let store = app
        .store(STORE_FILE_NAME)
        .map_err(|e| format!("store open error: {e}"))?;

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
