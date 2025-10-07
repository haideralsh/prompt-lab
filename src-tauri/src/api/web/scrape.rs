use super::favicon::get_favicon_url;
use crate::errors::{codes, ApplicationError};
use twars_url2md::url::process_url_with_content;

#[derive(Debug, Clone)]
pub struct SavedWebPage {
    pub title: String,
    pub url: String,
    pub markdown: String,
    pub favicon_url: Option<String>,
}

pub async fn page_to_md(url: &str) -> Result<SavedWebPage, ApplicationError> {
    let favicon_handle = {
        let url = url.to_string();
        tauri::async_runtime::spawn(async move { get_favicon_url(&url).await })
    };

    let markdown = match process_url_with_content(url, None, false, 3).await {
        Ok(Some(content)) if content.trim().is_empty() => {
            return Err(ApplicationError {
                code: codes::MARKDOWN_CONVERT_ERROR,
                message: Some(format!("No markdown content generated for {}", url)),
            });
        }
        Ok(Some(content)) => content,
        Ok(None) => {
            return Err(ApplicationError {
                code: codes::MARKDOWN_CONVERT_ERROR,
                message: Some(format!("No markdown content generated for {}", url)),
            });
        }
        Err((failed_url, error)) => {
            return Err(ApplicationError {
                code: codes::WEB_FETCH_ERROR,
                message: Some(format!("Failed to process {}: {}", failed_url, error)),
            });
        }
    };

    let title = extract_title(&markdown).unwrap_or_else(|| url.to_string());

    let favicon_url = match favicon_handle.await {
        Ok(path) => path,
        Err(_) => None,
    };

    Ok(SavedWebPage {
        title,
        url: url.to_string(),
        markdown,
        favicon_url,
    })
}

fn extract_title(markdown: &str) -> Option<String> {
    for line in markdown.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if trimmed.starts_with('#') {
            let heading = trimmed.trim_start_matches('#').trim();
            if !heading.is_empty() {
                return Some(heading.to_string());
            }
        } else {
            return Some(trimmed.to_string());
        }
    }
    None
}
