use crate::api::directory::lib::{pretty_directory_path, PickedDirectory};
use rfd::FileDialog;
use std::path::PathBuf;

pub trait DirectoryPicker {
    fn pick_folder(&self) -> Option<PathBuf>;
}

pub(crate) fn pick_directory_with_picker(picker: &dyn DirectoryPicker) -> Option<PickedDirectory> {
    let picked = picker.pick_folder();
    match picked {
        Some(path) => {
            let name = path
                .file_name()
                .map(|s| s.to_string_lossy().into_owned())
                .unwrap_or_else(|| path.to_string_lossy().into_owned());
            let path_string = path.to_string_lossy().into_owned();
            let pretty_path = pretty_directory_path(&path_string);
            Some(PickedDirectory {
                name,
                path: path_string,
                pretty_path,
            })
        }
        None => None,
    }
}

pub struct RfdDirectoryPicker;

impl DirectoryPicker for RfdDirectoryPicker {
    fn pick_folder(&self) -> Option<PathBuf> {
        FileDialog::new()
            .set_title("Choose a directory")
            .pick_folder()
    }
}

#[tauri::command]
pub(crate) fn pick_directory() -> Option<PickedDirectory> {
    pick_directory_with_picker(&RfdDirectoryPicker)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    struct MockDirectoryPicker {
        result: Option<PathBuf>,
    }

    impl DirectoryPicker for MockDirectoryPicker {
        fn pick_folder(&self) -> Option<PathBuf> {
            self.result.clone()
        }
    }

    #[test]
    fn test_pick_directory_success() {
        let mock = MockDirectoryPicker {
            result: Some(PathBuf::from("/home/user/documents")),
        };

        let result = pick_directory_with_picker(&mock);

        assert!(result.is_some());
        let picked = result.unwrap();
        assert_eq!(picked.name, "documents");
        assert_eq!(picked.path, "/home/user/documents");
    }

    #[test]
    fn test_pick_directory_cancelled() {
        let mock = MockDirectoryPicker { result: None };

        let result = pick_directory_with_picker(&mock);

        assert!(result.is_none());
    }

    #[test]
    fn test_pick_directory_root_path() {
        let mock = MockDirectoryPicker {
            result: Some(PathBuf::from("/")),
        };

        let result = pick_directory_with_picker(&mock);

        assert!(result.is_some());
        let picked = result.unwrap();
        assert_eq!(picked.path, "/");
    }
}
