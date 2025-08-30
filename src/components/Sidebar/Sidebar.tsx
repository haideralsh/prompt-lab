import { useState } from 'react'
import { Key, Tree } from 'react-aria-components'
import { SearchBar } from './SearchBar'
import { useSidebarContext } from './SidebarContext'
import { TreeNodeItem } from './TreeNodeItem'
import type { FileSystemItem, SearchMatch } from '../../types/FileTree'
import { ChevronsDownUpIcon } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

function expandAll(item: FileSystemItem, acc: Key[] = []): Key[] {
  acc.push(item.id)
  if (item.type === 'directory' && item.children) {
    for (const c of item.children) expandAll(c, acc)
  }
  return acc
}

export function Sidebar() {
  const { tree, setTree, directory } = useSidebarContext()
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(new Set())

  async function search(query: string) {
    const { results } = await invoke<SearchMatch>('search_tree', {
      path: directory?.path,
      term: query.trim(),
    })

    setTree(results)
    setExpandedKeys(
      query.trim()
        ? new Set(results.flatMap((result) => expandAll(result)))
        : new Set()
    )
  }

  function collapseAll() {
    setExpandedKeys(new Set())
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
            onClick={collapseAll}
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
              items={tree}
              expandedKeys={expandedKeys}
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
