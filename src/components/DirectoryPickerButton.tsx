import { invoke } from '@tauri-apps/api/core'
import { ERROR_CODES } from '../constants'
import type { DirectoryInfo } from '../types/DirectoryInfo'
import { queue } from './ToastQueue'
import { PlusIcon } from '@radix-ui/react-icons'
import { ApplicationError } from '../helpers/getErrorMessage'

interface DirectoryPickerProps {
  onPick: (dir: DirectoryInfo) => void
}

export function DirectoryPickerButton({ onPick }: DirectoryPickerProps) {
  async function pickDirectory() {
    try {
      const picked = await invoke<DirectoryInfo>('pick_directory')
      onPick(picked)
    } catch (err) {
      const { code } = (err as ApplicationError) ?? {}
      if (code !== ERROR_CODES.DIALOG_CANCELLED) {
        queue.add({
          title: 'Failed to pick directory',
        })
      }
    }
  }

  return (
    <button
      className="bg-accent-interactive-dark rounded-sm text-text-light flex items-center gap-1.5 text-sm cursor-pointer pl-2 pr-3.5 py-1 w-fit"
      onClick={pickDirectory}
    >
      <PlusIcon className="text-text-light" />
      <span className="text-text-light">New directory</span>
    </button>
  )
}
