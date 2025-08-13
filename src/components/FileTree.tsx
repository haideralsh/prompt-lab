import { invoke } from "@tauri-apps/api/core";
import type { TreeNode } from "../types/FileTree";
import { FileTreeNode } from "./FileTreeNode";

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
  async function toggle(node: TreeNode) {
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

  return (
    <div>
      {nodes.map((n) => (
        <FileTreeNode
          key={n.path}
          node={n}
          depth={0}
          selectedPath={selectedPath}
          onToggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
