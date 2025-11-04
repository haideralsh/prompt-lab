use std::{
    fs,
    path::{Path, PathBuf},
};

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
        r#"link[rel*="icon"]"#,
        r#"link[rel="apple-touch-icon"]"#,
        r#"link[rel="apple-touch-icon-precomposed"]"#,
        r#"link[rel="mask-icon"]"#,
    ];

    #[derive(Debug)]
    struct Candidate {
        href: String,
        media: Option<String>,
        rel: Option<String>,
        r#type: Option<String>,
        sizes: Option<String>,
    }

    let mut candidates: Vec<Candidate> = Vec::new();

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for element in document.select(&selector) {
                if let Some(href) = element.value().attr("href") {
                    let media = element.value().attr("media").map(|s| s.to_string());
                    let rel = element.value().attr("rel").map(|s| s.to_string());
                    let r#type = element.value().attr("type").map(|s| s.to_string());
                    let sizes = element.value().attr("sizes").map(|s| s.to_string());
                    candidates.push(Candidate {
                        href: href.to_string(),
                        media,
                        rel,
                        r#type,
                        sizes,
                    });
                }
            }
        }
    }

    fn score(c: &Candidate) -> i32 {
        let mut s = 0;

        if let Some(m) = &c.media {
            let m_lower = m.to_ascii_lowercase();
            if m_lower.contains("prefers-color-scheme: dark") {
                s += 100;
            } else if m_lower.contains("prefers-color-scheme: light") {
                s += 50;
            } else {
                s += 10;
            }
        } else {
            s += 20;
        }

        if let Some(rel) = &c.rel {
            let rl = rel.to_ascii_lowercase();
            if rl.contains("icon") {
                s += 15;
            }
            if rl.contains("mask-icon") {
                s += 5;
            }
            if rl.contains("apple-touch-icon") {
                s -= 5;
            }
        }

        if let Some(t) = &c.r#type {
            let tl = t.to_ascii_lowercase();
            if tl.contains("svg") {
                s += 12;
            } else if tl.contains("png") {
                s += 10;
            } else if tl.contains("ico") || tl.contains("x-icon") {
                s += 5;
            }
        } else {
            s += 2;
        }

        if let Some(sz) = &c.sizes {
            let sl = sz.to_ascii_lowercase();
            if sl.contains("any") {
                s += 6;
            } else if sl.contains("64x64") || sl.contains("128x128") || sl.contains("256x256") {
                s += 3;
            }
        }

        s
    }

    candidates.sort_by_key(|c| score(c));
    candidates.reverse();

    for c in candidates {
        if let Ok(joined) = base_url.join(&c.href) {
            return Some(joined.to_string());
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

    let extension = Url::parse(favicon_url)
        .ok()
        .and_then(|url| {
            Path::new(url.path())
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| "ico".to_string());

    let file_name = format!("{}.{}", Uuid::new_v4(), extension);

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
