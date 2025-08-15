import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ERROR_CODES } from "../constants";
import { ErrorBanner } from "./common/ErrorBanner";
import type { DirectoryInfo } from "../types/DirectoryInfo";
import { OpenFolderIcon } from "./icons/openFolder";

interface DirectoryPickerProps {
  onPick: (dir: DirectoryInfo) => void;
  buttonClassName?: string;
}

interface DirectoryError {
  code: number;
}

export function DirectoryPicker({
  onPick,
  buttonClassName,
}: DirectoryPickerProps) {
  const [error, setError] = useState("");
  const [lastOpened, setLastOpened] = useState<DirectoryInfo | null>(null);

  async function openDirectory() {
    setError("");

    try {
      const picked = await invoke<DirectoryInfo>("open_directory");
      setLastOpened(picked);
      onPick(picked);
    } catch (err) {
      const { code } = (err as DirectoryError) ?? {};
      if (code !== ERROR_CODES.DIALOG_CANCELLED) {
        setError("Failed to open directory dialog");
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        className={
          buttonClassName ?? "flex items-center gap-2 text-sm cursor-pointer"
        }
        onClick={openDirectory}
      >
        <OpenFolderIcon className="size-6" />
        <span>Open a directory</span>
      </button>

      {lastOpened && (
        <div className="mt-2 text-gray-500 text-sm italic">
          Opened: <span className="font-medium">{lastOpened.name}</span>
        </div>
      )}

      <ErrorBanner message={error} />
    </div>
  );
}
