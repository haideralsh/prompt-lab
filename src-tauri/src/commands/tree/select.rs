use crate::commands::tree::cache::cache;
use crate::commands::tree::index::ensure_index;
use crate::errors::DirectoryError;
use std::collections::HashSet;

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
