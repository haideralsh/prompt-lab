import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Key, Selection, Tree } from 'react-aria-components'
import { SearchBar } from './SearchBar'
import { useSidebarContext } from './SidebarContext'
import { TreeNodeItem } from './TreeNodeItem'
import type {
  TreeNode,
  FileSystemItem,
  SearchMatch,
} from '../../types/FileTree'
import { ChevronsDownUpIcon } from 'lucide-react'

function expand(node: TreeNode, expandedNodes: Key[] = []): Key[] {
  if (node.type === 'directory') {
    const nodeKeys = [...expandedNodes, node.id]
    return (
      node.children?.flatMap((child) => expand(child, nodeKeys)) || nodeKeys
    )
  }

  return [...expandedNodes, node.id]
}

function getAllChildrenIds(node: TreeNode): Key[] {
  const ids: Key[] = [node.id]
  if (node.type === 'directory' && node.children) {
    node.children.forEach((child) => {
      ids.push(...getAllChildrenIds(child))
    })
  }
  return ids
}

function findNodeById(nodes: TreeNode[], id: Key): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    if (node.type === 'directory' && node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export function Sidebar() {
  const { setSelectedNodes, selectedNodes, tree, setTree, directory } =
    useSidebarContext()
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(new Set())

  function handleSelectionChange(selection: Selection) {
    const newKeys = new Set(selection)
    const previousKeys = selectedNodes

    const newlySelected = Array.from(selection).filter(
      (key) => !previousKeys.has(key),
    )

    newlySelected.forEach((key) => {
      const node = findNodeById(tree, key)
      if (node && node.type === 'directory') {
        const childrenIds = getAllChildrenIds(node)
        childrenIds.forEach((id) => newKeys.add(id))
      }
    })

    setSelectedNodes(newKeys)
  }

  async function search(query: string) {
    const { results } = await invoke<SearchMatch>('search_tree', {
      path: directory?.path,
      term: query.trim(),
    })

    setTree(results)
    setExpandedKeys(
      query.trim()
        ? new Set(results.flatMap((result) => expand(result)))
        : new Set(),
    )
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
        onChange={(value) => search(value)}
        onClear={() => search('')}
      />

      <div className="mt-3 flex-1">
        <div className="h-full overflow-y-auto rounded-lg border border-gray-200 p-1">
          {tree.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No results found
            </div>
          ) : (
            <Tree
              aria-label="directory tree"
              selectionMode="multiple"
              selectionBehavior="toggle"
              items={tree}
              expandedKeys={expandedKeys}
              selectedKeys={selectedNodes}
              onSelectionChange={handleSelectionChange}
              onExpandedChange={(keys) => setExpandedKeys(new Set(keys))}
              className="w-full"
            >
              {(item: FileSystemItem) => <TreeNodeItem item={item} />}
            </Tree>
          )}
        </div>
      </div>
    </div>
  )
}
