import { invoke } from '@tauri-apps/api/core'
import { useSidebarContext } from './SidebarContext'
import { SelectionResult, TreeNode } from '../../types/FileTree'
import {
  FileIcon,
  CheckIcon,
  MinusIcon,
  TriangleDownIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons'
import {
  Button,
  Checkbox,
  Collection,
  TreeItem,
  TreeItemContent,
} from 'react-aria-components'
import React from 'react'
import { FolderOpenIcon } from '@heroicons/react/16/solid'
import { FolderIcon } from '@heroicons/react/16/solid'

type TreeNodeItemProps = {
  item: TreeNode
  depth?: number
}

export function TreeNodeItem({ item, depth = 0 }: TreeNodeItemProps) {
  const {
    selectedNodes,
    setSelectedNodes,
    setSelectedFiles,
    indeterminateNodes,
    setIndeterminateNodes,
    directory,
  } = useSidebarContext()
  const selected = selectedNodes.has(item.id)
  const indeterminate = indeterminateNodes.has(item.id)

  async function onToggle() {
    const selection = await invoke<SelectionResult>('toggle_selection', {
      directoryPath: directory?.path,
      current: Array.from(selectedNodes) as string[],
      nodePath: item.id,
    })
    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  return (
    <TreeItem
      key={item.id}
      id={item.id}
      textValue={item.title}
      onPress={onToggle}
      className="cursor-default rounded-sm group hover:bg-accent-interactive-dark focus:bg-accent-interactive-dark focus:outline-accent-border-dark focus:outline-1 focus:outline-offset-[-1px] select-none"
    >
      <TreeItemContent>
        {({ hasChildItems, isExpanded }) => (
          <div
            className="flex items-center space-x-1 py-0.5 px-2 pl-[calc(8px+var(--depth)*16px)]"
            style={{ '--depth': depth } as React.CSSProperties}
          >
            <Checkbox
              slot="selection"
              aria-label={`Select ${item.title}`}
              isSelected={selected}
              isIndeterminate={indeterminate}
              onChange={onToggle}
              className="flex items-center justify-center size-[15px] rounded-sm  text-accent-text-light
              border border-border-light  data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid
              bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light
              flex-shrink-0"
            >
              {selected && <CheckIcon />}
              {indeterminate && <MinusIcon />}
            </Checkbox>

            {hasChildItems ? (
              <Button
                slot="chevron"
                className="shrink-0 w-4 h-4 flex items-center justify-center bg-transparent border-0 cursor-pointer focus:outline-none"
              >
                <span className="text-text-dark">
                  {isExpanded ? <TriangleDownIcon /> : <TriangleRightIcon />}
                </span>
              </Button>
            ) : (
              <div className="shrink-0 size-4" />
            )}

            <div className="flex items-center space-x-1 text-nowrap">
              <span className="text-text-dark  text-sm">
                {item.type === 'directory' ? (
                  isExpanded ? (
                    <FolderOpenIcon className="size-[15px]" />
                  ) : (
                    <FolderIcon className="size-[15px]" />
                  )
                ) : (
                  <FileIcon />
                )}
              </span>
              <span className="text-sm text-text-dark">{item.title}</span>
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
