use arboard::Clipboard;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;

use crate::commands::git::git_diff_text;
use crate::commands::tree::render::{render_full_tree, render_selected_tree};
use crate::errors::{codes, ClipboardError};
use crate::models::DirectoryNode;

const FILE_CONTENTS_OPENING_TAG: &str = "<file_contents>";
const FILE_CONTENTS_CLOSING_TAG: &str = "</file_contents>";

const TREE_OPENING_TAG: &str = "<file_tree>";
const TREE_CLOSING_TAG: &str = "</file_tree>";
const TREE_LEGEND: &str =
    "The contents of the files marked with an asterisk (*) are included below.";

const GIT_DIFF_OPENING_TAG: &str = "<git_diff>";
const GIT_DIFF_CLOSING_TAG: &str = "</git_diff>";

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
    tree_mode: &str,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
    add_git_diff: bool,
    root: String,
) -> Result<(), ClipboardError> {
    let rendered_tree = match tree_mode {
        "selected" => render_selected_tree(&full_tree, &selected_nodes),
        "full" => render_full_tree(&full_tree, &selected_nodes),
        "none" | _ => String::new(),
    };

    let payload = build_clipboard_content(add_git_diff, &selected_nodes, &rendered_tree, &root)?;

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
