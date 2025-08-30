import { invoke } from '@tauri-apps/api/core'
import { useSidebarContext } from './SidebarContext'
import { type FileSystemItem } from '../../types/FileTree'
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import {
  Button,
  Collection,
  TreeItem,
  TreeItemContent,
} from 'react-aria-components'
import React from 'react'

type TreeNodeItemProps = {
  item: FileSystemItem
  depth?: number
}

/**
 * Renders a single node. Selection is fully controlled by our app state and
 * toggled via the Tauri backend command `toggle_selection`. We use a custom
 * checkbox button (not RAC Checkbox) to avoid slot requirements.
 */
export function TreeNodeItem({ item, depth = 0 }: TreeNodeItemProps) {
  const { selectedNodes, setSelectedNodes, directory } = useSidebarContext()
  const selected = selectedNodes.has(item.id)

  const onToggle = React.useCallback(async () => {
    if (!directory?.path) return
    const next = await invoke<string[]>('toggle_selection', {
      path: directory.path,
      current: Array.from(selectedNodes) as string[],
      id: item.id,
      mode: 'auto',
    })
    setSelectedNodes(new Set(next))
  }, [directory?.path, selectedNodes, item.id, setSelectedNodes])

  return (
    <TreeItem
      key={item.id}
      id={item.id}
      textValue={item.title}
      className="cursor-pointer hover:bg-gray-800 focus:bg-gray-900 focus:outline-none"
    >
      <TreeItemContent>
        {({ hasChildItems, isExpanded }) => (
          <div
            className="flex items-center space-x-2 py-1 px-2 pl-[calc(8px+var(--depth)*16px)]"
            style={{ '--depth': depth } as React.CSSProperties}
          >
            {/* Custom controlled checkbox (no RAC slot) */}
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-label={`Select ${item.title}`}
              onClick={onToggle}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onToggle()
                }
              }}
              className="flex h-4 w-4 items-center justify-center rounded border border-gray-500 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {selected ? <CheckIcon className="size-3" /> : null}
            </button>

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
              <span className="text-sm text-white">{item.title}</span>
            </div>
          </div>
        )}
      </TreeItemContent>

      <Collection items={item.children}>
        {(child: FileSystemItem) => (
          <TreeNodeItem item={child} depth={depth + 1} />
        )}
      </Collection>
    </TreeItem>
  )
}
