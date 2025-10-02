use edit::edit_file;
use std::env;
use std::path::PathBuf;

use crate::errors::{codes, ApplicationError};

#[tauri::command]
pub(crate) fn open_file(path: &str) -> Result<(), ApplicationError> {
    env::set_var("VISUAL", "subl");

    let path = PathBuf::from(path);

    if !path.exists() {
        return Err(ApplicationError {
            code: codes::FILE_OPEN_ERROR,
            message: Some(format!("Path does not exist: {}", path.display())),
        });
    }

    if path.is_dir() {
        return Err(ApplicationError {
            code: codes::FILE_OPEN_ERROR,
            message: Some(format!(
                "Expected a file but received a directory: {}",
                path.display()
            )),
        });
    }

    edit_file(&path).map_err(|err| ApplicationError {
        code: codes::FILE_OPEN_ERROR,
        message: Some(format!(
            "Failed to open editor for {}: {}",
            path.display(),
            err
        )),
    })
}
