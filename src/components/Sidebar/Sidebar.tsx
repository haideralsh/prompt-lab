import { useState } from 'react'
import { Button, Key, Tree } from 'react-aria-components'
import { SearchBar } from './SearchBar'
import { TreeNodeItem } from './TreeNodeItem'
import type {
  TreeNode,
  SearchResult,
  SelectionResult,
} from '../../types/FileTree'
import { invoke } from '@tauri-apps/api/core'
import { useAtom, useSetAtom } from 'jotai'
import {
  directoryAtom,
  filteredTreeAtom,
  indeterminateNodesAtom,
  selectedFilesAtom,
  selectedNodesAtom,
} from '../../state/atoms'
import { ExitIcon } from '@radix-ui/react-icons'

function expandAll(item: TreeNode, acc: Key[] = []): Key[] {
  acc.push(item.id)
  if (item.type === 'directory' && item.children) {
    for (const c of item.children) expandAll(c, acc)
  }
  return acc
}

export function Sidebar() {
  const [filteredTree, setFilteredTree] = useAtom(filteredTreeAtom)
  const [directory, setDirectory] = useAtom(directoryAtom)
  const setSelectedFiles = useSetAtom(selectedFilesAtom)
  const setSelectedNodes = useSetAtom(selectedNodesAtom)
  const setIndeterminateNodes = useSetAtom(indeterminateNodesAtom)
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(new Set())

  async function search(query: string) {
    const { results } = await invoke<SearchResult>('search_tree', {
      path: directory?.path,
      term: query.trim(),
    })

    setFilteredTree(results)
    setExpandedKeys(
      query.trim()
        ? new Set(results.flatMap((result) => expandAll(result)))
        : new Set()
    )
  }

  function collapseAll() {
    setExpandedKeys(new Set())
  }

  async function clearSelection() {
    const selection = await invoke<SelectionResult>('clear_selection', {
      directoryPath: directory?.path,
    })

    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  function exitDirectory() {
    setDirectory(null)
    setFilteredTree([])
    setSelectedNodes(new Set<Key>())
    setSelectedFiles([])
    setIndeterminateNodes(new Set<Key>())
    setExpandedKeys(new Set())
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center p-2 gap-1">
          <span className="font-medium tracking-wide text-xs text-text-dark">
            {directory?.name}
          </span>
          <Button onPress={exitDirectory}>
            <ExitIcon className="text-text-dark/75 hover:text-text-dark group-data-[disabled]:hover:text-text-dark/50 group-data-[disabled]:text-text-dark/50" />
          </Button>
        </div>
        <div className="flex items-center gap-0.5 justify-end px-1">
          <button
            onClick={clearSelection}
            className="inline-flex items-center gap-1 text-xs py-0.5 px-2 text-text-dark hover:bg-interactive-dark rounded-sm hover:text-text-light transition-colors duration-150 outline-none focus:ring-inset focus:ring-1 focus:ring-accent-border-light"
            title="Deselect all"
          >
            <span>Deselect all</span>
          </button>
          <button
            onClick={collapseAll}
            className="inline-flex items-center gap-1 text-xs py-0.5 px-1.5 text-text-dark hover:bg-interactive-dark rounded-sm hover:text-text-light transition-colors duration-150 outline-none focus:ring-inset focus:ring-1 focus:ring-accent-border-light"
            title="Collapse all"
          >
            <span>Collapse all</span>
          </button>
        </div>
      </div>
      <SearchBar
        onChange={(value) => search(value)}
        onClear={() => search('')}
      />
      <div className="flex-1 px-2">
        <div className="h-full overflow-x-hidden rounded-lg">
          {filteredTree.length === 0 ? (
            <div className="flex h-full py-1 px-2 text-xs text-text-dark">
              No results found
            </div>
          ) : (
            <Tree
              aria-label="directory tree"
              selectionMode="multiple"
              items={filteredTree}
              expandedKeys={expandedKeys}
              onExpandedChange={(keys) => setExpandedKeys(new Set(keys))}
              className="w-full"
            >
              {(item: TreeNode) => <TreeNodeItem item={item} />}
            </Tree>
          )}
        </div>
      </div>
    </div>
  )
}
