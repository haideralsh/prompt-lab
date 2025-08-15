import { useState } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { BlankState } from "./components/Sidebar/BlankState";
import type { DirectoryInfo } from "./types/DirectoryInfo";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [root, setRoot] = useState<DirectoryInfo | null>(null);

  function handleDirectoryPick(dir: DirectoryInfo) {
    setRoot(dir);

    // Invoke backend to add folder to recents
    void invoke("add_recent_folder", { folder: dir });
  }

  return (
    <main className="text-[#D0D0D0] bg-black h-dvh flex flex-col">
      {root ? (
        <Sidebar root={root} />
      ) : (
        <BlankState onPick={handleDirectoryPick} />
      )}
    </main>
  );
}

export default App;
