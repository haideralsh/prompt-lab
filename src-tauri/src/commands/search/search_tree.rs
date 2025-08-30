use crate::commands::search::lib::{build_full_tree, build_pruned_tree, count_matched_nodes};
use crate::commands::search::tree_index::ensure_index;
use crate::commands::search::{cache::cache, lib::add_ancestors};
use crate::errors::DirectoryError;
use crate::models::SearchMatch;
use std::collections::{HashSet, VecDeque};

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

    for (id, lower) in &idx.file_titles_lower {
        if lower.contains(&search_term) {
            original_matches.insert(id.clone());
        }
    }

    for (id, lower) in &idx.dir_titles_lower {
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

#[tauri::command]
pub(crate) fn ancestors(
    path: String,
    id: String,
    include_self: bool,
) -> Result<Vec<String>, DirectoryError> {
    ensure_index(&path)?;
    let guard = cache().read().expect("cache read poisoned");
    let idx = guard
        .get(&path)
        .expect("index should exist after ensure_index");

    if !idx.nodes.contains_key(&id) {
        return Ok(Vec::new());
    }

    let mut out = Vec::new();
    if include_self {
        out.push(id.clone());
    }

    let mut cur = idx.nodes.get(&id).and_then(|n| n.parent.clone());
    while let Some(pid) = cur {
        out.push(pid.clone());
        cur = idx.nodes.get(&pid).and_then(|n| n.parent.clone());
    }
    Ok(out)
}

#[tauri::command]
pub(crate) fn descendants(
    path: String,
    id: String,
    include_self: bool,
) -> Result<Vec<String>, DirectoryError> {
    ensure_index(&path)?;
    let guard = cache().read().expect("cache read poisoned");
    let idx = guard
        .get(&path)
        .expect("index should exist after ensure_index");

    if !idx.nodes.contains_key(&id) {
        return Ok(Vec::new());
    }

    let mut out = Vec::new();
    if include_self {
        out.push(id.clone());
    }

    let mut q: VecDeque<String> = idx
        .nodes
        .get(&id)
        .map(|n| n.children.clone().into())
        .unwrap_or_else(VecDeque::new);

    while let Some(cur) = q.pop_front() {
        out.push(cur.clone());
        if let Some(n) = idx.nodes.get(&cur) {
            for c in &n.children {
                q.push_back(c.clone());
            }
        }
    }
    Ok(out)
}

#[tauri::command]
pub(crate) fn toggle_selection(
    path: String,
    current: Vec<String>,
    id: String,
    mode: String, // "auto" | "force_select" | "force_deselect"
) -> Result<Vec<String>, DirectoryError> {
    ensure_index(&path)?;
    let guard = cache().read().expect("cache read poisoned");
    let idx = guard
        .get(&path)
        .expect("index should exist after ensure_index");

    let info = match idx.nodes.get(&id) {
        Some(n) => n,
        None => return Ok(current),
    };

    let mut targets = vec![id.clone()];
    if info.node_type != "file" {
        let mut stack = info.children.clone();
        while let Some(cur) = stack.pop() {
            targets.push(cur.clone());
            if let Some(n) = idx.nodes.get(&cur) {
                stack.extend(n.children.iter().cloned());
            }
        }
    }

    let mut set: HashSet<String> = current.into_iter().collect();
    let selecting = match mode.as_str() {
        "force_select" => true,
        "force_deselect" => false,
        _ => targets.iter().any(|k| !set.contains(k)), // auto
    };

    for t in targets {
        if selecting {
            set.insert(t);
        } else {
            set.remove(&t);
        }
    }

    Ok(set.into_iter().collect())
}
