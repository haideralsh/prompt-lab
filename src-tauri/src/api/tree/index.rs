use crate::api::directory::command::list::list_directory;
use crate::api::tree::cache::cache;
use crate::errors::ApplicationError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryNode {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub node_type: String,
    #[serde(default)]
    pub children: Vec<DirectoryNode>,
    #[serde(skip)]
    pub parent: Option<String>,
    #[serde(skip)]
    pub child_ids: Vec<String>,
}

pub struct TreeIndex {
    pub top_level: Vec<String>,
    pub nodes: HashMap<String, DirectoryNode>,
    pub titles: Vec<(String, String)>,
}

fn index_node(node: &DirectoryNode, parent: Option<&str>, tree_index: &mut TreeIndex) {
    let child_ids: Vec<String> = node.children.iter().map(|child| child.id.clone()).collect();

    tree_index.nodes.insert(
        node.id.clone(),
        DirectoryNode {
            id: node.id.clone(),
            title: node.title.clone(),
            node_type: node.node_type.clone(),
            children: Vec::new(),
            parent: parent.map(|p| p.to_string()),
            child_ids: child_ids.clone(),
        },
    );

    tree_index
        .titles
        .push((node.id.clone(), node.title.trim().to_lowercase()));

    for child in &node.children {
        index_node(child, Some(&node.id), tree_index);
    }
}

fn build_index(full_tree: Vec<DirectoryNode>) -> TreeIndex {
    let mut tree_index = TreeIndex {
        top_level: Vec::new(),
        nodes: HashMap::new(),
        titles: Vec::new(),
    };

    for node in &full_tree {
        tree_index.top_level.push(node.id.clone());
        index_node(node, None, &mut tree_index);
    }

    tree_index
}

pub fn ensure_index(path: &str) -> Result<(), ApplicationError> {
    {
        if cache()
            .read()
            .expect("cache read poisoned")
            .contains_key(path)
        {
            return Ok(());
        }
    }

    let full_tree = list_directory(path)?;
    let index = build_index(full_tree);

    {
        cache()
            .write()
            .expect("cache write poisoned")
            .insert(path.to_string(), index);
    }

    Ok(())
}
