use rfd::FileDialog;

use crate::commands::directory::display::pretty_directory_path;
use crate::errors::{codes, DirectoryError};
use crate::models::PickedDirectory;

#[tauri::command]
pub(crate) fn open_directory() -> Result<PickedDirectory, DirectoryError> {
    let picked = FileDialog::new()
        .set_title("Choose a directory")
        .pick_folder();

    if let Some(path) = picked {
        let name = path
            .file_name()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_else(|| path.to_string_lossy().into_owned());
        let path_string = path.to_string_lossy().into_owned();
        let pretty_path = pretty_directory_path(&path_string);

        Ok(PickedDirectory {
            name,
            path: path_string,
            pretty_path,
        })
    } else {
        Err(DirectoryError {
            code: codes::DIALOG_CANCELLED,
            directory_name: None,
        })
    }
}
