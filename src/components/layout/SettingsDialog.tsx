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
      <DialogContent
        title="Settings"
        description="Configure how the content is displayed and processed."
      >
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Editor</h3>
          <button
            onClick={handlePickEditor}
            className="px-3 py-1.5 text-sm bg-background-light hover:bg-background text-text-light rounded"
          >
            {editorPath ? 'Change Editor' : 'Pick Editor'}
          </button>
          {editorPath && (
            <p className="text-xs text-text-dark mt-2 break-all">
              {editorPath}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
