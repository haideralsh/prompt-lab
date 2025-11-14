use super::favicon::get_favicon_url;
use crate::errors::{codes, ApplicationError};
use html_to_markdown::markdown::{
    CodeHandler, HeadingHandler, ListHandler, ParagraphHandler, StyledTextHandler, TableHandler,
    WebpageChromeRemover,
};
use html_to_markdown::{convert_html_to_markdown, TagHandler};
use scraper::{Html, Selector};
use std::{cell::RefCell, io::Cursor, rc::Rc};

#[derive(Debug, Clone)]
pub struct SavedWebPage {
    pub title: String,
    pub url: String,
    pub markdown: String,
    pub favicon_url: Option<String>,
}

#[derive(Debug, PartialEq, Eq)]
enum ContentType {
    Html,
    Plaintext,
    Json,
}

pub async fn page_to_md(url: &str) -> Result<SavedWebPage, ApplicationError> {
    let favicon_handle = {
        let url = url.to_string();
        tauri::async_runtime::spawn(async move { get_favicon_url(&url).await })
    };

    let (final_url, body, content_type) = fetch_url(url).await?;
    let (title, markdown) = convert_to_markdown(&final_url, body, content_type)?;

    let favicon_url = match favicon_handle.await {
        Ok(path) => path,
        Err(_) => None,
    };

    Ok(SavedWebPage {
        title,
        url: final_url,
        markdown,
        favicon_url,
    })
}

async fn fetch_url(url: &str) -> Result<(String, Vec<u8>, ContentType), ApplicationError> {
    let url = if !url.starts_with("https://") && !url.starts_with("http://") {
        format!("https://{}", url)
    } else {
        url.to_string()
    };

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .build()
        .map_err(|e| ApplicationError {
            code: codes::WEB_FETCH_ERROR,
            message: Some(format!("Failed to create HTTP client: {}", e)),
        })?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| ApplicationError {
            code: codes::WEB_FETCH_ERROR,
            message: Some(format!("Failed to fetch {}: {}", url, e)),
        })?;

    if response.status().is_client_error() || response.status().is_server_error() {
        return Err(ApplicationError {
            code: codes::WEB_FETCH_ERROR,
            message: Some(format!(
                "HTTP error {} for {}",
                response.status().as_u16(),
                url
            )),
        });
    }

    let final_url = response.url().to_string();
    let content_type = detect_content_type(&response);

    let body = response.bytes().await.map_err(|e| ApplicationError {
        code: codes::WEB_FETCH_ERROR,
        message: Some(format!("Failed to read response body: {}", e)),
    })?;

    Ok((final_url, body.to_vec(), content_type))
}

fn detect_content_type(response: &reqwest::Response) -> ContentType {
    response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .map(|ct| {
            if ct.contains("text/html") {
                ContentType::Html
            } else if ct.contains("application/json") || ct.contains("+json") {
                ContentType::Json
            } else if ct.contains("text/plain") {
                ContentType::Plaintext
            } else {
                ContentType::Html
            }
        })
        .unwrap_or(ContentType::Html)
}

fn convert_to_markdown(
    url: &str,
    body: Vec<u8>,
    content_type: ContentType,
) -> Result<(String, String), ApplicationError> {
    match content_type {
        ContentType::Html => {
            let html = String::from_utf8_lossy(&body).to_string();
            let document = Html::parse_document(&html);

            let page_title = extract_html_title(&document);

            // Build handlers using the crate's handlers
            let mut handlers: Vec<TagHandler> = Vec::new();
            handlers.push(Rc::new(RefCell::new(WebpageChromeRemover)));
            handlers.push(Rc::new(RefCell::new(ParagraphHandler)));
            handlers.push(Rc::new(RefCell::new(HeadingHandler)));
            handlers.push(Rc::new(RefCell::new(ListHandler)));
            handlers.push(Rc::new(RefCell::new(TableHandler::new())));
            handlers.push(Rc::new(RefCell::new(StyledTextHandler)));
            handlers.push(Rc::new(RefCell::new(CodeHandler)));

            let markdown = convert_html_to_markdown(Cursor::new(html.as_bytes()), &mut handlers)
                .map_err(|e| ApplicationError {
                    code: codes::MARKDOWN_CONVERT_ERROR,
                    message: Some(format!("Failed to convert HTML to Markdown: {}", e)),
                })?;

            let title = if let Some(page_title) = page_title {
                page_title
            } else {
                url.to_string()
            };

            Ok((title, markdown))
        }

        ContentType::Json => {
            let json: serde_json::Value =
                serde_json::from_slice(&body).map_err(|e| ApplicationError {
                    code: codes::MARKDOWN_CONVERT_ERROR,
                    message: Some(format!("Failed to parse JSON: {}", e)),
                })?;

            let markdown = format!(
                "```json\n{}\n```",
                serde_json::to_string_pretty(&json).unwrap_or_else(|_| String::from("{}"))
            );

            Ok((url.to_string(), markdown))
        }

        ContentType::Plaintext => {
            let text = String::from_utf8_lossy(&body).to_string();
            Ok((url.to_string(), text))
        }
    }
}

fn extract_html_title(document: &Html) -> Option<String> {
    let title_selector = Selector::parse("title").ok()?;

    document
        .select(&title_selector)
        .next()
        .map(|element| element.text().collect::<String>().trim().to_string())
        .filter(|s| !s.is_empty())
}
