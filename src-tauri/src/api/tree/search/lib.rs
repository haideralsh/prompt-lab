use crate::api::tree::index::{DirectoryNode, TreeIndex};
use std::collections::HashSet;

pub(crate) struct NodeTree {
    pub(crate) nodes: Vec<DirectoryNode>,
    pub(crate) total_nodes: usize,
}

pub fn build_full_tree(idx: &TreeIndex) -> NodeTree {
    fn build_all(id: &str, idx: &TreeIndex, counter: &mut usize) -> DirectoryNode {
        *counter += 1;

        let info = idx.nodes.get(id).expect("node id must exist");

        let mut children = Vec::new();
        for cid in &info.child_ids {
            children.push(build_all(cid, idx, counter));
        }

        DirectoryNode {
            id: info.id.clone(),
            title: info.title.clone(),
            node_type: info.node_type.clone(),
            children,
            parent: info.parent.clone(),
            child_ids: info.child_ids.clone(),
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

pub fn build_pruned_tree(
    id: &str,
    idx: &TreeIndex,
    keep: &HashSet<String>,
) -> Option<DirectoryNode> {
    let info = idx.nodes.get(id)?;

    if info.node_type == "file" {
        if keep.contains(id) {
            return Some(DirectoryNode {
                id: info.id.clone(),
                title: info.title.clone(),
                node_type: info.node_type.clone(),
                children: Vec::new(),
                parent: info.parent.clone(),
                child_ids: info.child_ids.clone(),
            });
        } else {
            return None;
        }
    }

    let mut pruned_children = Vec::new();
    for cid in &info.child_ids {
        if let Some(child) = build_pruned_tree(cid, idx, keep) {
            pruned_children.push(child);
        }
    }

    if keep.contains(id) || !pruned_children.is_empty() {
        return Some(DirectoryNode {
            id: info.id.clone(),
            title: info.title.clone(),
            node_type: info.node_type.clone(),
            children: pruned_children,
            parent: info.parent.clone(),
            child_ids: info.child_ids.clone(),
        });
    }

    None
}

pub fn add_ancestors(id: &str, idx: &TreeIndex, acc: &mut HashSet<String>) {
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

pub fn add_descendants(id: &str, tree_index: &TreeIndex, acc: &mut HashSet<String>) {
    if let Some(node) = tree_index.nodes.get(id) {
        for child_id in &node.child_ids {
            if acc.insert(child_id.clone()) {
                add_descendants(child_id, tree_index, acc);
            }
        }
    }
}

pub fn count_matched_nodes(nodes: &[DirectoryNode], original_matches: &HashSet<String>) -> usize {
    fn count_recursive(node: &DirectoryNode, original_matches: &HashSet<String>) -> usize {
        let mut count = 0;

        if original_matches.contains(&node.id) {
            count += 1;
        }

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
