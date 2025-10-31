import { useRef, useState } from 'react'
import { Button, Key, Tree } from 'react-aria-components'
import { SearchBar } from './search-bar'
import { TreeNodeItem } from './tree-node-item'
import type { TreeNode } from '@/types/file-tree'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { searchTree } from '@/api/directory'
import {
  directoryAtom,
  filteredTreeAtom,
  indeterminateNodesAtom,
  resetStateAtom,
  selectedFilesAtom,
  selectedNodesAtom,
  treeAtom,
  treeDisplayModeAtom,
} from '@/state/atoms'
import { ExitIcon } from '@radix-ui/react-icons'
import { resetWindowTitle } from '../../helpers/update-window-title'
import { clearSelection } from '@/api/selection'
import { SettingsDialog } from '@/components/sidebar/settings-dialog'

function expandAll(item: TreeNode, acc: Key[] = []): Key[] {
  acc.push(item.id)
  if (item.type === 'directory' && item.children) {
    for (const c of item.children) expandAll(c, acc)
  }
  return acc
}

export function Sidebar() {
  const [filteredTree, setFilteredTree] = useAtom(filteredTreeAtom)
  const directory = useAtomValue(directoryAtom)
  const tree = useAtomValue(treeAtom)
  const setSelectedFiles = useSetAtom(selectedFilesAtom)
  const setSelectedNodes = useSetAtom(selectedNodesAtom)
  const setIndeterminateNodes = useSetAtom(indeterminateNodesAtom)
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(new Set())
  const treeRef = useRef<HTMLDivElement>(null)
  const treeDisplayMode = useAtomValue(treeDisplayModeAtom)
  const resetState = useSetAtom(resetStateAtom)

  async function search(term: string) {
    const { results } = await searchTree({
      path: directory.path,
      term: term.trim(),
    })

    setFilteredTree(results)
    setExpandedKeys(
      term.trim()
        ? new Set(results.flatMap((result) => expandAll(result)))
        : new Set(),
    )
  }

  function collapseAll() {
    setExpandedKeys(new Set())
  }

  async function deselectAll() {
    const selection = await clearSelection({
      directoryPath: directory.path,
      treeDisplayMode: treeDisplayMode,
      fullTree: tree,
    })

    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  async function exitDirectory() {
    resetState()
    await resetWindowTitle()
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between p-3">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium tracking-wide text-text-dark">
              {directory?.name}
            </span>
            <Button onPress={exitDirectory}>
              <ExitIcon className="text-text-dark/75 group-data-[disabled]:text-text-dark/50 hover:text-text-dark group-data-[disabled]:hover:text-text-dark/50" />
            </Button>
          </div>
          <SettingsDialog />
        </div>

        <div className="flex items-center justify-end gap-0.5 px-1">
          <button
            onClick={deselectAll}
            className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs text-text-dark transition-colors duration-150 outline-none hover:bg-interactive-dark hover:text-text-light focus:ring-1 focus:ring-accent-border-light focus:ring-inset"
            title="Deselect all"
          >
            <span>Deselect all</span>
          </button>
          <button
            onClick={collapseAll}
            className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-text-dark transition-colors duration-150 outline-none hover:bg-interactive-dark hover:text-text-light focus:ring-1 focus:ring-accent-border-light focus:ring-inset"
            title="Collapse all"
          >
            <span>Collapse all</span>
          </button>
        </div>
      </div>
      <SearchBar
        onChange={(value) => search(value)}
        onClear={() => search('')}
        onNavigateOut={() => treeRef.current?.focus()}
      />
      <div className="flex-1 px-2">
        <div className="h-full overflow-x-hidden">
          {filteredTree.length === 0 ? (
            <div className="flex h-full px-2 py-1 text-xs text-text-dark">
              No results found
            </div>
          ) : (
            <Tree
              ref={treeRef}
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
