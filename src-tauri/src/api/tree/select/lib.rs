use std::collections::HashSet;

use crate::api::{
    directory::lib::pretty_directory_path,
    tokenize::get_cached_count,
    tree::{index::TreeIndex, select::command::FileNode},
};

pub fn all_descendants_selected(
    id: &str,
    tree_index: &TreeIndex,
    selected: &HashSet<String>,
) -> bool {
    let Some(node) = tree_index.nodes.get(id) else {
        return false;
    };

    if node.node_type == "file" {
        return selected.contains(id);
    }

    for child in &node.child_ids {
        if !all_descendants_selected(child, tree_index, selected) {
            return false;
        }
    }

    true
}

pub fn any_descendant_selected(
    id: &str,
    tree_index: &TreeIndex,
    selected: &HashSet<String>,
) -> bool {
    let Some(node) = tree_index.nodes.get(id) else {
        return false;
    };

    if node.node_type == "file" {
        return selected.contains(id);
    }

    for child in &node.child_ids {
        if any_descendant_selected(child, tree_index, selected) {
            return true;
        }
    }

    false
}

pub fn update_ancestors_selection(
    id: &str,
    tree_index: &TreeIndex,
    selected: &mut HashSet<String>,
) {
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

pub fn compute_indeterminate(
    tree_index: &TreeIndex,
    selected: &HashSet<String>,
) -> HashSet<String> {
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

pub fn collect_selected_files(tree_index: &TreeIndex, selected: &HashSet<String>) -> Vec<FileNode> {
    selected
        .iter()
        .filter_map(|path| {
            tree_index.nodes.get(path).and_then(|n| {
                if n.node_type == "file" {
                    Some(FileNode {
                        path: path.clone(),
                        title: n.title.clone(),
                        token_count: get_cached_count(path),
                        pretty_path: pretty_directory_path(path),
                    })
                } else {
                    None
                }
            })
        })
        .collect()
}
