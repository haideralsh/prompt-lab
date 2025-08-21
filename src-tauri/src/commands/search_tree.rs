use crate::commands::list_directory::list_directory;
use crate::errors::DirectoryError;
use crate::models::DirNode;

#[tauri::command]
pub(crate) fn search_tree(path: String, term: String) -> Result<Vec<DirNode>, DirectoryError> {
    let full_tree = list_directory(path)?;

    let trimmed = term.trim().to_string();
    if trimmed.is_empty() {
        return Ok(full_tree);
    }

    let term_lower = trimmed.to_lowercase();

    fn filter_tree(nodes: Vec<DirNode>, term_lower: &str) -> Vec<DirNode> {
        let mut filtered: Vec<DirNode> = Vec::new();

        for node in nodes {
            if node.node_type == "file" {
                // For files, check if the name contains the search term
                if node.title.to_lowercase().contains(term_lower) {
                    filtered.push(node);
                }
            } else if node.node_type == "directory" {
                // For directories, recursively filter children
                let filtered_children = filter_tree(node.children, term_lower);

                // Include directory if it has matching children
                if !filtered_children.is_empty() {
                    filtered.push(DirNode {
                        id: node.id,
                        title: node.title,
                        node_type: node.node_type,
                        children: filtered_children,
                    });
                }
            }
        }

        filtered
    }

    Ok(filter_tree(full_tree, &term_lower))
}
