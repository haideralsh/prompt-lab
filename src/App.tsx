import { useState } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { BlankState } from "./components/Sidebar/BlankState";
import type { DirectoryInfo } from "./types/DirectoryInfo";
import { RecentFolders } from "./utils/recentFolders";

function App() {
  const [root, setRoot] = useState<DirectoryInfo | null>(null);

  function handleDirectoryPick(dir: DirectoryInfo) {
    setRoot(dir);

    // Change to an invoke function to the backend
    void RecentFolders.addRecentFolder(dir);
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
