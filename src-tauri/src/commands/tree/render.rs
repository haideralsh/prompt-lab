use crate::models::DirectoryNode;
use std::collections::{BTreeMap, BTreeSet, HashSet};
use std::path::{Path, PathBuf};

#[derive(Default)]
struct DirEntry {
    dirs: BTreeMap<String, DirEntry>,
    files: BTreeSet<String>,
}

fn common_root_dir(paths: &[PathBuf]) -> PathBuf {
    if paths.is_empty() {
        return PathBuf::new();
    }

    let mut root = paths[0]
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| paths[0].clone());

    for p in &paths[1..] {
        let other = p
            .parent()
            .map(|pp| pp.to_path_buf())
            .unwrap_or_else(|| p.clone());

        let mut new_root = PathBuf::new();
        let mut a = root.components();
        let mut b = other.components();
        loop {
            match (a.next(), b.next()) {
                (Some(ac), Some(bc)) if ac == bc => new_root.push(ac.as_os_str()),
                _ => break,
            }
        }
        root = new_root;
        if root.as_os_str().is_empty() {
            break;
        }
    }

    root
}

fn insert_file(tree: &mut DirEntry, rel_path: &Path) {
    let mut parts: Vec<String> = rel_path
        .components()
        .map(|c| c.as_os_str().to_string_lossy().into_owned())
        .collect();

    if parts.is_empty() {
        return;
    }

    let file_name = parts.pop().unwrap();

    let mut cur = tree;
    for dir in parts {
        cur = cur.dirs.entry(dir).or_default();
    }

    cur.files.insert(file_name);
}

fn render_dir(node: &DirEntry, prefix: &str, lines: &mut Vec<String>) {
    let dir_names: Vec<&String> = node.dirs.keys().collect();
    let file_names: Vec<&String> = node.files.iter().collect();
    let total = dir_names.len() + file_names.len();

    for (idx, name) in dir_names.iter().enumerate() {
        let is_last = idx + file_names.len() + 0 == total - 0 - 1 && file_names.is_empty();
        let connector = if is_last { "└── " } else { "├── " };
        lines.push(format!("{prefix}{connector}{name}"));
        let child_prefix = format!("{prefix}{}", if is_last { "    " } else { "│   " });
        if let Some(child) = node.dirs.get(*name) {
            render_dir(child, &child_prefix, lines);
        }
    }

    for (i, fname) in file_names.iter().enumerate() {
        let is_last = dir_names.is_empty() && i == file_names.len() - 1
            || (!dir_names.is_empty() && i + dir_names.len() == total - 1);
        let connector = if is_last { "└── " } else { "├── " };

        lines.push(format!("{prefix}{connector}{fname}"));
    }
}

pub fn render_selected_tree(files: &[PathBuf]) -> String {
    if files.is_empty() {
        return String::new();
    }

    let root = common_root_dir(files);
    let mut tree = DirEntry::default();

    for f in files {
        if f.is_file() {
            let rel = if root.as_os_str().is_empty() {
                f.as_path()
            } else {
                f.strip_prefix(&root).unwrap_or_else(|_| f.as_path())
            };
            insert_file(&mut tree, rel);
        }
    }

    let mut lines: Vec<String> = Vec::new();
    render_dir(&tree, "", &mut lines);
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
