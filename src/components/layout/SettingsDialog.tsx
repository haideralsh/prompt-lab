import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from '@/components/common/Dialog'

export function SettingsDialog() {
  const [editorPath, setEditorPath] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function loadPath() {
      const path = await loadEditorPath()

      if (path) {
        setEditorPath(path)
      }
    }

    if (isOpen) loadPath()
  }, [isOpen])

  async function loadEditorPath() {
    try {
      const path = await invoke<string | null>('get_editor')
      return path
    } catch (error) {
      console.error('Failed to get editor:', error)
      return null
    }
  }

  async function handlePickEditor() {
    try {
      const pickedPath = await invoke<string>('pick_editor')
      const [, storePath] = await Promise.all([
        invoke('set_editor', { editorPath: pickedPath }),
        loadEditorPath(),
      ])

      setEditorPath(storePath)
    } catch (error) {
      console.error('Failed to pick editor:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="text-text-dark hover:text-text-light">
        <MixerHorizontalIcon />
      </DialogTrigger>
      <DialogContent title="Settings">
        <div className="space-y-1">
          <h3 className="text-xs text-text-dark">Prompt Lab</h3>
          <p className="text-xs text-text-light">Version 0.0.1</p>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs text-text-dark">
            Path to editor for opening files. When not set the system default
            will be used.
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-light break-all">
              {editorPath ? editorPath : 'No editor set'}
            </p>
            <button
              className="bg-accent-interactive-dark rounded-sm text-text-light flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 w-fit"
              onClick={handlePickEditor}
            >
              Choose editor
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
