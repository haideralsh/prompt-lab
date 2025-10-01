use crate::commands::directory::command::list::list_directory;
use crate::commands::tree::cache::cache;
use crate::errors::ApplicationError;
use crate::models::{DirectoryNode, NodeInfo, TreeIndex};
use std::collections::HashMap;

fn index_node(node: &DirectoryNode, parent: Option<&str>, tree_index: &mut TreeIndex) {
    let id = node.id.clone();
    let title = node.title.clone();
    let node_type = node.node_type.clone();

    let mut child_ids = Vec::new();
    for child in &node.children {
        child_ids.push(child.id.clone());
    }

    tree_index.nodes.insert(
        id.clone(),
        NodeInfo {
            id: id.clone(),
            title: title.clone(),
            node_type: node_type.clone(),
            children: child_ids,
            parent: parent.map(|p| p.to_string()),
        },
    );

    tree_index
        .titles
        .push((id.clone(), title.trim().to_lowercase()));

    for child in &node.children {
        index_node(child, Some(&id), tree_index);
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
