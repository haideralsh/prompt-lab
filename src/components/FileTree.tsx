import { invoke } from "@tauri-apps/api/core";
import { TreeNode } from "../types/FileTree";

interface FileTreeProps {
  nodes: TreeNode[];
  onUpdate(nodes: TreeNode[]): void;
  onSelect(node: TreeNode): void;
  selectedPath?: string;
  /**
   * When true, do not dynamically load directory children from the backend.
   * Used during filtered view to avoid expanding into non-matching nodes.
   */
  disableDynamicLoading?: boolean;
}

export function FileTree({
  nodes,
  onUpdate,
  onSelect,
  selectedPath,
  disableDynamicLoading = false,
}: FileTreeProps) {
  function toggle(node: TreeNode) {
    async function loadChildren(n: TreeNode): Promise<TreeNode[]> {
      return invoke<TreeNode[]>("list_directory", { path: n.path });
    }

    async function traverse(list: TreeNode[]): Promise<TreeNode[]> {
      return Promise.all(
        list.map(async (n) => {
          if (n.path === node.path) {
            if (n.isDirectory) {
              if (disableDynamicLoading) {
                // While filtered, we don't fetch new children; just toggle expand state.
                return { ...n, isExpanded: !n.isExpanded };
              }

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
    return list.map((n) => {
      const isSelected = selectedPath === n.path;
      return (
        <div key={n.path} style={{ paddingLeft: depth * 12 }}>
          <button
            onClick={() => (n.isDirectory ? toggle(n) : onSelect(n))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 6px",
              border: "none",
              background: isSelected
                ? "rgba(0, 120, 255, 0.12)"
                : "transparent",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {n.isDirectory && (
              <span
                style={{
                  cursor: "pointer",
                  display: "inline-block",
                  width: 16,
                  textAlign: "center",
                }}
              >
                {n.isExpanded ? "▾" : "▸"}
              </span>
            )}
            {!n.isDirectory && (
              <span style={{ width: 16, display: "inline-block" }} />
            )}
            <span
              style={{
                cursor: "pointer",
                userSelect: "none",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {n.name}
            </span>
          </button>
          {n.isDirectory &&
            n.isExpanded &&
            n.children &&
            renderNodes(n.children, depth + 1)}
        </div>
      );
    });
  }

  return <div>{renderNodes(nodes)}</div>;
}
