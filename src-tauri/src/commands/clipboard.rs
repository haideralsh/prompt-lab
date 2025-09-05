use arboard::Clipboard;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;

use crate::commands::tree::render::{render_full_tree, render_selected_tree};
use crate::errors::{codes, ClipboardError};
use crate::models::DirectoryNode;

const FILE_CONTENTS_OPENING_TAG: &str = "<file_contents>";
const FILE_CONTENTS_CLOSING_TAG: &str = "</file_contents>";

const TREE_OPENING_TAG: &str = "<file_tree>";
const TREE_CLOSING_TAG: &str = "</file_tree>";
const TREE_LEGEND: &str = "Nodes marked with an asterisk (*) are selected";

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
        let wrapper_end = "```\n";

        concatenated_files.push_str(&format!(
            "{}{}{}{}",
            header, wrapper_start, text, wrapper_end
        ));
    }

    Ok(concatenated_files)
}

fn build_clipboard_content(
    selected_nodes: &HashSet<String>,
    rendered_tree: &str,
    root: &str,
) -> Result<String, ClipboardError> {
    let concatenated_files = concatenate_files(selected_nodes)?;

    if rendered_tree.is_empty() {
        return Ok(format!(
            "{}\n{}\n{}\n",
            FILE_CONTENTS_OPENING_TAG, concatenated_files, FILE_CONTENTS_CLOSING_TAG
        ));
    }

    Ok(format!(
        "{}\n{}\n{}\n\n{}\n{}\n\n{}\n{}\n{}\n",
        TREE_OPENING_TAG,
        root,
        rendered_tree,
        TREE_LEGEND,
        TREE_CLOSING_TAG,
        FILE_CONTENTS_OPENING_TAG,
        concatenated_files,
        FILE_CONTENTS_CLOSING_TAG
    ))
}

#[tauri::command]
pub(crate) fn copy_files_to_clipboard(
    tree_mode: &str,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
    root: String,
) -> Result<(), ClipboardError> {
    let mut rendered_tree = String::new();

    match tree_mode {
        "selected" => rendered_tree = render_selected_tree(&full_tree, &selected_nodes),
        "full" => rendered_tree = render_full_tree(&full_tree, &selected_nodes),
        "none" | _ => (),
    }

    let payload = build_clipboard_content(&selected_nodes, &rendered_tree, &root)?;

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
