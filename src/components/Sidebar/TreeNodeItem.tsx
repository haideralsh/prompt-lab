import { invoke } from '@tauri-apps/api/core'
import { useSidebarContext } from './SidebarContext'
import { SelectionResult, TreeNode } from '../../types/FileTree'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FolderClosedIcon,
  FolderOpenIcon,
  MinusIcon,
} from 'lucide-react'
import {
  Button,
  Checkbox,
  Collection,
  TreeItem,
  TreeItemContent,
} from 'react-aria-components'
import React from 'react'

type TreeNodeItemProps = {
  item: TreeNode
  depth?: number
}

export function TreeNodeItem({ item, depth = 0 }: TreeNodeItemProps) {
  const {
    selectedNodes,
    setSelectedNodes,
    indeterminateNodes,
    setIndeterminateNodes,
    directory,
  } = useSidebarContext()
  const selected = selectedNodes.has(item.id)
  const indeterminate = indeterminateNodes.has(item.id)

  const onToggle = React.useCallback(async () => {
    const next = await invoke<SelectionResult>('toggle_selection', {
      path: directory?.path,
      current: Array.from(selectedNodes) as string[],
      id: item.id,
    })
    setSelectedNodes(new Set(next.selected))
    setIndeterminateNodes(new Set(next.indeterminate))
  }, [directory?.path, selectedNodes, item.id, setSelectedNodes])

  return (
    <TreeItem
      key={item.id}
      id={item.id}
      textValue={item.title}
      onPress={onToggle}
      className="cursor-pointer hover:bg-gray-800 focus:bg-gray-900 focus:outline-none"
    >
      <TreeItemContent>
        {({ hasChildItems, isExpanded }) => (
          <div
            className="flex items-center space-x-2 py-1 px-2 pl-[calc(8px+var(--depth)*16px)]"
            style={{ '--depth': depth } as React.CSSProperties}
          >
            <Checkbox
              slot="selection"
              aria-label={`Select ${item.title}`}
              isSelected={selected}
              isIndeterminate={indeterminate}
              onChange={onToggle}
              className="flex h-4 w-4 items-center justify-center rounded border border-gray-500 bg-transparent text-white data-[selected]:bg-blue-600 data-[selected]:border-blue-600 data-[indeterminate]:bg-blue-600 data-[indeterminate]:border-blue-600 focus:outline-none focus:ring-0 focus:ring-blue-500 flex-shrink-0"
            >
              {selected ? <CheckIcon className="size-3" /> : null}
              {indeterminate ? <MinusIcon className="size-3" /> : null}
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
                  isExpanded ? (
                    <FolderOpenIcon />
                  ) : (
                    <FolderClosedIcon />
                  )
                ) : (
                  <FileIcon />
                )}
              </span>
              <span className="text-sm text-white">{item.title}</span>
            </div>
          </div>
        )}
      </TreeItemContent>

      <Collection items={item.children}>
        {(child: TreeNode) => <TreeNodeItem item={child} depth={depth + 1} />}
      </Collection>
    </TreeItem>
  )
}
