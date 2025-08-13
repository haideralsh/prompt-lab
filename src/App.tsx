import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TreeNode } from "./types/FileTree";
import { ERROR_CODES } from "./constants";
import { Sidebar } from "./components/Sidebar/Sidebar";

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
  const [query, setQuery] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  function clear() {
    setError("");
    setTree([]);
    setFullTree([]);
    setSelectedFile(null);
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
          isLoaded: !e.isDirectory ? true : false,
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

  async function runSearch(nextQuery?: string) {
    if (!rootPath) {
      setError("Open a directory first to search.");
      return;
    }

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
    <main className="text-[#D0D0D0] bg-black h-dvh flex flex-col">
      {(tree.length > 0 || isFiltered) ? (
        <Sidebar
          query={query}
          setQuery={setQuery}
          tree={tree}
          setTree={setTree}
          setFullTree={setFullTree}
          error={error}
          rootPath={rootPath}
          isFiltered={isFiltered}
          setSelectedFile={setSelectedFile}
          selectedFile={selectedFile}
          collapseAll={collapseAll}
          runSearch={runSearch}
          setIsFiltered={setIsFiltered}
        />
      ) : (
        <div className="flex flex-col h-full items-center justify-center">
          <button
            className="flex items-center gap-2 text-sm cursor-pointer"
            onClick={openDirectory}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path d="M19.906 9c.382 0 .749.057 1.094.162V9a3 3 0 0 0-3-3h-3.879a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H6a3 3 0 0 0-3 3v3.162A3.756 3.756 0 0 1 4.094 9h15.812ZM4.094 10.5a2.25 2.25 0 0 0-2.227 2.568l.857 6A2.25 2.25 0 0 0 4.951 21H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-2.227-2.568H4.094Z" />
            </svg>
            <span>Open a directory</span>
          </button>

          {/*This should move to a dialog*/}
          {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
        </div>
      )}
    </main>
  );
}

export default App;
