import { useEffect, useState } from "react";
import { DirectoryPicker } from "../DirectoryPicker";
import { load } from "@tauri-apps/plugin-store";
import { FolderIcon } from "../icons/folder";

interface BlankStateProps {
  onPick: (path: string) => void;
}

export function BlankState({ onPick }: BlankStateProps) {
  const [recentOpened, setRecentOpened] = useState<string[]>([]);

  useEffect(() => {
    async function loadRecentOpened() {
      const store = await load("store.json", { autoSave: false });
      setRecentOpened((await store.get<string[]>("recent-opened")) ?? []);
    }

    loadRecentOpened();
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <DirectoryPicker onPick={onPick} />
      <p className="mt-2 text-gray-400 text-sm">
        Choose a folder to explore and search files.
      </p>

      <ul role="list" className="flex flex-col gap-1 mt-8">
        <p className="mt-2 text-gray-400 text-sm mb-3">Recently opened</p>
        {recentOpened.map((path) => (
          <li
            role="button"
            onClick={() => onPick(path)}
            key={path}
            className="relative flex items-center py-3 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 rounded-md -mx-4 cursor-pointer"
          >
            <div className="min-w-0 flex-auto">
              <div className="flex items-center gap-2">
                <FolderIcon className="size-5 flex-none text-gray-400" />
                <h2 className="min-w-0 text-sm/6 font-semibold text-gray-900 dark:text-white">
                  {path}
                </h2>
              </div>
              <div className="text-xs/5 text-gray-500 dark:text-gray-400 ml-7">
                <p className="whitespace-nowrap">{path}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
