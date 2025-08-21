import { useState } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { LaunchScreen } from "./components/BlankState";
import type { DirectoryInfo } from "./types/DirectoryInfo";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [root, setRoot] = useState<DirectoryInfo | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  function handleDirectoryPick(dir: DirectoryInfo) {
    setRoot(dir);
    setSelectedFiles([]);
    void invoke("add_recent_folder", { folder: dir });
  }

  const shellClassesWhenOpen =
    "h-dvh flex text-gray-900 bg-white";
  const shellClassesWhenClosed =
    "h-dvh flex flex-col text-[#D0D0D0] bg-black";

  return (
    <main className={root ? shellClassesWhenOpen : shellClassesWhenClosed}>
      {root ? (
        <>
          <aside className="w-72 shrink-0 border-r border-gray-200 p-4 flex flex-col">
            <Sidebar root={root} onSelectedFilesChange={setSelectedFiles} />
          </aside>
          <section className="flex-1 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Selected files</h2>
            {selectedFiles.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-900">
                {selectedFiles.map((path) => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">No files selected.</div>
            )}
          </section>
        </>
      ) : (
        <LaunchScreen onPick={handleDirectoryPick} />
      )}
    </main>
  );
}

export default App;
