import { Key } from 'react-aria-components'
import { useEffect, useMemo, useState } from 'react'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import TokenChart from '../TokenChart'
import { TreeMode } from '../../types/FileTree'

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
    selectedPagesIds,
    selectedDiffIds,
  } = useSidebarContext()
  let [treeFormat] = useState(new Set<Key>(['full']))
  let [, setGitStatus] = useState<GitStatusResult>(null)

  async function handleCopyToClipboard() {
    await invoke('copy_files_to_clipboard', {
      treeMode: getTreeMode(treeFormat),
      fullTree: tree,
      root: directory?.path ?? '',
      selectedNodes: Array.from(selectedNodes),
      gitDiffPaths: Array.from(selectedDiffIds),
      urls: Array.from(selectedPagesIds),
    })
  }

  useEffect(() => {
    if (!directory?.path) {
      setGitStatus(null)
      return
    }

    invoke<GitStatusResult>('git_status', {
      root: directory.path,
    }).then((change) => {
      setGitStatus(change)
    })
  }, [directory?.path])

  useEffect(() => {
    let unlisten: UnlistenFn

    async function listenToTokenCounts() {
      unlisten = await listen<TokenCountsEvent>(
        'file-token-counts',
        (event) => {
          const { files, totalTokenCount: eventTotalTokenCount } = event.payload
          setTotalTokenCount(eventTotalTokenCount)

          if (files?.length) {
            setSelectedFiles((prev) => {
              const map = new Map(prev.map((f) => [f.path, f]))
              for (const { id, tokenCount, tokenPercentage } of files) {
                const node = map.get(id)
                if (node) {
                  map.set(id, { ...node, tokenCount, tokenPercentage })
                }
              }
              return Array.from(map.values())
            })
          }
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
