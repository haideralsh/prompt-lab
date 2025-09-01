use arboard::Clipboard;
use std::fs;
use std::path::PathBuf;

use crate::errors::{codes, ClipboardError};

fn concatenate_files(files: &[PathBuf]) -> Result<String, ClipboardError> {
    const SEP: &str = " * * * ";
    let mut out = String::new();

    for (i, f) in files.iter().enumerate() {
        let bytes = fs::read(f).map_err(|_| ClipboardError {
            code: codes::FILE_READ_ERROR,
            message: Some(format!("Failed to read file: {}", f.display())),
        })?;

        let text = String::from_utf8_lossy(&bytes);
        if i > 0 {
            out.push_str(SEP);
        }
        out.push_str(&text);
    }

    Ok(out)
}

#[tauri::command]
pub(crate) fn copy_files_to_clipboard(paths: Vec<String>) -> Result<(), ClipboardError> {
    let mut all_files: Vec<PathBuf> = Vec::new();

    for p in paths {
        let pb = PathBuf::from(&p);
        if pb.is_file() {
            all_files.push(pb);
        }
    }

    let payload = concatenate_files(&all_files)?;

    let mut clipboard = Clipboard::new().map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to access system clipboard".to_string()),
    })?;

    clipboard.set_text(payload).map_err(|_| ClipboardError {
        code: codes::CLIPBOARD_WRITE_ERROR,
        message: Some("Failed to write to system clipboard".to_string()),
    })?;

    Ok(())
}
