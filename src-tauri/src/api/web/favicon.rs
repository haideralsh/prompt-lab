use std::{fs, path::PathBuf};

use scraper::{Html, Selector};
use tauri::{AppHandle, Manager, Wry};
use url::Url;
use uuid::Uuid;

const FAVICON_DIR: &str = "favicons";

pub async fn get_favicon_url(site_url: &str) -> Option<String> {
    let base_url = Url::parse(site_url).ok()?;

    let response = reqwest::get(site_url).await.ok()?;
    let html = response.text().await.ok()?;
    let document = Html::parse_document(&html);

    let selectors = [
        r#"link[rel="icon"]"#,
        r#"link[rel="shortcut icon"]"#,
        r#"link[rel="apple-touch-icon"]"#,
    ];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                match element.value().attr("href") {
                    Some(href) => match base_url.join(href).ok() {
                        Some(favicon_url) => return Some(favicon_url.to_string()),
                        None => continue,
                    },
                    None => continue,
                }
            }
        }
    }

    base_url
        .join("/favicon.ico")
        .ok()
        .map(|favicon_url| favicon_url.to_string())
}

pub async fn save_favicon(app: &AppHandle<Wry>, favicon_url: &str) -> Option<String> {
    let response = reqwest::get(favicon_url).await.ok()?;

    if !response.status().is_success() {
        return None;
    }

    let bytes = response.bytes().await.ok()?;

    let file_name = format!("{}.{}", Uuid::new_v4(), "ico");

    let favicons_directory = favicons_directory(app)?;

    if fs::create_dir_all(&favicons_directory).is_err() {
        return None;
    }

    let file_path = favicons_directory.join(&file_name);

    if fs::write(&file_path, &bytes).is_err() {
        return None;
    }

    Some(format!("{}/{}", FAVICON_DIR, file_name))
}

fn favicons_directory(app: &AppHandle<Wry>) -> Option<PathBuf> {
    app.path()
        .app_data_dir()
        .ok()
        .map(|dir| dir.join(FAVICON_DIR))
}
