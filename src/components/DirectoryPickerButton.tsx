import { invoke } from '@tauri-apps/api/core'
import { ERROR_CODES } from '../constants'
import type { DirectoryInfo } from '../types/DirectoryInfo'
import { DirectoryError } from '../types/FileTree'
import { queue } from './ToastQueue'
import { PlusIcon } from 'lucide-react'

interface DirectoryPickerProps {
  onPick: (dir: DirectoryInfo) => void
}

export function DirectoryPickerButton({ onPick }: DirectoryPickerProps) {
  async function openDirectory() {
    try {
      const picked = await invoke<DirectoryInfo>('open_directory')
      onPick(picked)
    } catch (err) {
      const { code } = (err as DirectoryError) ?? {}
      if (code !== ERROR_CODES.DIALOG_CANCELLED) {
        queue.add({
          title: 'Failed to open directory dialog',
        })
      }
    }
  }

  return (
    <div className="bg-interactive-dark text-text-light">
      <button
        className="flex items-center col gap-1.5 text-sm cursor-pointer px-2 py-1"
        onClick={openDirectory}
      >
        <PlusIcon className="size-4" />
        <span>New directory</span>
      </button>
    </div>
  )
}
