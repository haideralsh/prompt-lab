use std::collections::HashSet;

use crate::{
    api::{
        clipboard::get_rendered_tree, tokenize::count_tokens_for_text, tree::index::DirectoryNode,
    },
    errors::ApplicationError,
};

#[tauri::command]
pub(crate) fn count_rendered_tree_tokens(
    tree_display_mode: String,
    full_tree: Vec<DirectoryNode>,
    selected_nodes: HashSet<String>,
) -> Result<usize, ApplicationError> {
    let rendered_tree = get_rendered_tree(&tree_display_mode, &full_tree, &selected_nodes);
    Ok(count_tokens_for_text(&rendered_tree))
}
