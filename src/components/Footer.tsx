import { useSidebarContext } from './Sidebar/SidebarContext'
import TokenChart from './TokenChart'
import { Key } from 'react-aria-components'
import { useEffect, useMemo, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { TreeMode } from '../types/FileTree'
import { invoke } from '@tauri-apps/api/core'

function getTreeMode(treeFormat: Set<Key>): TreeMode {
  if (treeFormat.has('selected')) return 'selected'
  if (treeFormat.has('full')) return 'full'
  if (treeFormat.has('none')) return 'none'
  return undefined
}

export function Footer() {
  const { directory, selectedFiles, setSelectedFiles, tree, selectedNodes } =
    useSidebarContext()
  const [totalTokenCount, setTotalTokenCount] = useState(0)
  let [treeFormat] = useState(new Set<Key>(['full']))
  let [gitDiff] = useState(false)
  let [, setGitStatus] = useState<GitStatusResult>(null)

  async function handleCopyToClipboard() {
    await invoke('copy_files_to_clipboard', {
      treeMode: getTreeMode(treeFormat),
      fullTree: tree,
      root: directory?.path ?? '',
      selectedNodes: Array.from(selectedNodes).map(String),
      addGitDiff: gitDiff,
    })
  }

  useEffect(() => {
    function inquireGitStatus() {
      invoke<GitStatusResult>('git_status', {
        root: directory?.path,
      }).then((change) => {
        setGitStatus(change)
      })
    }

    inquireGitStatus()
  }, [directory?.path])

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

  // TODO: this is duplicated from Main.tsx - refactor into a hook
  const sortedFiles = useMemo(() => {
    return selectedFiles.sort((a, b) => {
      if (a.tokenCount == null) return 1
      if (b.tokenCount == null) return -1

      return b.tokenCount - a.tokenCount
    })
  }, [selectedFiles])

  return (
    <div className="flex gap-8 justify-between items-center">
      {sortedFiles.length > 0 && (
        <TokenChart files={sortedFiles} totalTokenCount={totalTokenCount} />
      )}
      {/* <div className="flex gap-8 flex-grow-0">
        <ToggleButton
          isDisabled={!gitStatus}
          isSelected={gitDiff}
          onChange={setGitDiff}
        >
          Git diff
          {gitStatus && (
            <div className="ml-2 text-xs text-gray-400">
              {gitStatus.length} changes
            </div>
          )}
        </ToggleButton>
        <ToggleButtonGroup
          className="flex flex-grow"
          selectionMode="single"
          selectedKeys={treeFormat}
          onSelectionChange={setTreeFormat}
        >
          <RACToggleButton
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
          </RACToggleButton>
          <RACToggleButton
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
          </RACToggleButton>
          <RACToggleButton
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
          </RACToggleButton>
        </ToggleButtonGroup>
        <button
          onClick={handleCopyToClipboard}
          type="button"
          className="flex-grow rounded-sm bg-gray-600 px-2 py-1 text-xs font-semibold text-white shadow-xs hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 dark:bg-gray-500 dark:shadow-none dark:hover:bg-gray-400 dark:focus-visible:outline-gray-500"
        >
          Copy to Clipboard
        </button>
      </div> */}
      <button
        onClick={handleCopyToClipboard}
        className="ml-auto text-xs font-medium bg-accent-solid-dark hover:bg-accent-solid-light active:bg-accent-solid-light flex items-center col gap-1.5 rounded-sm cursor-pointer px-2 py-1 w-fit text-nowrap text-text-light"
      >
        Copy to Clipboard
      </button>
    </div>
  )
}
