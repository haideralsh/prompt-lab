import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ERROR_CODES } from "../constants";
import { ErrorBanner } from "./common/ErrorBanner";

interface DirectoryPickerProps {
  onPick: (path: string) => void;
  buttonClassName?: string;
}

interface DirectoryError {
  code: number;
}

export function DirectoryPicker({ onPick, buttonClassName }: DirectoryPickerProps) {
  const [error, setError] = useState("");

  async function openDirectory() {
    setError("");
    const pickedPath = await invoke<string>("open_directory").catch(async (err) => {
      const { code } = (await err) as DirectoryError;
      if (code !== ERROR_CODES.DIALOG_CANCELLED) {
        setError("Failed to open directory dialog");
      }
    });

    if (!pickedPath) return;
    onPick(pickedPath);
  }

  return (
    <div className="flex flex-col items-center">
      <button
        className={buttonClassName ?? "flex items-center gap-2 text-sm cursor-pointer"}
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

      <ErrorBanner message={error} />
    </div>
  );
}