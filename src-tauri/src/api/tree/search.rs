use crate::api::tree::index::{ensure_index, DirectoryNode};
use crate::api::tree::lib::{build_full_tree, build_pruned_tree, count_matched_nodes};
use crate::api::tree::{
    cache::cache,
    lib::{add_ancestors, add_descendants},
};
use crate::errors::ApplicationError;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SearchMatch {
    pub(crate) matched_ids_count: usize,
    pub(crate) results: Vec<DirectoryNode>,
}

#[tauri::command]
pub(crate) fn search_tree(
    path: String,
    term: Option<String>,
) -> Result<SearchMatch, ApplicationError> {
    ensure_index(&path)?;

    let guard = cache().read().expect("cache read poisoned");
    let tree_index = guard
        .get(&path)
        .expect("index should exist after ensure_index");

    let search_term = term.unwrap_or_default().trim().to_string().to_lowercase();

    if search_term.is_empty() {
        let full_tree = build_full_tree(tree_index);

        return Ok(SearchMatch {
            matched_ids_count: full_tree.total_nodes,
            results: full_tree.nodes,
        });
    }

    let mut original_matches: HashSet<String> = HashSet::new();

    for (id, title) in &tree_index.titles {
        if title.contains(&search_term) {
            original_matches.insert(id.clone());
        }
    }

    let mut keep = original_matches.clone();
    let ids: Vec<String> = original_matches.iter().cloned().collect();
    for id in ids {
        add_ancestors(&id, tree_index, &mut keep);
    }

    for id in &original_matches {
        if let Some(node) = tree_index.nodes.get(id) {
            if node.node_type == "directory" {
                add_descendants(id, tree_index, &mut keep);
            }
        }
    }

    let mut results = Vec::new();
    for id in &tree_index.top_level {
        if let Some(node) = build_pruned_tree(id, tree_index, &keep) {
            results.push(node);
        }
    }

    let matched_count = count_matched_nodes(&results, &original_matches);

    Ok(SearchMatch {
        matched_ids_count: matched_count,
        results,
    })
}
