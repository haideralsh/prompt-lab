use serde::Serialize;

/// Serializable error returned from Tauri commands for directory operations.
#[derive(Serialize)]
pub struct DirectoryError {
    pub code: u8,
    pub directory_name: Option<String>,
}

/// Serializable error returned from Tauri commands for store operations.
#[derive(Serialize)]
pub struct StoreError {
    pub code: u8,
    pub message: Option<String>,
}

/// Serializable error returned from Tauri commands for clipboard operations.
#[derive(Serialize)]
pub struct ClipboardError {
    pub code: u8,
    pub message: Option<String>,
}

/// Error code constants for directory, store, and clipboard operations.
pub mod codes {
    /// Failed to read the directory (permissions, not found, etc.)
    pub const DIRECTORY_READ_ERROR: u8 = 1;
    /// User cancelled the file dialog.
    pub const DIALOG_CANCELLED: u8 = 2;

    /// Failed to open/read the store.
    pub const STORE_READ_ERROR: u8 = 3;
    /// Failed to write/save the store.
    pub const STORE_WRITE_ERROR: u8 = 4;

    /// Failed to read a file's contents.
    pub const FILE_READ_ERROR: u8 = 5;
    /// Failed to write to the system clipboard.
    pub const CLIPBOARD_WRITE_ERROR: u8 = 6;

    /// Failed to fetch a web page over HTTP(S).
    pub const WEB_FETCH_ERROR: u8 = 7;
    /// Failed to convert HTML into Markdown.
    pub const MARKDOWN_CONVERT_ERROR: u8 = 8;
}

/// Serializable error returned from Tauri commands for web operations (fetch/convert).
#[derive(Serialize)]
pub struct WebError {
    pub code: u8,
    pub message: Option<String>,
}
