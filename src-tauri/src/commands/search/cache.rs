use crate::models::TreeIndex;
use std::collections::HashMap;
use std::sync::{OnceLock, RwLock};

static CACHE: OnceLock<RwLock<HashMap<String, TreeIndex>>> = OnceLock::new();

pub fn cache() -> &'static RwLock<HashMap<String, TreeIndex>> {
    CACHE.get_or_init(|| RwLock::new(HashMap::new()))
}
