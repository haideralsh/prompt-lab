import type { TreeNode } from "../types/FileTree";

interface FileTreeNodeProps {
  node: TreeNode;
  depth?: number;
  selectedPath?: string;
  onToggle(node: TreeNode): void;
  onSelect(node: TreeNode): void;
}

const INDENTS = [
  "pl-0",
  "pl-3",
  "pl-6",
  "pl-9",
  "pl-12",
  "pl-16",
  "pl-20",
  "pl-24",
  "pl-28",
  "pl-32",
];

export function FileTreeNode({
  node,
  depth = 0,
  selectedPath,
  onToggle,
  onSelect,
}: FileTreeNodeProps) {
  const isSelected = selectedPath === node.path;
  const indentClass = INDENTS[Math.min(depth, INDENTS.length - 1)];

  return (
    <div className={indentClass}>
      <button
        onClick={() => (node.isDirectory ? onToggle(node) : onSelect(node))}
        className={[
          "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left",
          "hover:bg-gray-50 focus:outline-none",
          isSelected ? "bg-blue-50 ring-1 ring-blue-200" : "",
        ].join(" ")}
      >
        {node.isDirectory ? (
          <span
            className="inline-block w-4 text-center text-gray-500"
            aria-hidden
          >
            {node.isExpanded ? "▾" : "▸"}
          </span>
        ) : (
          <span className="inline-block w-4" aria-hidden />
        )}
        <span
          className={[
            "truncate",
            isSelected ? "font-semibold text-blue-700" : "text-gray-700",
          ].join(" ")}
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