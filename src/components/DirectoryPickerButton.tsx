import { invoke } from '@tauri-apps/api/core'
import type { DirectoryInfo } from '../types/DirectoryInfo'
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
      className="bg-accent-interactive-mid hover:bg-accent-interactive-light transition-colors rounded-sm text-text-light flex items-center gap-1.5 text-sm cursor-pointer pl-2 pr-3.5 py-1 w-fit"
      onClick={pickDirectory}
    >
      <PlusIcon />
      <span>New directory</span>
    </button>
  )
}
