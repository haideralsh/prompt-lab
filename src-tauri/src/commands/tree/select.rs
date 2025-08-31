use crate::commands::tree::cache::cache;
use crate::commands::tree::index::ensure_index;
use crate::errors::DirectoryError;
use crate::models::TreeIndex;
use std::collections::HashSet;

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

#[tauri::command]
pub(crate) fn toggle_selection(
    path: String,
    current: Vec<String>,
    id: String,
) -> Result<Vec<String>, DirectoryError> {
    ensure_index(&path)?;
    let guard = cache().read().expect("cache read poisoned");
    let idx = guard
        .get(&path)
        .expect("index should exist after ensure_index");

    let node = match idx.nodes.get(&id) {
        Some(n) => n,
        None => return Ok(current),
    };

    let mut targets = vec![id.clone()];
    if node.node_type != "file" {
        let mut stack = node.children.clone();
        while let Some(cur) = stack.pop() {
            targets.push(cur.clone());
            if let Some(n) = idx.nodes.get(&cur) {
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

    update_ancestors_selection(&id, idx, &mut set);

    Ok(set.into_iter().collect())
}
