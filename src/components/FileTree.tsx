import { invoke } from "@tauri-apps/api/core";
import { TreeNode } from "../types/FileTree";

interface FileTreeProps {
  nodes: TreeNode[];
  onUpdate(nodes: TreeNode[]): void;
  onSelect(node: TreeNode): void;
}

export function FileTree({ nodes, onUpdate, onSelect }: FileTreeProps) {
  function toggle(node: TreeNode) {
    async function loadChildren(n: TreeNode): Promise<TreeNode[]> {
      return invoke<TreeNode[]>("list_directory", { path: n.path });
    }

    async function traverse(list: TreeNode[]): Promise<TreeNode[]> {
      return Promise.all(
        list.map(async (n) => {
          if (n.path === node.path) {
            if (n.isDirectory) {
              if (!n.isLoaded) {
                const children = await loadChildren(n);
                return {
                  ...n,
                  isLoaded: true,
                  isExpanded: true,
                  children: children.map((c) => ({
                    ...c,
                    isExpanded: false,
                    isLoaded: false,
                  })),
                };
              } else {
                return { ...n, isExpanded: !n.isExpanded };
              }
            }
          }

          if (n.children?.length) {
            const updated = await traverse(n.children);
            return { ...n, children: updated };
          }
          return n;
        }),
      );
    }

    traverse(nodes).then(onUpdate);
  }

  function renderNodes(list: TreeNode[], depth = 0) {
    return list.map((n) => (
      <div key={n.path} style={{ paddingLeft: depth * 12 }}>
        {n.isDirectory && (
          <span
            style={{
              cursor: "pointer",
              display: "inline-block",
              width: 16,
              textAlign: "center",
            }}
            onClick={() => toggle(n)}
          >
            {n.isExpanded ? "▾" : "▸"}
          </span>
        )}
        {!n.isDirectory && (
          <span style={{ width: 16, display: "inline-block" }} />
        )}
        <span
          onClick={() => onSelect(n)}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          {n.name}
        </span>
        {n.isDirectory &&
          n.isExpanded &&
          n.children &&
          renderNodes(n.children, depth + 1)}
      </div>
    ));
  }

  return <div>{renderNodes(nodes)}</div>;
}
