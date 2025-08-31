use crate::commands::tree::index::ensure_index;
use crate::commands::tree::lib::{build_full_tree, build_pruned_tree, count_matched_nodes};
use crate::commands::tree::{cache::cache, lib::add_ancestors};
use crate::errors::DirectoryError;
use crate::models::SearchMatch;
use std::collections::HashSet;

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

    for (id, lower) in &idx.titles {
        if lower.contains(&search_term) {
            original_matches.insert(id.clone());
        }
    }

    let mut keep = original_matches.clone();
    let ids: Vec<String> = original_matches.iter().cloned().collect();
    for id in ids {
        add_ancestors(&id, idx, &mut keep);
    }

    let mut results = Vec::new();
    for id in &idx.top_level {
        if let Some(node) = build_pruned_tree(id, idx, &keep) {
            results.push(node);
        }
    }

    let matched_count = count_matched_nodes(&results, &original_matches);

    Ok(SearchMatch {
        matched_ids_count: matched_count,
        results,
    })
}
