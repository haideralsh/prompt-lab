import { useState } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { LaunchScreen } from "./components/BlankState";
import type { DirectoryInfo } from "./types/DirectoryInfo";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [root, setRoot] = useState<DirectoryInfo | null>(null);

  function handleDirectoryPick(dir: DirectoryInfo) {
    setRoot(dir);
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
            <Sidebar root={root} />
          </aside>
          <section className="flex-1" />
        </>
      ) : (
        <LaunchScreen onPick={handleDirectoryPick} />
      )}
    </main>
  );
}

export default App;
