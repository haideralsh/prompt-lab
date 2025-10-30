import type { DirectoryInfo } from '@/types/directory-info'
import { pickDirectory } from '@/api/directory'
import { PlusIcon } from '@radix-ui/react-icons'

interface DirectoryPickerProps {
  onPick: (dir: DirectoryInfo) => void
}

export function DirectoryPickerButton({ onPick }: DirectoryPickerProps) {
  async function handlePickDirectory() {
    const picked = await pickDirectory()

    if (picked) {
      onPick(picked)
    }
  }

  return (
    <button
      className="flex w-fit cursor-pointer items-center gap-1.5 rounded-sm bg-accent-interactive-mid py-1 pr-3.5 pl-2 text-sm text-text-light transition-colors hover:bg-accent-interactive-light"
      onClick={handlePickDirectory}
    >
      <PlusIcon />
      <span>New directory</span>
    </button>
  )
}
