use crate::api::tokenize::{ensure_cache_loaded_for_dir, spawn_token_count_task};
use crate::api::tree::cache::cache;
use crate::api::tree::index::ensure_index;
use crate::api::tree::select::lib::{
    collect_selected_files, compute_indeterminate, update_ancestors_selection,
};
use crate::errors::ApplicationError;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use tauri::{AppHandle, Wry};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FileNode {
    pub(crate) path: String,
    pub(crate) title: String,
    pub(crate) token_count: Option<usize>,
    pub(crate) pretty_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SelectionResult {
    pub(crate) selected_nodes_paths: Vec<String>,
    pub(crate) indeterminate_nodes_paths: Vec<String>,
    pub(crate) selected_files: Vec<FileNode>,
}

#[tauri::command]
pub(crate) fn toggle_selection(
    app: AppHandle<Wry>,
    directory_path: String,
    current: Vec<String>,
    node_path: String,
) -> Result<SelectionResult, ApplicationError> {
    ensure_index(&directory_path)?;
    let guard = cache().read().expect("cache read poisoned");
    let tree_index = guard
        .get(&directory_path)
        .expect("index should exist after ensure_index");

    ensure_cache_loaded_for_dir(&app, &directory_path);

    let node = match tree_index.nodes.get(&node_path) {
        Some(n) => n,
        None => {
            let set: HashSet<String> = current.into_iter().collect();
            let indeterminates = compute_indeterminate(tree_index, &set);
            let selected_files = collect_selected_files(tree_index, &set);

            let selection_ids: Vec<String> =
                selected_files.iter().map(|f| f.path.clone()).collect();
            spawn_token_count_task(app.clone(), directory_path.clone(), selection_ids);

            return Ok(SelectionResult {
                selected_nodes_paths: set.into_iter().collect(),
                selected_files,
                indeterminate_nodes_paths: indeterminates.into_iter().collect(),
            });
        }
    };

    let mut targets = vec![node_path.clone()];
    if node.node_type != "file" {
        let mut stack = node.child_ids.clone();
        while let Some(cur) = stack.pop() {
            targets.push(cur.clone());
            if let Some(n) = tree_index.nodes.get(&cur) {
                stack.extend(n.child_ids.iter().cloned());
            }
        }
    }

    let mut set: HashSet<String> = current.into_iter().collect();
    let selecting = targets.iter().any(|k| !set.contains(k));

    for t in targets {
        if selecting {
            set.insert(t);
        } else {
            set.remove(&t);
        }
    }

    update_ancestors_selection(&node_path, tree_index, &mut set);
    let indeterminates = compute_indeterminate(tree_index, &set);
    let selected_files = collect_selected_files(tree_index, &set);

    let selection_ids: Vec<String> = selected_files.iter().map(|f| f.path.clone()).collect();
    spawn_token_count_task(app.clone(), directory_path.clone(), selection_ids);

    Ok(SelectionResult {
        selected_nodes_paths: set.into_iter().collect(),
        selected_files,
        indeterminate_nodes_paths: indeterminates.into_iter().collect(),
    })
}

#[tauri::command]
pub(crate) fn clear_selection(
    app: AppHandle<Wry>,
    directory_path: String,
) -> Result<SelectionResult, ApplicationError> {
    ensure_index(&directory_path)?;
    let cache = cache().read().expect("cache read poisoned");
    let tree_index = cache
        .get(&directory_path)
        .expect("index should exist after ensure_index");

    ensure_cache_loaded_for_dir(&app, &directory_path);

    let set: std::collections::HashSet<String> = std::collections::HashSet::new();

    let indeterminates = compute_indeterminate(tree_index, &set);
    let selected_files = collect_selected_files(tree_index, &set);

    spawn_token_count_task(app.clone(), directory_path.clone(), Vec::new());

    Ok(SelectionResult {
        selected_nodes_paths: Vec::new(),
        selected_files,
        indeterminate_nodes_paths: indeterminates.into_iter().collect(),
    })
}
