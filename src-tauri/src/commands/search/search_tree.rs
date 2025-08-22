use crate::commands::search::cache::cache;
use crate::commands::search::tree_index::ensure_index;
use crate::errors::DirectoryError;
use crate::models::{DirNode, TreeIndex};
use std::collections::HashSet;

fn build_full_tree(idx: &TreeIndex) -> Vec<DirNode> {
    fn build_all(id: &str, idx: &TreeIndex) -> DirNode {
        let info = idx.nodes.get(id).expect("node id must exist");
        if info.node_type == "file" {
            return DirNode {
                id: info.id.clone(),
                title: info.title.clone(),
                node_type: info.node_type.clone(),
                children: Vec::new(),
            };
        }

        let mut children = Vec::new();
        for cid in &info.children {
            children.push(build_all(cid, idx));
        }

        DirNode {
            id: info.id.clone(),
            title: info.title.clone(),
            node_type: info.node_type.clone(),
            children,
        }
    }

    let mut out = Vec::new();
    for id in &idx.top_level {
        out.push(build_all(id, idx));
    }
    out
}

/// Build a pruned subtree containing only `keep` ids (and their necessary ancestors).
fn build_pruned(id: &str, idx: &TreeIndex, keep: &HashSet<String>) -> Option<DirNode> {
    let info = idx.nodes.get(id)?;

    if info.node_type == "file" {
        if keep.contains(id) {
            return Some(DirNode {
                id: info.id.clone(),
                title: info.title.clone(),
                node_type: info.node_type.clone(),
                children: Vec::new(),
            });
        } else {
            return None;
        }
    }

    // Directory: prune children
    let mut pruned_children = Vec::new();
    for cid in &info.children {
        if let Some(child) = build_pruned(cid, idx, keep) {
            pruned_children.push(child);
        }
    }

    // Include directory if it matched itself OR has any matching descendants.
    if keep.contains(id) || !pruned_children.is_empty() {
        return Some(DirNode {
            id: info.id.clone(),
            title: info.title.clone(),
            node_type: info.node_type.clone(),
            children: pruned_children,
        });
    }

    None
}

/// Add all ancestors of `id` into `acc`.
fn add_ancestors(id: &str, idx: &TreeIndex, acc: &mut HashSet<String>) {
    let mut cur = Some(id.to_string());
    while let Some(cid) = cur {
        if let Some(node) = idx.nodes.get(&cid) {
            if let Some(parent) = &node.parent {
                if acc.insert(parent.clone()) {
                    cur = Some(parent.clone());
                    continue;
                }
            }
        }
        break;
    }
}

#[tauri::command]
pub(crate) fn search_tree(path: String, term: String) -> Result<Vec<DirNode>, DirectoryError> {
    ensure_index(&path)?;

    // Read the index.
    let guard = cache().read().expect("cache read poisoned");
    let idx = guard
        .get(&path)
        .expect("index should exist after ensure_index");

    let trimmed = term.trim().to_string();
    if trimmed.is_empty() {
        // Consider changing this to return an empty Vec and keeping the full tree in the frontend
        // If the frontend always opens the full tree initially, this avoids the extra logic
        // No filtering: rebuild the full tree from the index (no disk I/O).
        return Ok(build_full_tree(idx));
    }

    let needle = trimmed.to_lowercase();

    // 1) Gather matches (files + optionally directories by name).
    let mut keep: HashSet<String> = HashSet::new();

    for (id, lower) in &idx.file_titles_lower {
        if lower.contains(&needle) {
            keep.insert(id.clone());
        }
    }

    // Directory-name matches: include the directory itself (children still pruned to matches)
    for (id, lower) in &idx.dir_titles_lower {
        if lower.contains(&needle) {
            keep.insert(id.clone());
        }
    }

    // 2) Always include ancestors so the UI gets a proper pruned tree.
    let ids: Vec<String> = keep.clone().into_iter().collect();
    for id in ids {
        add_ancestors(&id, idx, &mut keep);
    }

    // 3) Rebuild pruned tree from top-level ids in original order.
    let mut out = Vec::new();
    for id in &idx.top_level {
        if let Some(node) = build_pruned(id, idx, &keep) {
            out.push(node);
        }
    }

    Ok(out)
}
