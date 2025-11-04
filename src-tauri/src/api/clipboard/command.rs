use std::collections::HashSet;
use tauri::{AppHandle, Wry};

use crate::api::clipboard::lib::{
    build_clipboard_content, build_git_diff, build_instruction_sections, build_web_pages_section,
    get_rendered_tree, write_to_clipboard,
};
use crate::api::git::status::git_diff_text;
use crate::api::instruction::lib::Instruction;
use crate::api::tree::index::DirectoryNode;
use crate::api::web::lib::load_page_contents_from_store;
use crate::errors::ApplicationError;

#[tauri::command]
pub(crate) fn copy_instructions_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    instruction_ids: Vec<String>,
    instructions: Vec<Instruction>,
) -> Result<(), ApplicationError> {
    let payload =
        build_instruction_sections(&app, &directory_path, &instruction_ids, &instructions)?;

    write_to_clipboard(&app, payload)
}

#[tauri::command]
pub(crate) fn copy_diffs_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    paths: Vec<String>,
) -> Result<(), ApplicationError> {
    if paths.is_empty() {
        return Ok(());
    }

    write_to_clipboard(&app, build_git_diff(&directory_path, paths))
}

#[tauri::command]
pub(crate) fn copy_all_to_clipboard(
    app: AppHandle<Wry>,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
    tree_display_mode: String,
    git_diff_paths: Vec<String>,
    instruction_ids: Vec<String>,
    instructions: Vec<Instruction>,
    root: String,
    urls: Option<Vec<String>>,
) -> Result<(), ApplicationError> {
    let rendered_tree = get_rendered_tree(&tree_display_mode, &full_tree, &selected_nodes);

    let base_payload =
        build_clipboard_content(git_diff_paths, &selected_nodes, &rendered_tree, &root)?;

    let instructions_payload =
        build_instruction_sections(&app, &root, &instruction_ids, &instructions)?;

    let web_pages_section = build_web_pages_section(&app, &root, &urls)?;

    let sections = [base_payload, web_pages_section, instructions_payload]
        .into_iter()
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>();

    let payload = sections.join("\n\n");

    write_to_clipboard(&app, payload)
}

#[tauri::command]
pub(crate) fn copy_files_to_clipboard(
    app: AppHandle<Wry>,
    directory_path: String,
    tree_display_mode: String,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
) -> Result<(), ApplicationError> {
    let rendered_tree = get_rendered_tree(&tree_display_mode, &full_tree, &selected_nodes);

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
