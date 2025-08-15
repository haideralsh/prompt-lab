use std::fs;
use std::path::PathBuf;

use crate::errors::{codes, DirectoryError};
use crate::models::DirEntryInfo;

#[tauri::command]
pub(crate) fn list_directory(path: String) -> Result<Vec<DirEntryInfo>, DirectoryError> {
    let dir = PathBuf::from(&path);

    let entries = fs::read_dir(&dir).map_err(|_| DirectoryError {
        code: codes::DIRECTORY_READ_ERROR,
        directory_name: Some(path.clone()),
    })?;

    let mut result = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|_| DirectoryError {
            code: codes::DIRECTORY_READ_ERROR,
            directory_name: Some(path.clone()),
        })?;

        let file_type = entry.file_type().map_err(|_| DirectoryError {
            code: codes::DIRECTORY_READ_ERROR,
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