/*
 * The Tauri Store used in this application follows this structure:
 * {
 *     config: { },
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

use std::sync::Arc;

use tauri::{AppHandle, Wry};
use tauri_plugin_store::{Store, StoreExt};

pub struct StoreStateKey;
pub struct StoreCategoryKey;
pub struct StoreDataKey;

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

impl StoreStateKey {
    pub const RECENTLY_OPENED_DIRECTORIES: &'static str = "recently_opened_directories";
}

pub const STORE_FILE_NAME: &'static str = "store.json";

pub fn open_store(app: &AppHandle<Wry>) -> Result<Arc<Store<Wry>>, String> {
    app.store(STORE_FILE_NAME)
        .map_err(|e| format!("store open error: {e}"))
}
