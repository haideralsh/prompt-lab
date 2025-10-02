use crate::{
    commands::{
        scrape::{page_to_md, ScrapedPage},
        tokenize::count_tokens_for_text,
    },
    errors::ApplicationError,
    store::{open_store, save_store, StoreCategoryKey, StoreDataKey},
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use tauri::{AppHandle, Wry};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SavedPageMetadata {
    pub url: String,
    pub title: String,
    pub token_count: Option<usize>,
}

fn extract_saved_pages_from_directory(value: &Value) -> Vec<SavedPageMetadata> {
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

#[tauri::command]
pub async fn save_page_as_md(
    app: AppHandle<Wry>,
    directory_path: String,
    url: String,
) -> Result<SavedPageMetadata, ApplicationError> {
    let store = open_store(&app)?;

    // page_to_md already returns ApplicationError, so just propagate it
    let scraped_page = page_to_md(&url).await?;

    let ScrapedPage {
        url: scraped_url,
        title,
        markdown,
    } = scraped_page;

    let token_count = count_tokens_for_text(&markdown);

    let metadata = SavedPageMetadata {
        url: scraped_url.clone(),
        title: title.clone(),
        token_count: Some(token_count),
    };

    let mut data: Map<String, Value> = store
        .get(StoreCategoryKey::DATA)
        .and_then(|value| value.as_object().cloned())
        .unwrap_or_else(Map::new);

    let directory_entry = data
        .entry(directory_path.clone())
        .or_insert_with(|| Value::Object(Map::new()));

    if !directory_entry.is_object() {
        *directory_entry = Value::Object(Map::new());
    }

    let directory_object = directory_entry.as_object_mut().unwrap();

    let saved_pages_entry = directory_object
        .entry(StoreDataKey::SAVED_WEB_PAGES.to_string())
        .or_insert_with(|| Value::Object(Map::new()));

    if !saved_pages_entry.is_object() {
        *saved_pages_entry = Value::Object(Map::new());
    }

    if let Some(saved_pages_object) = saved_pages_entry.as_object_mut() {
        let page_key = scraped_url.clone();
        saved_pages_object.insert(
            page_key,
            json!({
                "url": scraped_url,
                "title": title,
                "content": markdown,
                "tokenCount": token_count,
            }),
        );
    }

    store.set(StoreCategoryKey::DATA, Value::Object(data));
    save_store(&store)?;
    store.close_resource();

    Ok(metadata)
}

#[tauri::command]
pub fn edit_saved_page(
    app: AppHandle<Wry>,
    directory_path: String,
    url: String,
    new_title: String,
) -> Result<(), ApplicationError> {
    let store = open_store(&app)?;

    let mut data = match store
        .get(StoreCategoryKey::DATA)
        .and_then(|value| value.as_object().cloned())
    {
        Some(data) => data,
        None => {
            store.close_resource();
            return Ok(());
        }
    };

    let Some(directory_value) = data.get_mut(&directory_path) else {
        store.close_resource();
        return Ok(());
    };

    let Some(directory_object) = directory_value.as_object_mut() else {
        store.close_resource();
        return Ok(());
    };

    let Some(saved_pages_value) = directory_object.get_mut(StoreDataKey::SAVED_WEB_PAGES) else {
        store.close_resource();
        return Ok(());
    };

    let Some(saved_pages_object) = saved_pages_value.as_object_mut() else {
        store.close_resource();
        return Ok(());
    };

    let mut did_update = false;

    if let Some(page_value) = saved_pages_object.get_mut(&url) {
        if let Some(page_object) = page_value.as_object_mut() {
            page_object.insert("title".to_string(), Value::String(new_title));
            did_update = true;
        }
    }

    if did_update {
        store.set(StoreCategoryKey::DATA, Value::Object(data));
        save_store(&store)?;
    }

    store.close_resource();

    Ok(())
}

#[tauri::command]
pub fn delete_saved_page(
    app: AppHandle<Wry>,
    directory_path: String,
    url: String,
) -> Result<(), ApplicationError> {
    let store = open_store(&app)?;

    let mut data: Map<String, Value> = store
        .get(StoreCategoryKey::DATA)
        .and_then(|value| value.as_object().cloned())
        .unwrap_or_else(Map::new);

    let mut should_remove_directory_entry = false;

    if let Some(directory_value) = data.get_mut(&directory_path) {
        if let Some(directory_object) = directory_value.as_object_mut() {
            let mut should_remove_saved_pages_key = false;

            if let Some(saved_pages_value) = directory_object.get_mut(StoreDataKey::SAVED_WEB_PAGES)
            {
                if let Some(saved_pages_object) = saved_pages_value.as_object_mut() {
                    saved_pages_object.remove(&url);

                    if saved_pages_object.is_empty() {
                        should_remove_saved_pages_key = true;
                    }
                }
            }

            if should_remove_saved_pages_key {
                directory_object.remove(StoreDataKey::SAVED_WEB_PAGES);
            }

            should_remove_directory_entry = directory_object.is_empty();
        }
    }

    if should_remove_directory_entry {
        data.remove(&directory_path);
    }

    store.set(StoreCategoryKey::DATA, Value::Object(data));
    save_store(&store)?;
    store.close_resource();

    Ok(())
}

#[tauri::command]
pub fn list_saved_pages(
    app: AppHandle<Wry>,
    directory_path: String,
) -> Result<Vec<SavedPageMetadata>, ApplicationError> {
    let store = open_store(&app)?;

    let saved_pages = if let Some(data) = store.get(StoreCategoryKey::DATA) {
        if let Some(data_hashmap) = data.as_object() {
            if let Some(directory_value) = data_hashmap.get(&directory_path) {
                extract_saved_pages_from_directory(directory_value)
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        }
    } else {
        Vec::new()
    };

    store.close_resource();

    Ok(saved_pages)
}
