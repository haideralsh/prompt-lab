use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DirEntryInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

// TODO: why do we have both this and the NodeInfo?
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryNode {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub node_type: String, // "file" | "directory"
    pub children: Vec<DirectoryNode>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub path: String,
    pub title: String,
    pub token_count: Option<usize>,
    pub pretty_path: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub matched_ids_count: usize,
    pub results: Vec<DirectoryNode>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PickedDirectory {
    pub name: String,
    pub path: String,
    pub pretty_path: String,
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
    pub selected_nodes_paths: Vec<String>,
    pub indeterminate_nodes_paths: Vec<String>,
    pub selected_files: Vec<FileNode>,
}


// TODO: Move all the Git related models to the related module in the src/commands/git folder
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitChange {
    pub path: String,
    pub change_type: String,
    pub lines_added: i32,
    pub lines_deleted: i32,
    pub token_count: Option<usize>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitTokenCacheEntry {
    pub diff_hash: String,
    pub token_count: usize,
}

#[derive(Clone)]
pub struct GitDiffData {
    pub lines_added: i32,
    pub lines_deleted: i32,
    pub diff_bytes: Arc<Vec<u8>>,
    pub diff_hash: String,
}

#[derive(Clone)]
pub struct GitDiffWorkItem {
    pub path: String,
    pub diff_bytes: Arc<Vec<u8>>,
    pub diff_hash: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitTokenCountsEvent {
    pub root: String,
    pub files: HashMap<String, usize>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatusEvent {
    pub root: String,
    pub changes: Vec<GitChange>,
}
