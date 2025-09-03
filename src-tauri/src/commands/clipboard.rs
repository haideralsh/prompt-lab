use arboard::Clipboard;
use std::fs;
use std::path::PathBuf;

use crate::errors::{codes, ClipboardError};

const OPENING_TAG: &str = "<file_contents>\n";
const CLOSING_TAG: &str = "</file_contents>\n";

fn concatenate_files(files: &[PathBuf]) -> Result<String, ClipboardError> {
    let mut concatenated_files = String::new();

    for file in files {
        let bytes = fs::read(file).map_err(|_| ClipboardError {
            code: codes::FILE_READ_ERROR,
            message: Some(format!("Failed to read file: {}", file.display())),
        })?;

        let header = format!("File: {}\n", file.display());
        let ext = file.extension().and_then(|ext| ext.to_str()).unwrap_or("");
        let wrapper_start = format!("```{}\n", ext);
        let text = String::from_utf8_lossy(&bytes);
        let wrapper_end = "```\n\n";

        concatenated_files.push_str(&format!(
            "{}{}{}{}",
            header, wrapper_start, text, wrapper_end
        ));
    }

    Ok(format!(
        "{}{}{}",
        OPENING_TAG, concatenated_files, CLOSING_TAG
    ))
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
