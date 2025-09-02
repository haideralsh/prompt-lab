use crate::commands::tokenize::{
    ensure_cache_loaded_for_dir, get_cached_count, spawn_token_count_task,
};
use crate::commands::tree::cache::cache;
use crate::commands::tree::index::ensure_index;
use crate::errors::DirectoryError;
use crate::models::{FileNode, SelectionResult, TreeIndex};
use std::collections::HashSet;
use tauri::{AppHandle, Wry};

fn all_descendants_selected(id: &str, tree_index: &TreeIndex, selected: &HashSet<String>) -> bool {
    let Some(node) = tree_index.nodes.get(id) else {
        return false;
    };

    if node.node_type == "file" {
        return selected.contains(id);
    }

    for child in &node.children {
        if !all_descendants_selected(child, tree_index, selected) {
            return false;
        }
    }

    true
}

fn any_descendant_selected(id: &str, tree_index: &TreeIndex, selected: &HashSet<String>) -> bool {
    let Some(node) = tree_index.nodes.get(id) else {
        return false;
    };

    if node.node_type == "file" {
        return selected.contains(id);
    }

    for child in &node.children {
        if any_descendant_selected(child, tree_index, selected) {
            return true;
        }
    }

    false
}

fn update_ancestors_selection(id: &str, tree_index: &TreeIndex, selected: &mut HashSet<String>) {
    let mut cur = Some(id.to_string());
    while let Some(cid) = cur {
        if let Some(node) = tree_index.nodes.get(&cid) {
            if let Some(parent) = &node.parent {
                if all_descendants_selected(parent, tree_index, selected) {
                    selected.insert(parent.clone());
                } else {
                    selected.remove(parent);
                }
                cur = Some(parent.clone());
                continue;
            }
        }
        break;
    }
}

fn compute_indeterminate(tree_index: &TreeIndex, selected: &HashSet<String>) -> HashSet<String> {
    let mut out = HashSet::new();

    for (id, node) in &tree_index.nodes {
        if node.node_type == "directory" {
            let any = any_descendant_selected(id, tree_index, selected);
            if any && !all_descendants_selected(id, tree_index, selected) {
                out.insert(id.clone());
            }
        }
    }

    out
}

fn collect_selected_files(tree_index: &TreeIndex, selected: &HashSet<String>) -> Vec<FileNode> {
    selected
        .iter()
        .filter_map(|id| {
            tree_index.nodes.get(id).and_then(|n| {
                if n.node_type == "file" {
                    Some(FileNode {
                        id: id.clone(),
                        title: n.title.clone(),
                        token_count: get_cached_count(id),
                    })
                } else {
                    None
                }
            })
        })
        .collect()
}

#[tauri::command]
pub(crate) fn toggle_selection(
    app: AppHandle<Wry>,
    path: String,
    current: Vec<String>,
    id: String,
) -> Result<SelectionResult, DirectoryError> {
    ensure_index(&path)?;
    let guard = cache().read().expect("cache read poisoned");
    let tree_index = guard
        .get(&path)
        .expect("index should exist after ensure_index");

    ensure_cache_loaded_for_dir(&app, &path);

    let node = match tree_index.nodes.get(&id) {
        Some(n) => n,
        None => {
            let set: HashSet<String> = current.into_iter().collect();
            let indeterminates = compute_indeterminate(tree_index, &set);
            let selected_files = collect_selected_files(tree_index, &set);

            let selection_ids: Vec<String> = selected_files
                .iter()
                .map(|f| f.id.clone())
                .collect();
            if !selection_ids.is_empty() {
                spawn_token_count_task(app.clone(), path.clone(), selection_ids);
            }

            return Ok(SelectionResult {
                selected: set.into_iter().collect(),
                selected_files,
                indeterminate: indeterminates.into_iter().collect(),
            });
        }
    };

    let mut targets = vec![id.clone()];
    if node.node_type != "file" {
        let mut stack = node.children.clone();
        while let Some(cur) = stack.pop() {
            targets.push(cur.clone());
            if let Some(n) = tree_index.nodes.get(&cur) {
                stack.extend(n.children.iter().cloned());
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

    update_ancestors_selection(&id, tree_index, &mut set);
    let indeterminates = compute_indeterminate(tree_index, &set);
    let selected_files = collect_selected_files(tree_index, &set);

    let selection_ids: Vec<String> = selected_files
        .iter()
        .map(|f| f.id.clone())
        .collect();
    if !selection_ids.is_empty() {
        spawn_token_count_task(app.clone(), path.clone(), selection_ids);
    }

    Ok(SelectionResult {
        selected: set.into_iter().collect(),
        selected_files,
        indeterminate: indeterminates.into_iter().collect(),
    })
}
