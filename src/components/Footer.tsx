import { useSidebarContext } from './Sidebar/SidebarContext'
import TokenChart from './TokenChart'
import { Key } from 'react-aria-components'
import { useEffect, useMemo, useState } from 'react'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { TreeMode } from '../types/FileTree'
import { invoke } from '@tauri-apps/api/core'

function getTreeMode(treeFormat: Set<Key>): TreeMode {
  if (treeFormat.has('selected')) return 'selected'
  if (treeFormat.has('full')) return 'full'
  if (treeFormat.has('none')) return 'none'
  return undefined
}

export function Footer() {
  const {
    directory,
    selectedFiles,
    setSelectedFiles,
    tree,
    selectedNodes,
    totalTokenCount,
    setTotalTokenCount,
  } = useSidebarContext()
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
    let unlisten: UnlistenFn

    async function listenToTokenCounts() {
      unlisten = await listen<TokenCountsEvent>(
        'file-token-counts',
        (event) => {
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
        },
      )
    }

    function cleanup() {
      if (unlisten) unlisten()
    }

    listenToTokenCounts()
    return cleanup
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
      <button
        onClick={handleCopyToClipboard}
        className="ml-auto text-xs font-medium bg-accent-solid-dark hover:bg-accent-solid-light active:bg-accent-solid-light flex items-center col gap-1.5 rounded-sm cursor-pointer px-2 py-1 w-fit text-nowrap text-text-light"
      >
        Copy to Clipboard
      </button>
    </div>
  )
}
