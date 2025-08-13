import type { TreeNode } from "../types/FileTree";

interface FileTreeNodeProps {
  node: TreeNode;
  depth?: number;
  selectedPath?: string;
  onToggle(node: TreeNode): void;
  onSelect(node: TreeNode): void;
}

export function FileTreeNode({
  node,
  depth = 0,
  selectedPath,
  onToggle,
  onSelect,
}: FileTreeNodeProps) {
  const isSelected = selectedPath === node.path;

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <button
        onClick={() => (node.isDirectory ? onToggle(node) : onSelect(node))}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 6px",
          border: "none",
          background: isSelected ? "rgba(0, 120, 255, 0.12)" : "transparent",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {node.isDirectory && (
          <span
            style={{
              cursor: "pointer",
              display: "inline-block",
              width: 16,
              textAlign: "center",
            }}
          >
            {node.isExpanded ? "▾" : "▸"}
          </span>
        )}
        {!node.isDirectory && (
          <span style={{ width: 16, display: "inline-block" }} />
        )}
        <span
          style={{
            cursor: "pointer",
            userSelect: "none",
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          {node.name}
        </span>
      </button>

      {node.isDirectory &&
        node.isExpanded &&
        node.children &&
        node.children.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}