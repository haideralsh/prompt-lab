import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TreeNode } from "./types/FileTree";
import { FileTree } from "./components/FileTree";
import "./App.css";

const ERROR_CODES = {
  DIRECTORY_READ_ERROR: 1,
  DIALOG_CANCELLED: 2,
} as const;

interface DirectoryError {
  code: number;
  directory_name?: string;
}

function App() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [fullTree, setFullTree] = useState<TreeNode[]>([]);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);

  // Search UI state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  function clear() {
    setError("");
    setTree([]);
    setFullTree([]);
    setSelectedFile(null);
    setResults([]);
    setQuery("");
    setIsFiltered(false);
  }

  function collapseAll() {
    function collapse(list: TreeNode[]) {
      return list.map((node) => ({ ...node, isExpanded: false }));
    }
    setTree((prev) => collapse(prev));
    if (!isFiltered) {
      setFullTree((prev) => collapse(prev));
    }
  }

  async function openDirectory() {
    const pickedPath = await invoke<string>("open_directory").catch(
      async (err) => {
        const { code } = (await err) as DirectoryError;
        if (code !== ERROR_CODES.DIALOG_CANCELLED) {
          setError("Failed to open directory dialog");
        }
      },
    );

    if (!pickedPath) return;

    clear();
    setRootPath(pickedPath);

    await invoke<TreeNode[]>("list_directory", { path: pickedPath })
      .then((entries) => {
        const mapped = entries.map((e) => ({
          ...e,
          isExpanded: false,
          isLoaded: !e.isDirectory,
        }));
        setTree(mapped);
        setFullTree(mapped);
        setIsFiltered(false);
      })
      .catch((err) => {
        const { code, directory_name } = err as DirectoryError;
        if (code === ERROR_CODES.DIRECTORY_READ_ERROR) {
          setError(`Error reading directory ${directory_name ?? ""}`);
        } else {
          setError("Unknown error");
        }
      });
  }

  function getSep(p: string) {
    return p.includes("\\") ? "\\" : "/";
  }

  // Expand and load directories along the path to make the target visible in the tree
  async function expandInto(
    list: TreeNode[],
    targetPath: string,
  ): Promise<TreeNode[]> {
    const sep = getSep(targetPath);

    async function ensureChildrenLoaded(dirNode: TreeNode): Promise<TreeNode> {
      if (dirNode.isLoaded) {
        // Already loaded; just expand
        return { ...dirNode, isExpanded: true };
      }
      const children = await invoke<TreeNode[]>("list_directory", {
        path: dirNode.path,
      });
      const mapped = children.map((c) => ({
        ...c,
        isExpanded: false,
        // mark children as not yet loaded (consistent with FileTree toggle mapping)
        isLoaded: false,
      }));
      return {
        ...dirNode,
        isLoaded: true,
        isExpanded: true,
        children: mapped,
      };
    }

    return Promise.all(
      list.map(async (n) => {
        if (n.isDirectory) {
          const isAncestor =
            targetPath === n.path || targetPath.startsWith(n.path + sep);

          if (isAncestor) {
            const expanded = await ensureChildrenLoaded(n);
            const updatedChildren = await expandInto(
              expanded.children ?? [],
              targetPath,
            );
            return { ...expanded, children: updatedChildren };
          }

          if (n.children?.length) {
            const updatedChildren = await expandInto(n.children, targetPath);
            return { ...n, children: updatedChildren };
          }
        }
        return n;
      }),
    );
  }

  function filterTreeByMatches(
    list: TreeNode[],
    matchSet: Set<string>,
  ): TreeNode[] {
    function filterNodes(nodes: TreeNode[]): TreeNode[] {
      const out: TreeNode[] = [];
      for (const n of nodes) {
        if (n.isDirectory) {
          const keptChildren = n.children ? filterNodes(n.children) : [];
          if (keptChildren.length > 0) {
            out.push({
              ...n,
              isExpanded: true, // auto-expand to reveal matches
              children: keptChildren,
              isLoaded: true, // within filtered view, we consider this loaded
            });
          }
          // directories themselves are not "matches" (search returns files),
          // so we only keep dirs if they have kept children.
        } else {
          if (matchSet.has(n.path)) {
            out.push({ ...n });
          }
        }
      }
      return out;
    }
    return filterNodes(list);
  }

  async function runSearch() {
    if (!rootPath) {
      setError("Open a directory first to search.");
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      // Clear filter and restore original tree
      setResults([]);
      setIsFiltered(false);
      setTree(fullTree);
      setSelectedFile(null);
      return;
    }

    setIsSearching(true);
    setError("");
    try {
      const matchesRaw = await invoke<string[]>("search_files", {
        path: rootPath,
        term: trimmed,
      });

      // Deduplicate paths and ensure stable order
      const seen = new Set<string>();
      const matches: string[] = [];
      for (const p of matchesRaw) {
        if (!seen.has(p)) {
          seen.add(p);
          matches.push(p);
        }
      }
      setResults(matches);

      if (matches.length === 0) {
        setTree([]); // filtered to nothing
        setIsFiltered(true);
        setSelectedFile(null);
        return;
      }

      // Ensure all branches to each match are loaded, then filter.
      let updated = fullTree;
      for (const p of matches) {
        updated = await expandInto(updated, p);
      }

      const matchSet = new Set(matches);
      const filtered = filterTreeByMatches(updated, matchSet);

      setTree(filtered);
      // Keep fullTree intact so clearing restores it
      setIsFiltered(true);
      setSelectedFile(null);
    } catch (_e) {
      setError("Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={openDirectory}>Open directory</button>
        <button onClick={collapseAll}>Collapse all</button>
      </div>

      {/* Search controls */}
      <div
        style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}
      >
        <input
          type="text"
          placeholder="Filter tree by file name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          style={{ minWidth: 320, padding: "6px 8px" }}
          disabled={!rootPath}
        />
        <button onClick={runSearch} disabled={!rootPath || isSearching}>
          {isSearching ? "Filtering..." : "Filter"}
        </button>
        <button
          onClick={() => {
            setQuery("");
            setResults([]);
            setIsFiltered(false);
            setTree(fullTree);
            setSelectedFile(null);
          }}
          disabled={!isFiltered}
        >
          Clear filter
        </button>
        {isFiltered && (
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            {results.length} {results.length === 1 ? "match" : "matches"}
          </span>
        )}
      </div>

      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}

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
          {isFiltered ? "No matches found." : "Directory is empty."}
        </div>
      )}

      {selectedFile && (
        <div style={{ marginTop: 20, fontStyle: "italic" }}>
          Selected file: {selectedFile}
        </div>
      )}
    </main>
  );
}

export default App;
