use serde::Serialize;

/// Serializable error returned from Tauri commands for directory operations.
#[derive(Serialize)]
pub struct DirectoryError {
    pub code: u8,
    pub directory_name: Option<String>,
}

/// Error code constants for directory operations.
pub mod codes {
    /// Failed to read the directory (permissions, not found, etc.)
    pub const DIRECTORY_READ_ERROR: u8 = 1;
    /// User cancelled the file dialog.
    pub const DIALOG_CANCELLED: u8 = 2;
}