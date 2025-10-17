/*
 * The Tauri Store used in this application follows this structure:
 * {
 *     config: {
 *           path_to_editor: String
 *     },
 *     state: {
 *           recently_opened_directories: [PickedDirectory, ...]
 *     },
 *     data: {
 *           <directory_root>: {
 *              token_cache: { "<path>": CacheEntry, ... }
 *              git_token_cache: { "<path>": GitTokenCacheEntry, ... }
 *              saved_web_pages: { "<url>": SavedWebPage, ... }
 *              saved_instructions: { "<uuid>": SavedInstruction, ... }
 *           }
 *     }
 * }
 */

use crate::errors::{codes, ApplicationError};
use std::sync::Arc;
use tauri::{AppHandle, Wry};
use tauri_plugin_store::{Store, StoreExt};

pub struct StoreConfigKey;
pub struct StoreStateKey;
pub struct StoreCategoryKey;
pub struct StoreDataKey;

impl StoreConfigKey {
    pub const EDITOR: &'static str = "path_to_editor";
}

impl StoreStateKey {
    pub const RECENTLY_OPENED_DIRECTORIES: &'static str = "recently_opened_directories";
}

impl StoreDataKey {
    pub const TOKEN_CACHE: &'static str = "token_cache";
    pub const GIT_TOKEN_CACHE: &'static str = "git_token_cache";
    pub const SAVED_WEB_PAGES: &'static str = "saved_web_pages";
    pub const SAVED_INSTRUCTIONS: &'static str = "saved_instructions";
}

impl StoreCategoryKey {
    pub const DATA: &'static str = "data";
    pub const CONFIG: &'static str = "config";
    pub const STATE: &'static str = "state";
}

pub const STORE_FILE_NAME: &'static str = "store.json";

pub fn open_store(app: &AppHandle<Wry>) -> Result<Arc<Store<Wry>>, ApplicationError> {
    app.store(STORE_FILE_NAME).map_err(|_| ApplicationError {
        code: codes::STORE_READ_ERROR,
        message: Some("Failed to open store".to_string()),
    })
}

pub fn save_store(store: &Arc<Store<Wry>>) -> Result<(), ApplicationError> {
    store.save().map_err(|_| ApplicationError {
        code: codes::STORE_WRITE_ERROR,
        message: Some("Failed to save store".to_string()),
    })
}
