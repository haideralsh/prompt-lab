import { useEffect } from 'react'
import { useSidebarContext } from './Sidebar/SidebarContext'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

type TokenCountsEvent = {
  files: { id: string; tokenCount: number }[]
}

export function Main() {
  const { selectedFiles, setSelectedFiles } = useSidebarContext()

  async function handleCopyToClipboard() {
    await invoke<any>('copy_files_to_clipboard', {
      paths: selectedFiles.map((file) => file.id),
    })
  }

  useEffect(() => {
    listen<TokenCountsEvent>('file-token-counts', (event) => {
      const { files } = event.payload
      if (!files?.length) return

      setSelectedFiles((prev) => {
        const map = new Map(prev.map((f) => [f.id, f]))
        for (const { id, tokenCount } of files) {
          const node = map.get(id)
          if (node) {
            map.set(id, { ...node, tokenCount })
          }
        }
        return Array.from(map.values())
      })
    })
  }, [])

  return (
    <section className="flex-1 p-4">
      <h2 className="text-sm font-semibold text-white mb-2">Selected files</h2>
      {selectedFiles.length > 0 ? (
        <div className="flex flex-col gap-4">
          <ul className="space-y-4 text-sm text-white">
            {Array.from(selectedFiles).map((path) => (
              <li key={path.id} className="flex flex-col gap-2">
                <span className="flex items-center gap-1">
                  <span className="font-semibold">{path.title}</span>
                  <span className="text-gray-400">
                    {path.tokenCount !== null && `(${path.tokenCount} tokens)`}
                  </span>
                </span>
                <span className="text-xs">{path.id}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={handleCopyToClipboard}
            type="button"
            className="rounded-sm bg-gray-600 px-2 py-1 text-xs font-semibold text-white shadow-xs hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 dark:bg-gray-500 dark:shadow-none dark:hover:bg-gray-400 dark:focus-visible:outline-gray-500"
          >
            Copy to Clipboard
          </button>
        </div>
      ) : (
        <div className="text-sm text-white">No files selected.</div>
      )}
    </section>
  )
}
