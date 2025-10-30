import { useState, useEffect } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { getEditor, pickEditor, setEditor } from '@/api/settings'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/common/dialog'

export function SettingsDialog() {
  const [editorPath, setEditorPath] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [version, setVersion] = useState<string>('...')

  useEffect(() => {
    async function loadPath() {
      const path = await loadEditorPath()

      if (path) {
        setEditorPath(path)
      }
    }

    if (isOpen) loadPath()
  }, [isOpen])

  useEffect(() => {
    async function loadVersion() {
      const appVersion = await getVersion()
      setVersion(appVersion)
    }

    loadVersion()
  }, [])

  async function loadEditorPath() {
    try {
      const path = await getEditor()
      return path
    } catch (error) {
      console.error('Failed to get editor:', error)
      return null
    }
  }

  async function handlePickEditor() {
    try {
      const pickedPath = await pickEditor()
      const [, storePath] = await Promise.all([
        setEditor({ editorPath: pickedPath }),
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
          <p className="text-xs text-text-light">Version {version}</p>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs text-text-dark">
            Path to editor for opening files. When not set the system default
            will be used.
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-xs break-all text-text-light">
              {editorPath ? editorPath : 'No editor set'}
            </p>
            <button
              className="flex w-fit cursor-pointer items-center gap-1.5 rounded-sm bg-accent-interactive-dark px-2 py-1 text-xs text-text-light"
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
