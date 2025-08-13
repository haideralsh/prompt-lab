import { useEffect, useState } from "react";
import type { TreeNode } from "../../types/FileTree";
import { invoke } from "@tauri-apps/api/core";
import { ERROR_CODES } from "../../constants";
import { FileTree } from "../FileTree";
import { SearchBar } from "./SearchBar";
import { TreeStatus } from "./TreeStatus";
import { SelectedFileInfo } from "./SelectedFileInfo";
import { ErrorBanner } from "../common/ErrorBanner";

interface SidebarProps {
  rootPath: string;
}

interface DirectoryError {
  code: number;
  directory_name?: string;
}

export function Sidebar({ rootPath }: SidebarProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [fullTree, setFullTree] = useState<TreeNode[]>([]);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  // Load initial tree when rootPath changes
  useEffect(() => {
    let cancelled = false;

    async function loadRoot() {
      setError("");
      setSelectedFile(null);
      setQuery("");
      setIsFiltered(false);
      try {
        const entries = await invoke<TreeNode[]>("list_directory", { path: rootPath });
        const mapped = entries.map((e) => ({
          ...e,
          isExpanded: false,
          isLoaded: !e.isDirectory ? true : false,
        }));
        if (!cancelled) {
          setTree(mapped);
          setFullTree(mapped);
        }
      } catch (err) {
        const e = err as DirectoryError;
        if (e && e.code === ERROR_CODES.DIRECTORY_READ_ERROR) {
          setError(`Error reading directory ${e.directory_name ?? ""}`);
        } else {
          setError("Unknown error");
        }
        if (!cancelled) {
          setTree([]);
          setFullTree([]);
        }
      }
    }

    void loadRoot();
    return () => {
      cancelled = true;
    };
  }, [rootPath]);

  function collapseAll() {
    function collapse(list: TreeNode[]) {
      return list.map((node) => ({ ...node, isExpanded: false }));
    }
    setTree((prev) => collapse(prev));
    if (!isFiltered) setFullTree((prev) => collapse(prev));
  }

  async function runSearch(nextQuery?: string) {
    const term = nextQuery ?? query;
    const trimmed = term.trim();

    if (!trimmed) {
      // Clear filter and restore original tree
      setIsFiltered(false);
      setSelectedFile(null);
      setTree(fullTree);
      return;
    }

    setError("");
    try {
      const filteredTree = await invoke<TreeNode[]>("search_tree", {
        path: rootPath,
        term: trimmed,
      });

      // Mark directories as expanded and loaded so the filtered view opens all branches.
      function mark(nodes: TreeNode[]): TreeNode[] {
        return nodes.map((n) => {
          if (n.isDirectory) {
            const children = n.children ? mark(n.children) : [];
            return {
              ...n,
              isExpanded: true,
              isLoaded: true,
              children,
            };
          }
          return { ...n };
        });
      }

      const prepared = mark(filteredTree);
      setTree(prepared);
      setIsFiltered(true);
      setSelectedFile(null);
    } catch (_e) {
      setError("Search failed");
    }
  }

  return (
    <>
      <button onClick={collapseAll}>Collapse all</button>

      <SearchBar
        value={query}
        onChange={(value) => {
          setQuery(value);
          void runSearch(value);
        }}
        onClear={() => {
          setQuery("");
          setIsFiltered(false);
          setSelectedFile(null);
          void runSearch("");
        }}
        disabled={!rootPath}
        isFiltered={isFiltered}
      />

      <ErrorBanner message={error} />

      {/* Tree */}
      {tree.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <FileTree
            nodes={tree}
            onUpdate={(nodes) => {
              setTree(nodes);
              // Keep source-of-truth in sync only when not filtered
              if (!isFiltered) setFullTree(nodes);
            }}
            onSelect={(n) => !n.isDirectory && setSelectedFile(n.path)}
            selectedPath={selectedFile ?? undefined}
            disableDynamicLoading={isFiltered}
          />
        </div>
      )}

      <TreeStatus show={!error && tree.length === 0} isFiltered={isFiltered} />

      <SelectedFileInfo path={selectedFile} />
    </>
  );
}
