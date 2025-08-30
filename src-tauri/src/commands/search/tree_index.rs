use crate::commands::list_directory::list_directory;
use crate::commands::search::cache::cache;
use crate::errors::DirectoryError;
use crate::models::{DirectoryNode, NodeInfo, TreeIndex};
use std::collections::HashMap;

pub fn ensure_index(path: &str) -> Result<(), DirectoryError> {
    {
        let guard = cache().read().expect("cache read poisoned");
        if guard.contains_key(path) {
            return Ok(());
        }
    }

    let full_tree = list_directory(path.to_string())?;
    let index = build_index(full_tree);

    {
        let mut guard = cache().write().expect("cache write poisoned");
        guard.insert(path.to_string(), index);
    }

    Ok(())
}

fn build_index(full_tree: Vec<DirectoryNode>) -> TreeIndex {
    let mut idx = TreeIndex {
        top_level: Vec::new(),
        nodes: HashMap::new(),
        file_titles_lower: Vec::new(),
        dir_titles_lower: Vec::new(),
    };

    for n in &full_tree {
        idx.top_level.push(n.id.clone());
    }

    fn index_node(node: &DirectoryNode, parent: Option<&str>, idx: &mut TreeIndex) {
        let id = node.id.clone();
        let title = node.title.clone();
        let node_type = node.node_type.clone();

        let mut child_ids = Vec::new();
        for c in &node.children {
            child_ids.push(c.id.clone());
        }

        idx.nodes.insert(
            id.clone(),
            NodeInfo {
                id: id.clone(),
                title: title.clone(),
                node_type: node_type.clone(),
                children: child_ids,
                parent: parent.map(|p| p.to_string()),
            },
        );

        let lower = title.to_lowercase();
        if node_type == "file" {
            idx.file_titles_lower.push((id.clone(), lower));
        } else {
            idx.dir_titles_lower.push((id.clone(), lower));
        }

        for c in &node.children {
            index_node(c, Some(&id), idx);
        }
    }

    for n in &full_tree {
        index_node(n, None, &mut idx);
    }

    idx
}
