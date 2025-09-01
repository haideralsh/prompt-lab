use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DirEntryInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

// TODO: why do we have both this and the NodeInfo?
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryNode {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub node_type: String, // "file" | "directory"
    pub children: Vec<DirectoryNode>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub id: String,
    pub title: String,
    pub token_count: Option<usize>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub matched_ids_count: usize,
    pub results: Vec<DirectoryNode>,
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
    pub titles: Vec<(String, String)>,
}

pub struct NodeTree {
    pub nodes: Vec<DirectoryNode>,
    pub total_nodes: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectionResult {
    pub selected: Vec<String>,
    pub indeterminate: Vec<String>,
    pub selected_files: Vec<FileNode>,
}
