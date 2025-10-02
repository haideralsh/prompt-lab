use serde::Serialize;

/// Serializable error returned from Tauri commands for store operations.
#[derive(Serialize)]
pub struct ApplicationError {
    pub code: u8,
    pub message: Option<String>,
}

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

    /// Failed to open the clipboard.
    pub const CLIPBOARD_OPEN_ERROR: u8 = 6;
    /// Failed to write to the system clipboard.
    pub const CLIPBOARD_WRITE_ERROR: u8 = 7;

    /// Failed to fetch a web page over HTTP(S).
    pub const WEB_FETCH_ERROR: u8 = 8;
    /// Failed to convert HTML into Markdown.
    pub const MARKDOWN_CONVERT_ERROR: u8 = 9;

    /// Failed to open a file with the system default handler.
    pub const FILE_OPEN_ERROR: u8 = 10;
}
