import { invoke } from '@tauri-apps/api/core'
import type { DirectoryInfo } from '../types/directory-info'
import { PlusIcon } from '@radix-ui/react-icons'

interface DirectoryPickerProps {
  onPick: (dir: DirectoryInfo) => void
}

export function DirectoryPickerButton({ onPick }: DirectoryPickerProps) {
  async function pickDirectory() {
    const picked = await invoke<DirectoryInfo | null>('pick_directory')

    if (picked) {
      onPick(picked)
    }
  }

  return (
    <button
      className="flex w-fit cursor-pointer items-center gap-1.5 rounded-sm bg-accent-interactive-mid py-1 pr-3.5 pl-2 text-sm text-text-light transition-colors hover:bg-accent-interactive-light"
      onClick={pickDirectory}
    >
      <PlusIcon />
      <span>New directory</span>
    </button>
  )
}
