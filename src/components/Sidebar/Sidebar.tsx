import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Key, Tree } from 'react-aria-components'
import { SearchBar } from './SearchBar'
import { useSidebarContext } from './SidebarContext'
import { TreeNodeItem } from './TreeNodeItem'
import type {
  TreeNode,
  FileSystemItem,
  SearchMatch,
} from '../../types/FileTree'
import { ChevronsDownUpIcon } from 'lucide-react'

export function Sidebar() {
  const { setSelectedNodes, selectedNodes, tree, setTree, directory } =
    useSidebarContext()
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(new Set())

  async function search(query: string) {
    const { results } = await invoke<SearchMatch>('search_tree', {
      path: directory?.path,
      term: query.trim(),
    })

    setTree(results)

    function expand(node: TreeNode, expandedNodes: Key[] = []): Key[] {
      if (node.type === 'directory') {
        const nodeKeys = [...expandedNodes, node.id]
        return (
          node.children?.flatMap((child) => expand(child, nodeKeys)) || nodeKeys
        )
      }

      return [...expandedNodes, node.id]
    }

    setExpandedKeys(new Set(results.flatMap((result) => expand(result))))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: folder name & collapse all */}
      <div className="mb-2 flex items-center justify-between">
        {directory?.name && (
          <div className="text-sm font-semibold text-white">
            {directory.name}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            // onClick={collapseAll}
            className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-gray-700"
            title="Collapse all"
          >
            <span aria-hidden className="text-base leading-none">
              <ChevronsDownUpIcon className="size-3" />
            </span>
            <span>Collapse all</span>
          </button>
        </div>
      </div>

      <SearchBar
        onChange={(value) => {
          search(value)
        }}
        onClear={() => {
          // setQuery('')
          // setSelectedKeys(new Set())
          // setIndeterminateKeys(new Set())
          // runSearch('')
        }}
      />

      <div className="mt-3 flex-1">
        <div className="h-full overflow-y-auto rounded-lg border border-gray-200 p-1">
          <Tree
            aria-label="directory tree"
            selectionMode="multiple"
            selectionBehavior="toggle"
            items={tree}
            expandedKeys={expandedKeys}
            selectedKeys={selectedNodes}
            onSelectionChange={(keys) => {
              setSelectedNodes(new Set(keys))
            }}
            onExpandedChange={(keys) => {
              setExpandedKeys(new Set(keys))
            }}
            className="w-full"
          >
            {(item: FileSystemItem) => <TreeNodeItem item={item} />}
          </Tree>
        </div>
      </div>
    </div>
  )
}
