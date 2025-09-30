use std::{collections::HashSet, fs, path::PathBuf};

use tauri::{AppHandle, Wry};

use crate::{
    commands::{
        git::status::git_diff_text,
        tree::render::{render_full_tree, render_selected_tree},
        web::load_page_contents_from_store,
    },
    errors::{codes, ClipboardError},
    models::{DirectoryNode, SavedInstruction},
    store::open_store,
};

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
const WEB_PAGES_SEPARATOR: &str = "\n\n* * *\n\n";

pub fn page_not_found() -> String {
    PAGE_NOT_FOUND_ERROR.to_string()
}

const PAGE_NOT_FOUND_ERROR: &str = "Saved page not found.";

pub fn get_rendered_tree(
    tree_mode: &str,
    full_tree: &Vec<DirectoryNode>,
    selected_nodes: &HashSet<String>,
) -> String {
    match tree_mode {
        "selected" => render_selected_tree(full_tree, selected_nodes),
        "full" => render_full_tree(full_tree, selected_nodes),
        "none" | _ => String::new(),
    }
}

pub fn concatenate_files(selected_files: &HashSet<String>) -> Result<String, ClipboardError> {
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

pub fn build_file_tree(rendered_tree: &str, root: &str) -> String {
    if rendered_tree.is_empty() {
        return "".to_string();
    }

    format!(
        "{}\n{}\n{}\n\n{}\n{}\n",
        TREE_OPENING_TAG, root, rendered_tree, TREE_LEGEND, TREE_CLOSING_TAG,
    )
}

pub fn build_git_diff(root: &str, git_diff_paths: Vec<String>) -> String {
    if git_diff_paths.is_empty() {
        return String::new();
    }

    if let Some(diff) = git_diff_text(root, git_diff_paths) {
        return format!(
            "{}\n{}\n{}",
            GIT_DIFF_OPENING_TAG, diff, GIT_DIFF_CLOSING_TAG
        );
    }

    String::new()
}

pub fn build_web_pages_section(
    app: &AppHandle<Wry>,
    directory_path: &str,
    urls_opt: &Option<Vec<String>>,
) -> Result<String, ClipboardError> {
    let urls = match urls_opt {
        Some(u) if !u.is_empty() => u,
        _ => return Ok(String::new()),
    };

    let store = open_store(app).map_err(|_| ClipboardError {
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

pub fn build_clipboard_content(
    git_diff_paths: Vec<String>,
    selected_nodes: &HashSet<String>,
    rendered_tree: &str,
    root: &str,
) -> Result<String, ClipboardError> {
    let concatenated_files = concatenate_files(selected_nodes)?;
    let git_diff = build_git_diff(root, git_diff_paths);
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

pub fn format_instruction_entries(entries: &[SavedInstruction]) -> String {
    entries
        .iter()
        .map(|entry| format!("{}\n{}", entry.name, entry.content))
        .collect::<Vec<_>>()
        .join("\n\n")
}
