import React, { useEffect, useMemo, useState } from 'react'
import { useSidebarContext } from './Sidebar/SidebarContext'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import TokenChart from './TokenChart'
import { Key, ToggleButton, ToggleButtonGroup } from 'react-aria-components'

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

function getTreeMode(treeFormat: Set<Key>): 'selected' | 'full' | undefined {
  if (treeFormat.has('selected')) return 'selected'
  if (treeFormat.has('full')) return 'full'
  return undefined
}

export function Main() {
  const { directory, selectedFiles, setSelectedFiles, tree, selectedNodes } =
    useSidebarContext()
  const [totalTokenCount, setTotalTokenCount] = useState(0)
  let [treeFormat, setTreeFormat] = React.useState(new Set<Key>(['full']))

  async function handleCopyToClipboard() {
    await invoke('copy_files_to_clipboard', {
      tree_mode: getTreeMode(treeFormat),
      full_tree: tree,
      root: directory?.path!,
      selected_nodes: Array.from(selectedNodes),
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
                            : ` (${Math.ceil(path.tokenPercentage)}%)`
                        }`}
                  </span>
                </span>
                <span className="text-xs">{path.id}</span>
              </li>
            ))}
          </ul>
          <TokenChart files={sortedFiles} totalTokenCount={totalTokenCount} />
          <div className="flex gap-8">
            <ToggleButtonGroup
              className="flex flex-grow"
              selectionMode="single"
              selectedKeys={treeFormat}
              onSelectionChange={setTreeFormat}
            >
              <ToggleButton
                id="none"
                className="
                flex-grow
                        z-10
                        -ml-0
                        rounded-none
                        first:rounded-l-md
                        first:ml-0
                        last:rounded-r-md
                        border
                        border-gray-300
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-gray-700
                        bg-white
                        hover:bg-gray-50
                        focus:z-20
                        focus:outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                        data-[selected]:z-20
                        data-[selected]:bg-blue-500
                        data-[selected]:text-white
                        data-[selected]:border-blue-500
                        data-[disabled]:z-0
                        data-[disabled]:opacity-50
                        data-[disabled]:cursor-not-allowed
                        -ml-px
                      "
              >
                None
              </ToggleButton>
              <ToggleButton
                id="selected"
                className="
                flex-grow
                        z-10
                        rounded-none
                        first:rounded-l-md
                        first:ml-0
                        last:rounded-r-md
                        border
                        border-gray-300
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-gray-700
                        bg-white
                        hover:bg-gray-50
                        focus:z-20
                        focus:outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                        data-[selected]:z-20
                        data-[selected]:bg-blue-500
                        data-[selected]:text-white
                        data-[selected]:border-blue-500
                        data-[disabled]:z-0
                        data-[disabled]:opacity-50
                        data-[disabled]:cursor-not-allowed
                        -ml-px
                      "
              >
                Selected
              </ToggleButton>
              <ToggleButton
                id="full"
                className="
                flex-grow
                        z-10
                        rounded-none
                        first:rounded-l-md
                        first:ml-0
                        last:rounded-r-md
                        border
                        border-gray-300
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-gray-700
                        bg-white
                        hover:bg-gray-50
                        focus:z-20
                        focus:outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                        data-[selected]:z-20
                        data-[selected]:bg-blue-500
                        data-[selected]:text-white
                        data-[selected]:border-blue-500
                        data-[disabled]:z-0
                        data-[disabled]:opacity-50
                        data-[disabled]:cursor-not-allowed
                        -ml-px
                      "
              >
                Full
              </ToggleButton>
            </ToggleButtonGroup>
            <button
              onClick={handleCopyToClipboard}
              type="button"
              className="flex-grow rounded-sm bg-gray-600 px-2 py-1 text-xs font-semibold text-white shadow-xs hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 dark:bg-gray-500 dark:shadow-none dark:hover:bg-gray-400 dark:focus-visible:outline-gray-500"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-white">No files selected.</div>
      )}
    </section>
  )
}
