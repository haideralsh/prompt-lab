import { useState } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { BlankState } from "./components/Sidebar/BlankState";
import { load } from "@tauri-apps/plugin-store";

const toStore = (s: Set<string>) => [...s];
const fromStore = (arr?: string[]) => new Set(arr ?? []);

async function saveRecentOpened(path: string) {
  const store = await load("store.json", { autoSave: false });

  const arr = fromStore(await store.get<string[]>("recent-opened"));

  arr.add(path);

  await store.set("recent-opened", toStore(arr));
  await store.save();
}

function App() {
  const [rootPath, setRootPath] = useState<string | null>(null);

  function handleFilePick(path: string) {
    setRootPath(path);
    saveRecentOpened(path);
  }

  return (
    <main className="text-[#D0D0D0] bg-black h-dvh flex flex-col">
      {rootPath ? (
        <Sidebar rootPath={rootPath} />
      ) : (
        <BlankState onPick={handleFilePick} />
      )}
    </main>
  );
}

export default App;
