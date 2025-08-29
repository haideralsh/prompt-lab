use crate::commands::search::cache::cache;
use crate::commands::search::tree_index::ensure_index;
use crate::errors::DirectoryError;
use crate::models::{DirNode, SearchMatch, TreeIndex};
use std::collections::HashSet;

struct NodeTree {
    nodes: Vec<DirNode>,
    total_nodes: usize,
}

fn build_full_tree(idx: &TreeIndex) -> NodeTree {
    fn build_all(id: &str, idx: &TreeIndex, counter: &mut usize) -> DirNode {
        *counter += 1;

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
            children.push(build_all(cid, idx, counter));
        }

        DirNode {
            id: info.id.clone(),
            title: info.title.clone(),
            node_type: info.node_type.clone(),
            children,
        }
    }

    let mut node_count = 0;
    let mut out = Vec::new();
    for id in &idx.top_level {
        out.push(build_all(id, idx, &mut node_count));
    }

    NodeTree {
        nodes: out,
        total_nodes: node_count,
    }
}

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

    let mut pruned_children = Vec::new();
    for cid in &info.children {
        if let Some(child) = build_pruned(cid, idx, keep) {
            pruned_children.push(child);
        }
    }

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

fn count_matched_nodes(nodes: &[DirNode], original_matches: &HashSet<String>) -> usize {
    fn count_recursive(node: &DirNode, original_matches: &HashSet<String>) -> usize {
        let mut count = 0;

        // Count this node if it was an original match (not just an ancestor)
        if original_matches.contains(&node.id) {
            count += 1;
        }

        // Count children recursively
        for child in &node.children {
            count += count_recursive(child, original_matches);
        }

        count
    }

    nodes
        .iter()
        .map(|node| count_recursive(node, original_matches))
        .sum()
}

#[tauri::command]
pub(crate) fn search_tree(
    path: String,
    term: Option<String>,
) -> Result<SearchMatch, DirectoryError> {
    ensure_index(&path)?;

    let guard = cache().read().expect("cache read poisoned");
    let idx = guard
        .get(&path)
        .expect("index should exist after ensure_index");

    let search_term = term.unwrap_or_default().trim().to_string().to_lowercase();

    if search_term.is_empty() {
        let full_tree = build_full_tree(idx);

        return Ok(SearchMatch {
            matched_ids_count: full_tree.total_nodes,
            results: full_tree.nodes,
        });
    }

    let mut original_matches: HashSet<String> = HashSet::new();

    // Find all files that match the search term
    for (id, lower) in &idx.file_titles_lower {
        if lower.contains(&search_term) {
            original_matches.insert(id.clone());
        }
    }

    // Find all directories that match the search term
    for (id, lower) in &idx.dir_titles_lower {
        if lower.contains(&search_term) {
            original_matches.insert(id.clone());
        }
    }

    // Create a set that includes both matches and their ancestors
    let mut keep = original_matches.clone();
    let ids: Vec<String> = original_matches.iter().cloned().collect();
    for id in ids {
        add_ancestors(&id, idx, &mut keep);
    }

    // Build the pruned tree
    let mut results = Vec::new();
    for id in &idx.top_level {
        if let Some(node) = build_pruned(id, idx, &keep) {
            results.push(node);
        }
    }

    // Count only the originally matched nodes (not ancestors)
    let matched_count = count_matched_nodes(&results, &original_matches);

    Ok(SearchMatch {
        matched_ids_count: matched_count,
        results,
    })
}
