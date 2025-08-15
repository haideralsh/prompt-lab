use std::fs;
use std::path::{Path, PathBuf};

use crate::errors::{codes, DirectoryError};
use crate::models::DirNode;

#[tauri::command]
pub(crate) fn search_tree(path: String, term: String) -> Result<Vec<DirNode>, DirectoryError> {
    let dir = PathBuf::from(&path);

    fs::read_dir(&dir).map_err(|_| DirectoryError {
        code: codes::DIRECTORY_READ_ERROR,
        directory_name: Some(path.clone()),
    })?;

    let trimmed = term.trim().to_string();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let term_lower = trimmed.to_lowercase();

    fn visit_dir(dir: &Path, term_lower: &str) -> Vec<DirNode> {
        let mut kept: Vec<DirNode> = Vec::new();

        if let Ok(entries) = fs::read_dir(dir) {
            for entry_res in entries {
                if let Ok(entry) = entry_res {
                    if let Ok(ft) = entry.file_type() {
                        let name = entry.file_name().to_string_lossy().into_owned();
                        let name_lower = name.to_lowercase();
                        let path_str = entry.path().to_string_lossy().into_owned();

                        if ft.is_file() {
                            if name_lower.contains(term_lower) {
                                kept.push(DirNode {
                                    name,
                                    path: path_str,
                                    is_directory: false,
                                    children: None,
                                });
                            }
                        } else if ft.is_dir() {
                            let child_nodes = visit_dir(&entry.path(), term_lower);
                            if !child_nodes.is_empty() {
                                kept.push(DirNode {
                                    name,
                                    path: path_str,
                                    is_directory: true,
                                    children: Some(child_nodes),
                                });
                            }
                        } else {
                            // Skip symlinks and other special file types
                        }
                    }
                }
            }
        }

        kept
    }

    Ok(visit_dir(&dir, &term_lower))
}
