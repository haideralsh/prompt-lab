import { useEffect, useMemo } from 'react'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import TokenChart from '../TokenChart'
import { sortFilesByTokenCount } from '../../helpers/sortFilesByTokenCount'

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
    selectedInstructionIds,
    unsavedInstruction,
    treeMode,
  } = useSidebarContext()

  async function handleCopyToClipboard() {
    await invoke('copy_all_to_clipboard', {
      treeMode,
      fullTree: tree,
      root: directory?.path ?? '',
      selectedNodes: Array.from(selectedNodes),
      gitDiffPaths: Array.from(selectedDiffIds),
      urls: Array.from(selectedPagesIds),
      instructionIds: Array.from(selectedInstructionIds),
      instructions: unsavedInstruction
        ? [
            {
              name: unsavedInstruction.name,
              content: unsavedInstruction.content,
            },
          ]
        : [],
    })
  }

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
        }
      )
    }

    function cleanup() {
      if (unlisten) unlisten()
    }

    listenToTokenCounts()
    return cleanup
  }, [])

  const sortedFiles = useMemo(() => {
    return sortFilesByTokenCount(selectedFiles)
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
