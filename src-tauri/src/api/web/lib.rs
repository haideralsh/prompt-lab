use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Wry};

use crate::{
    errors::ApplicationError,
    store::{open_store, StoreCategoryKey, StoreDataKey},
};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SavedPageMetadata {
    pub url: String,
    pub title: String,
    pub token_count: Option<usize>,
    pub favicon_path: Option<String>,
}

pub fn extract_saved_pages_from_directory(value: &Value) -> Vec<SavedPageMetadata> {
    let Some(directory_object) = value.as_object() else {
        return Vec::new();
    };

    let Some(saved_pages_value) = directory_object.get(StoreDataKey::SAVED_WEB_PAGES) else {
        return Vec::new();
    };

    let Some(saved_pages_object) = saved_pages_value.as_object() else {
        return Vec::new();
    };

    saved_pages_object
        .values()
        .filter_map(|page_value| {
            let page_object = page_value.as_object()?;
            let title = page_object.get("title")?.as_str()?;
            let url = page_object.get("url")?.as_str()?;

            Some(SavedPageMetadata {
                url: url.to_string(),
                title: title.to_string(),
                token_count: page_object
                    .get("tokenCount")
                    .and_then(|v| v.as_u64())
                    .map(|v| v as usize),
                favicon_path: page_object
                    .get("faviconPath")
                    .and_then(|v| v.as_str())
                    .map(|v| v.to_string()),
            })
        })
        .collect()
}

pub(crate) fn load_page_contents_from_store(
    app: &AppHandle<Wry>,
    directory_path: &str,
    urls: &[String],
) -> Result<Vec<String>, ApplicationError> {
    let store = open_store(app)?;
    let parts = (|| {
        let data_object = store
            .get(StoreCategoryKey::DATA)
            .and_then(|value| value.as_object().cloned())?;

        let directory_object = data_object
            .get(directory_path)
            .and_then(|value| value.as_object().cloned())?;

        let saved_pages_object = directory_object
            .get(StoreDataKey::SAVED_WEB_PAGES)
            .and_then(|value| value.as_object().cloned())?;

        Some(
            urls.iter()
                .filter_map(|url| {
                    let page_value = saved_pages_object.get(url.as_str())?;
                    let content = page_value.get("content")?.as_str()?;
                    let url = page_value.get("url")?.as_str()?;

                    Some(format!(
                        "The following content was fetched from: {}\n{}",
                        url, content
                    ))
                })
                .collect(),
        )
    })()
    .unwrap_or_default();

    store.close_resource();

    Ok(parts)
}
