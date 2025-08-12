use rfd::FileDialog;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
struct DirectoryError {
    code: u8,
    directory_name: Option<String>,
}

#[allow(non_snake_case)]
pub mod ERROR_CODES {
    pub const DIRECTORY_READ_ERROR: u8 = 1;
    pub const DIALOG_CANCELLED: u8 = 2;
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DirEntryInfo {
    name: String,
    path: String,
    is_directory: bool,
}

#[tauri::command]
fn open_directory() -> Result<String, DirectoryError> {
    let picked = FileDialog::new()
        .set_title("Choose a directory")
        .pick_folder();

    if let Some(path) = picked {
        Ok(path.to_string_lossy().into_owned())
    } else {
        Err(DirectoryError {
            code: ERROR_CODES::DIALOG_CANCELLED,
            directory_name: None,
        })
    }
}

#[tauri::command]
fn list_directory(path: String) -> Result<Vec<DirEntryInfo>, DirectoryError> {
    let dir = PathBuf::from(&path);

    let entries = fs::read_dir(&dir).map_err(|_| DirectoryError {
        code: ERROR_CODES::DIRECTORY_READ_ERROR,
        directory_name: Some(path.clone()),
    })?;

    let mut result = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|_| DirectoryError {
            code: ERROR_CODES::DIRECTORY_READ_ERROR,
            directory_name: Some(path.clone()),
        })?;

        let file_type = entry.file_type().map_err(|_| DirectoryError {
            code: ERROR_CODES::DIRECTORY_READ_ERROR,
            directory_name: Some(path.clone()),
        })?;

        result.push(DirEntryInfo {
            name: entry.file_name().to_string_lossy().into_owned(),
            path: entry.path().to_string_lossy().into_owned(),
            is_directory: file_type.is_dir(),
        });
    }

    Ok(result)
}

#[tauri::command]
fn search_files(path: String, term: String) -> Result<Vec<String>, DirectoryError> {
    let dir = PathBuf::from(&path);

    fs::read_dir(&dir).map_err(|_| DirectoryError {
        code: ERROR_CODES::DIRECTORY_READ_ERROR,
        directory_name: Some(path.clone()),
    })?;

    if term.trim().is_empty() {
        return Ok(Vec::new());
    }

    let mut results = Vec::new();
    let term_lower = term.to_lowercase();

    fn visit_dir(dir: &Path, term_lower: &str, results: &mut Vec<String>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry_res in entries {
                if let Ok(entry) = entry_res {
                    if let Ok(ft) = entry.file_type() {
                        let name_lower = entry.file_name().to_string_lossy().to_lowercase();
                        if ft.is_file() {
                            if name_lower.contains(term_lower) {
                                results.push(entry.path().to_string_lossy().into_owned());
                            }
                        } else if ft.is_dir() {
                            // Recurse into sub-directory
                            visit_dir(&entry.path(), term_lower, results);
                        } else {
                            // Skip symlinks and other special files
                        }
                    }
                }
            }
        }
    }

    visit_dir(&dir, &term_lower, &mut results);

    Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_directory,
            list_directory,
            search_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
