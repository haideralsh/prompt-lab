use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DirEntryInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DirNode {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub children: Vec<DirNode>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PickedDirectory {
    pub name: String,
    pub path: String,
}

pub struct NodeInfo {
    pub id: String,
    pub title: String,
    pub node_type: String,
    pub children: Vec<String>,
    pub parent: Option<String>,
}

pub struct TreeIndex {
    pub top_level: Vec<String>,
    pub nodes: HashMap<String, NodeInfo>,
    pub file_titles_lower: Vec<(String, String)>,
    pub dir_titles_lower: Vec<(String, String)>,
}
