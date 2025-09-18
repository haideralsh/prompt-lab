/*
 * The Tauri Store used in this application follows this structure:
 * {
 *     config: { },
 *     state: {
 *           recent_opened: [...]
 *           currently_opened: [...]
 *     },
 *     data: {
 *           [directory_name]: {
 *         		saved_instructions: {
 *
 *         		},
 *
 *         		saved_websites: {
 *
 *         		},
 *           }
 *     }
 * }
 */

pub struct StoreStateKey;
pub struct StoreCategoryKey;

impl StoreCategoryKey {
    pub const DATA: &'static str = "data";
    pub const CONFIG: &'static str = "config";
    pub const STATE: &'static str = "state";
}

impl StoreStateKey {
    pub const RECENTLY_OPENED_DIRECTORIES: &'static str = "recently_opened_directories";
}

pub const STORE_FILE_NAME: &'static str = "store.json";
