import type { TreeNode } from "../../types/FileTree";
import { FileTree } from "../FileTree";

interface SidebarProps {
  tree: TreeNode[];
  setTree: (tree: TreeNode[]) => void;
  query: string;
  setQuery: (query: string) => void;
  setFullTree: (tree: TreeNode[]) => void;
  error: string;
  rootPath: string | null;
  isFiltered: boolean;
  setSelectedFile: (file: string | null) => void;
  selectedFile: string | null;
  collapseAll: () => void;
  runSearch: (query: string) => Promise<void>;
  setIsFiltered: (isFiltered: boolean) => void;
}

export function Sidebar({
  query,
  setQuery,
  tree,
  setTree,
  setFullTree,
  error,
  rootPath,
  isFiltered,
  setIsFiltered,
  setSelectedFile,
  selectedFile,
  collapseAll,
  runSearch,
}: SidebarProps) {
  return (
    <>
      <button onClick={collapseAll}>Collapse all</button>

      <div
        style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}
      >
        <input
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Filter tree by file name..."
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (rootPath) {
              void runSearch(value);
            }
          }}
          style={{ minWidth: 320, padding: "6px 8px" }}
          disabled={!rootPath}
        />
        <button
          onClick={() => {
            setQuery("");
            setIsFiltered(false);
            setSelectedFile(null);
            void runSearch("");
          }}
          disabled={!isFiltered}
        >
          Clear search
        </button>
      </div>
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

      {!error && rootPath && tree.length === 0 && (
        <div style={{ marginTop: 16, fontStyle: "italic", opacity: 0.8 }}>
          {isFiltered ? "No results found." : "Directory is empty."}
        </div>
      )}

      {selectedFile && (
        <div style={{ marginTop: 20, fontStyle: "italic" }}>
          Selected file: {selectedFile}
        </div>
      )}
    </>
  );
}
