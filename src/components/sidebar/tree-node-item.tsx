import { TreeNode } from '@/types/file-tree'
import { toggleSelection } from '@/api/selection'
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
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  directoryAtom,
  indeterminateNodesAtom,
  selectedFilesAtom,
  selectedNodesAtom,
  treeAtom,
  treeDisplayModeAtom,
} from '../../state/atoms'

type TreeNodeItemProps = {
  item: TreeNode
  depth?: number
}

type TreeNodeItemState = {
  toggleKey: (key: string) => void
}

export function TreeNodeItem({ item, depth = 0 }: TreeNodeItemProps) {
  const [selectedNodes, setSelectedNodes] = useAtom(selectedNodesAtom)
  const setSelectedFiles = useSetAtom(selectedFilesAtom)
  const [indeterminateNodes, setIndeterminateNodes] = useAtom(
    indeterminateNodesAtom,
  )
  const directory = useAtomValue(directoryAtom)
  const treeDisplayMode = useAtomValue(treeDisplayModeAtom)
  const tree = useAtomValue(treeAtom)

  const selected = selectedNodes.has(item.id)
  const indeterminate = indeterminateNodes.has(item.id)
  const treeStateRef = React.useRef<TreeNodeItemState | null>(null)

  async function onToggle() {
    const selection = await toggleSelection({
      directoryPath: directory.path,
      current: Array.from(selectedNodes) as string[],
      nodePath: item.id,
      treeDisplayMode,
      fullTree: tree,
    })

    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  function handleItemPress(item: TreeNode) {
    switch (item.type) {
      case 'file':
        void onToggle()
        break
      case 'directory':
        treeStateRef.current?.toggleKey(item.id)
        break
    }
  }

  return (
    <TreeItem
      key={item.id}
      id={item.id}
      textValue={item.title}
      onPress={() => handleItemPress(item)}
      className="group cursor-default rounded-sm select-none hover:bg-accent-interactive-dark focus:bg-accent-interactive-dark focus:outline-1 focus:outline-offset-[-1px] focus:outline-accent-border-dark"
    >
      <TreeItemContent>
        {({ hasChildItems, isExpanded, state }) => {
          treeStateRef.current = state as TreeNodeItemState

          return (
            <div
              className="flex items-center space-x-1 px-2 py-0.5 pl-[calc(8px+var(--depth)*16px)]"
              style={{ '--depth': depth } as React.CSSProperties}
            >
              <Checkbox
                slot="selection"
                aria-label={`Select ${item.title}`}
                isSelected={selected}
                isIndeterminate={indeterminate}
                onChange={onToggle}
                className="relative flex size-[15px] flex-shrink-0 items-center justify-center rounded-sm border border-border-light bg-transparent text-accent-text-light data-[indeterminate]:border-accent-border-mid data-[indeterminate]:bg-accent-interactive-light data-[selected]:border-accent-border-mid data-[selected]:bg-accent-interactive-light"
              >
                {selected && <CheckIcon />}
                {indeterminate && <MinusIcon />}
              </Checkbox>

              {hasChildItems ? (
                <Button
                  slot="chevron"
                  className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent focus:outline-none"
                >
                  <span className="text-text-dark">
                    {isExpanded ? <TriangleDownIcon /> : <TriangleRightIcon />}
                  </span>
                </Button>
              ) : (
                <div className="size-4 shrink-0" />
              )}

              <div className="flex items-center space-x-1 text-nowrap">
                <span className="text-sm text-text-dark">
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
          )
        }}
      </TreeItemContent>

      <Collection items={item.children}>
        {(child: TreeNode) => <TreeNodeItem item={child} depth={depth + 1} />}
      </Collection>
    </TreeItem>
  )
}
