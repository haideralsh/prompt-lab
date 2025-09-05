use crate::models::DirectoryNode;
use std::collections::HashSet;

pub fn render_selected_tree(nodes: &[DirectoryNode], selected: &HashSet<String>) -> String {
    fn mark_kept(
        node: &DirectoryNode,
        selected: &HashSet<String>,
        keep: &mut HashSet<String>,
    ) -> bool {
        let mut any_child_kept = false;
        for child in &node.children {
            if mark_kept(child, selected, keep) {
                any_child_kept = true;
            }
        }

        let is_selected = selected.contains(&node.id);
        if is_selected || any_child_kept {
            keep.insert(node.id.clone());
            true
        } else {
            false
        }
    }

    fn render_kept(
        nodes: &[DirectoryNode],
        prefix: &str,
        lines: &mut Vec<String>,
        selected: &HashSet<String>,
        keep: &HashSet<String>,
    ) {
        let visible: Vec<&DirectoryNode> = nodes.iter().filter(|n| keep.contains(&n.id)).collect();

        for (idx, node) in visible.iter().enumerate() {
            let is_last = idx == visible.len() - 1;
            let connector = if is_last { "└── " } else { "├── " };

            let mut title = node.title.clone();
            if selected.contains(&node.id) {
                title.push_str(" *");
            }

            lines.push(format!("{prefix}{connector}{title}"));

            if node.node_type == "directory" {
                let child_prefix = format!("{prefix}{}", if is_last { "    " } else { "│   " });
                render_kept(&node.children, &child_prefix, lines, selected, keep);
            }
        }
    }

    if nodes.is_empty() {
        return String::new();
    }

    let mut keep: HashSet<String> = HashSet::new();
    for n in nodes {
        mark_kept(n, selected, &mut keep);
    }

    let mut lines: Vec<String> = Vec::new();
    render_kept(nodes, "", &mut lines, selected, &keep);
    lines.join("\n")
}

pub fn render_full_tree(nodes: &[DirectoryNode], selected: &HashSet<String>) -> String {
    fn render_nodes(
        nodes: &[DirectoryNode],
        prefix: &str,
        lines: &mut Vec<String>,
        selected: &HashSet<String>,
    ) {
        for (idx, node) in nodes.iter().enumerate() {
            let is_last = idx == nodes.len() - 1;
            let connector = if is_last { "└── " } else { "├── " };

            let mut title = node.title.clone();
            if selected.contains(&node.id) {
                title.push_str(" *");
            }

            lines.push(format!("{prefix}{connector}{title}"));

            if node.node_type == "directory" {
                let child_prefix = format!("{prefix}{}", if is_last { "    " } else { "│   " });
                render_nodes(&node.children, &child_prefix, lines, selected);
            }
        }
    }

    if nodes.is_empty() {
        return String::new();
    }

    let mut lines: Vec<String> = Vec::new();
    render_nodes(nodes, "", &mut lines, selected);
    lines.join("\n")
}
