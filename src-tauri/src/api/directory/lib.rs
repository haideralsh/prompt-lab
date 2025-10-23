use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PickedDirectory {
    pub name: String,
    pub path: String,
    pub pretty_path: String,
}

pub fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("USERPROFILE").map(PathBuf::from))
}

#[tauri::command]
pub(crate) fn pretty_directory_path(path: &str) -> String {
    if let Some(home) = home_dir() {
        let p = Path::new(path);
        if let Ok(rel) = p.strip_prefix(&home) {
            return if rel.as_os_str().is_empty() {
                "~".to_string()
            } else {
                format!("~/{}", rel.to_string_lossy())
            };
        }
    }
    path.to_string()
}
