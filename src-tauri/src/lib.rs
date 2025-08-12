use rfd::FileDialog;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![open_directory, list_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
