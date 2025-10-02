use rfd::FileDialog;

use crate::api::directory::lib::{pretty_directory_path, PickedDirectory};
use crate::errors::{codes, ApplicationError};

#[tauri::command]
pub(crate) fn open_directory() -> Result<PickedDirectory, ApplicationError> {
    let picked = FileDialog::new()
        .set_title("Choose a directory")
        .pick_folder();

    match picked {
        Some(path) => {
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
        }
        None => Err(ApplicationError {
            code: codes::DIALOG_CANCELLED,
            message: None,
        }),
    }
}
