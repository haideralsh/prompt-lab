import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { TreeNode } from "./types/FileTree";
import { FileTree } from "./components/FileTree";

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
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  function clear() {
    setError("");
    setTree([]);
    setSelectedFile(null);
  }

  async function openDirectory() {
    clear();

    const pickedPath = await invoke<string>("open_directory").catch((err) => {
      const { code } = err as DirectoryError;
      if (code !== ERROR_CODES.DIALOG_CANCELLED) {
        setError("Failed to open directory dialog");
      }
      throw err;
    });

    if (!pickedPath) return;

    await invoke<TreeNode[]>("list_directory", { path: pickedPath })
      .then((entries) => {
        setTree(
          entries.map((e) => ({
            ...e,
            isExpanded: false,
            isLoaded: true,
          })),
        );
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

  return (
    <main style={{ padding: 20 }}>
      <button onClick={openDirectory}>Open directory</button>

      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}

      {tree.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <FileTree
            nodes={tree}
            onUpdate={setTree}
            onSelect={(n) => !n.isDirectory && setSelectedFile(n.path)}
          />
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
