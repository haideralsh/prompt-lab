use crate::{
    api::{
        tokenize::count_tokens_for_text,
        web::{
            favicon::save_favicon,
            lib::{extract_saved_pages_from_directory, SavedPageMetadata},
            scrape::{page_to_md, SavedWebPage},
        },
    },
    errors::ApplicationError,
    store::{open_store, save_store, StoreCategoryKey, StoreDataKey},
};
use serde_json::{json, Map, Value};
use tauri::{AppHandle, Wry};

#[tauri::command]
pub async fn save_page_as_md(
    app: AppHandle<Wry>,
    directory_path: String,
    url: String,
) -> Result<SavedPageMetadata, ApplicationError> {
    let store = open_store(&app)?;

    let saved_web_page = page_to_md(&url).await?;

    let SavedWebPage {
        url: scraped_url,
        title,
        markdown,
        favicon_url,
    } = saved_web_page;

    let token_count = count_tokens_for_text(&markdown);

    let favicon_path = match favicon_url {
        Some(ref favicon_url) => save_favicon(&app, favicon_url).await,
        None => None,
    };

    let metadata = SavedPageMetadata {
        url: scraped_url.clone(),
        title: title.clone(),
        token_count: Some(token_count),
        favicon_path: favicon_path.clone(),
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
                "faviconPath": favicon_path,
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
