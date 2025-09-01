use serde::Serialize;
use std::fs;
use tauri::{AppHandle, Emitter};
use tiktoken_rs::cl100k_base;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TokenCountResult {
    id: String,
    token_count: usize,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TokenCountsEvent {
    files: Vec<TokenCountResult>,
}

pub fn spawn_token_count_task(app: AppHandle, file_ids: Vec<String>) {
    std::thread::spawn(move || {
        let bpe = cl100k_base().ok();
        let mut results: Vec<TokenCountResult> = Vec::new();

        for id in file_ids {
            let token_count = fs::read(&id)
                .ok()
                .map(|bytes| {
                    let text = String::from_utf8_lossy(&bytes);
                    if let Some(enc) = &bpe {
                        enc.encode_with_special_tokens(&text).len()
                    } else {
                        0
                    }
                })
                .unwrap_or(0);

            results.push(TokenCountResult { id, token_count });
        }

        let _ = app.emit("file-token-counts", TokenCountsEvent { files: results });
    });
}
