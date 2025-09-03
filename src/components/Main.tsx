import { useEffect, useMemo, useState } from 'react'
import { useSidebarContext } from './Sidebar/SidebarContext'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import TokenChart from './TokenChart'

interface TokenCountResult {
  id: string
  tokenCount: number
  tokenPercentage: number
}

type TokenCountsEvent = {
  selectionId: string
  totalTokenCount: number
  files: TokenCountResult[]
}

export function Main() {
  const { directory, selectedFiles, setSelectedFiles } = useSidebarContext()
  const [totalTokenCount, setTotalTokenCount] = useState(0)

  async function handleCopyToClipboard() {
    await invoke('copy_files_to_clipboard', {
      root: directory?.path ?? '',
      paths: selectedFiles.map((file) => file.id),
    })
  }

  useEffect(() => {
    listen<TokenCountsEvent>('file-token-counts', (event) => {
      const { files, totalTokenCount: eventTotalTokenCount } = event.payload
      if (!files?.length) return

      setTotalTokenCount(eventTotalTokenCount)
      setSelectedFiles((prev) => {
        const map = new Map(prev.map((f) => [f.id, f]))
        for (const { id, tokenCount, tokenPercentage } of files) {
          const node = map.get(id)
          if (node) {
            map.set(id, { ...node, tokenCount, tokenPercentage })
          }
        }
        return Array.from(map.values())
      })
    })
  }, [])

  const sortedFiles = useMemo(() => {
    return selectedFiles.sort((a, b) => {
      if (a.tokenCount == null) return 1
      if (b.tokenCount == null) return -1

      return b.tokenCount - a.tokenCount
    })
  }, [selectedFiles])

  return (
    <section className="flex-1 p-4">
      <h2 className="text-sm font-semibold text-white mb-2">Selected files</h2>
      {sortedFiles.length > 0 ? (
        <div className="flex flex-col gap-4">
          <ul className="space-y-4 text-sm text-white">
            {Array.from(sortedFiles).map((path) => (
              <li key={path.id} className="flex flex-col gap-2">
                <span className="flex items-center gap-1">
                  <span className="font-semibold">{path.title}</span>
                  <span className="text-gray-400">
                    {path.tokenCount == null
                      ? 'counting...'
                      : `${path.tokenCount} tokens${
                          path.tokenPercentage == null
                            ? ''
                            : ` (${Math.round(path.tokenPercentage)}%)`
                        }`}
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
          <TokenChart files={sortedFiles} totalTokenCount={totalTokenCount} />
        </div>
      ) : (
        <div className="text-sm text-white">No files selected.</div>
      )}
    </section>
  )
}
