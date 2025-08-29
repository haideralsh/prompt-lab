import { useState } from 'react'
import {
  TreeNode,
  type FileSystemItem,
  type SearchMatch,
} from '../../types/FileTree'
import { invoke } from '@tauri-apps/api/core'
import {
  Button,
  Checkbox,
  Collection,
  Key,
  Tree,
  TreeItem,
  TreeItemContent,
} from 'react-aria-components'

import { SearchBar } from './SearchBar'
import { useSidebarContext } from './SidebarContext'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'

export function Sidebar() {
  const { setSelectedNodes, selectedNodes, tree, setTree, root } =
    useSidebarContext()
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(new Set())

  async function search(query: string) {
    const { results } = await invoke<SearchMatch>('search_tree', {
      path: root?.path,
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
        {/* TODO: pass the dir info to the context to make this work */}
        {/*{root.name && (
          <div className="text-sm font-semibold text-gray-900">{root.name}</div>
        )}*/}
        <div className="flex items-center gap-2">
          <button
            // onClick={collapseAll}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            title="Collapse all"
          >
            <span aria-hidden className="text-base leading-none">
              ×
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

      {/* File Tree container */}
      <div className="mt-3 flex-1">
        <div className="h-full overflow-y-auto rounded-lg border border-gray-200 p-1">
          <Tree
            aria-label="directory tree"
            selectionMode="multiple"
            items={tree}
            expandedKeys={expandedKeys}
            selectedKeys={selectedNodes}
            className="w-full"
          >
            {renderItem}
          </Tree>
        </div>
      </div>
    </div>
  )
}

function renderItem(item: FileSystemItem, depth: number = 0) {
  return (
    <TreeItem
      key={item.id}
      id={item.id}
      textValue={item.title}
      className="cursor-pointer hover:bg-gray-50 focus:bg-blue-50 focus:outline-none"
    >
      <TreeItemContent>
        {({ hasChildItems, isExpanded, isSelected }) => (
          <div
            className="flex items-center space-x-2 py-1 px-2"
            style={{ paddingLeft: `${8 + depth * 16}px` }}
          >
            <Checkbox
              slot="selection"
              aria-label="Select item"
              className="flex-shrink-0"
              isSelected={isSelected}
            >
              {isSelected ? <CheckIcon className="size-4" /> : null}
            </Checkbox>

            {hasChildItems ? (
              <Button
                slot="chevron"
                className="shrink-0 w-4 h-4 flex items-center justify-center bg-transparent border-0 cursor-pointer focus:outline-none"
              >
                <span className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDownIcon className="size-4" />
                  ) : (
                    <ChevronRightIcon className="size-4" />
                  )}
                </span>
              </Button>
            ) : (
              <div className="shrink-0 w-4 h-4" />
            )}
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 text-sm">
                {item.type === 'directory' ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-gray-900">{item.title}</span>
            </div>
          </div>
        )}
      </TreeItemContent>
      <Collection items={item.children}>
        {(childItem: FileSystemItem) => renderItem(childItem, depth + 1)}
      </Collection>
    </TreeItem>
  )
}
