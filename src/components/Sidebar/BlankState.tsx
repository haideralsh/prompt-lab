import { useEffect, useState } from "react";
import { DirectoryPicker } from "../DirectoryPicker";
import { FolderIcon } from "../icons/folder";
import type { DirectoryInfo } from "../../types/DirectoryInfo";
import { RecentFolders } from "../../utils/recentFolders";

interface BlankStateProps {
  onPick: (dir: DirectoryInfo) => void;
}

export function BlankState({ onPick }: BlankStateProps) {
  const [recentOpened, setRecentOpened] = useState<DirectoryInfo[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecentOpened() {
      try {
        const list = await RecentFolders.getRecentFolders();
        if (!cancelled) setRecentOpened(list);
      } catch {
        if (!cancelled) setRecentOpened([]);
      }
    }

    void loadRecentOpened();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <DirectoryPicker onPick={onPick} />
      <p className="mt-2 text-gray-400 text-sm">
        Choose a folder to explore and search files.
      </p>

      {recentOpened.length > 0 && (
        <ul
          role="list"
          className="flex flex-col gap-1 mt-8 w-full max-w-[520px]"
        >
          <p className="mt-2 text-gray-400 text-sm mb-3">Recently opened</p>
          {recentOpened.map((dir) => (
            <li
              role="button"
              onClick={() => onPick(dir)}
              key={`${dir.path}|${dir.name}`}
              className="relative flex items-center py-3 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 rounded-md -mx-4 cursor-pointer"
            >
              <div className="min-w-0 flex-auto">
                <div className="flex items-center gap-2">
                  <FolderIcon className="size-5 flex-none text-gray-400" />
                  <h2 className="min-w-0 text-sm/6 font-semibold text-gray-900 dark:text-white">
                    {dir.name}
                  </h2>
                </div>
                <div className="text-xs/5 text-gray-500 dark:text-gray-400 ml-7">
                  <p className="whitespace-nowrap">{dir.path}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
