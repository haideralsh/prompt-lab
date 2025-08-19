import { invoke } from "@tauri-apps/api/core";
import { ERROR_CODES } from "../constants";
import type { DirectoryInfo } from "../types/DirectoryInfo";
import { OpenFolderIcon } from "./icons/openFolder";
import { DirectoryError } from "../types/DirectoryError";

interface DirectoryPickerProps {
  onPick: (dir: DirectoryInfo) => void;
  onError: (error: string) => void;
}

export function DirectoryPickerButton({
  onPick,
  onError,
}: DirectoryPickerProps) {

  async function openDirectory() {
    try {
      const picked = await invoke<DirectoryInfo>("open_directory");
      onPick(picked);
    } catch (err) {
      const { code } = (err as DirectoryError) ?? {};
      if (code !== ERROR_CODES.DIALOG_CANCELLED) {
        onError("Failed to open directory dialog");
      }
    }
  }

  return (
    <div className="bg-grey-200">
      <button
        className="flex items-center col gap-2 text-sm cursor-pointer"
        onClick={openDirectory}
      >
          <OpenFolderIcon className="size-6" />
          <span>Open directory</span>

      </button>
    </div>
  );
}
