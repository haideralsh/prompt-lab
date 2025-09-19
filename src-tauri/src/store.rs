/*
 * The Tauri Store used in this application follows this structure:
 * {
 *     config: { },
 *     state: {
 *           recently_opened_directories: [PickedDirectory, ...]
 *     },
 *     data: {
 *           [<directory_root>]: {
 *              token_cache: { "<path>": CacheEntry, ... }
 *           }
 *     }
 * }
 */

pub struct StoreStateKey;
pub struct StoreCategoryKey;
pub struct StoreDataKey;

impl StoreDataKey {
    pub const TOKEN_CACHE: &'static str = "token_cache";
    pub const SAVED_WEB_PAGES: &'static str = "saved_web_pages";
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
