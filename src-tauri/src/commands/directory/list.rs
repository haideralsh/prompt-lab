use ignore::WalkBuilder;
use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};

use crate::errors::{codes, DirectoryError};
use crate::models::DirectoryNode;

#[tauri::command]
pub(crate) fn list_directory(path: &str) -> Result<Vec<DirectoryNode>, DirectoryError> {
    let dir = PathBuf::from(&path);

    // Build a recursive walker that honors .gitignore files in this tree.
    let walker = WalkBuilder::new(&dir)
        .hidden(false) // include dotfiles unless .gitignore excludes them
        .git_ignore(true) // respect .gitignore files
        .git_exclude(true) // respect .git/info/exclude if present
        .git_global(false) // do NOT use user's global ~/.gitignore
        .parents(true) // pick up .gitignore from parent dirs (typical repo behavior)
        .follow_links(false)
        .build();

    let mut children_map: BTreeMap<PathBuf, Vec<PathBuf>> = BTreeMap::new();
    let mut is_dir_map: HashMap<PathBuf, bool> = HashMap::new();

    for dent in walker {
        let dent = dent.map_err(|_| DirectoryError {
            code: codes::DIRECTORY_READ_ERROR,
            directory_name: Some(path.to_string()),
        })?;

        // Skip the root itself; we only want its children.
        if dent.depth() == 0 {
            continue;
        }

        // Skip .git directory and its contents
        if dent.path().components().any(|c| c.as_os_str() == ".git") {
            continue;
        }

        let is_dir = dent
            .file_type()
            .map(|t| t.is_dir())
            .unwrap_or_else(|| dent.path().is_dir());

        let rel = match dent.path().strip_prefix(&dir) {
            Ok(r) => r.to_path_buf(),
            Err(_) => continue, // Skip anything we can't relativize (shouldn't happen under root)
        };

        // Record type and add to parent's children list
        is_dir_map.insert(rel.clone(), is_dir);

        let parent_rel = rel
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| PathBuf::new());
        children_map.entry(parent_rel).or_default().push(rel);
    }

    // Deterministic ordering: directories first, then files; each group alphabetically.
    fn build_node(
        rel: &Path,
        children_map: &BTreeMap<PathBuf, Vec<PathBuf>>,
        is_dir_map: &HashMap<PathBuf, bool>,
        dir: &Path,
    ) -> DirectoryNode {
        let title = rel
            .file_name()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_else(|| String::new());

        let is_dir = *is_dir_map.get(rel).unwrap_or(&false);
        let node_type = if is_dir { "directory" } else { "file" }.to_string();

        let mut children_nodes: Vec<DirectoryNode> = Vec::new();

        if is_dir {
            let mut child_paths = children_map.get(rel).cloned().unwrap_or_else(|| Vec::new());

            child_paths.sort_by(|a, b| {
                let ad = *is_dir_map.get(a).unwrap_or(&false);
                let bd = *is_dir_map.get(b).unwrap_or(&false);
                match bd.cmp(&ad) {
                    // Directories first (true before false)
                    std::cmp::Ordering::Equal => {
                        let an = a
                            .file_name()
                            .map(|s| s.to_string_lossy())
                            .unwrap_or_default();
                        let bn = b
                            .file_name()
                            .map(|s| s.to_string_lossy())
                            .unwrap_or_default();
                        an.cmp(&bn)
                    }
                    other => other,
                }
            });

            for child in child_paths {
                children_nodes.push(build_node(&child, children_map, is_dir_map, dir));
            }
        }

        let id_str = dir.join(rel).to_string_lossy().into_owned();

        DirectoryNode {
            id: id_str,
            title,
            node_type,
            children: children_nodes,
        }
    }

    let mut top_level_paths = children_map
        .get(&PathBuf::new())
        .cloned()
        .unwrap_or_else(|| Vec::new());

    top_level_paths.sort_by(|a, b| {
        let ad = *is_dir_map.get(a).unwrap_or(&false);
        let bd = *is_dir_map.get(b).unwrap_or(&false);
        match bd.cmp(&ad) {
            std::cmp::Ordering::Equal => {
                let an = a
                    .file_name()
                    .map(|s| s.to_string_lossy())
                    .unwrap_or_default();
                let bn = b
                    .file_name()
                    .map(|s| s.to_string_lossy())
                    .unwrap_or_default();
                an.cmp(&bn)
            }
            other => other,
        }
    });

    let mut result: Vec<DirectoryNode> = Vec::new();
    for p in top_level_paths {
        result.push(build_node(&p, &children_map, &is_dir_map, &dir));
    }

    Ok(result)
}
