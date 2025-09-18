import { useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Button,
  Checkbox,
  Disclosure,
  DisclosurePanel,
  Heading,
} from 'react-aria-components'
import {
  CheckIcon,
  TriangleDownIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import { Id, SelectionResult } from '../../types/FileTree'

export function SelectedFilesPanel() {
  const {
    selectedFiles,
    directory,
    selectedNodes,
    setSelectedFiles,
    setSelectedNodes,
    setIndeterminateNodes,
  } = useSidebarContext()

  const sortedFiles = useMemo(() => {
    return selectedFiles.sort((a, b) => {
      if (a.tokenCount == null) return 1
      if (b.tokenCount == null) return -1

      return b.tokenCount - a.tokenCount
    })
  }, [selectedFiles])

  async function deselect(path: Id) {
    const selection = await invoke<SelectionResult>('toggle_selection', {
      directoryPath: directory?.path,
      current: Array.from(selectedNodes),
      nodePath: path,
    })
    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  return (
    <Disclosure id="selected" className="border-b border-interactive-mid -mx-2">
      {({ isExpanded }) => (
        <>
          <Button
            slot="trigger"
            className="flex w-full items-center gap-1 cursor-pointer sticky top-0 px-2 py-2 bg-background-light"
          >
            <Heading className="flex items-center gap-1 text-text-dark">
              <Checkbox
                slot="selection"
                defaultSelected
                className="flex items-center justify-center size-[15px] rounded-sm  text-accent-text-light
                            border border-border-light  data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid
                            bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light
                            flex-shrink-0"
              >
                {({ isSelected }) => isSelected && <CheckIcon />}
              </Checkbox>

              {isExpanded ? <TriangleDownIcon /> : <TriangleRightIcon />}
              <span className="uppercase font-semibold tracking-wide text-xs">
                Selected files ({sortedFiles.length})
              </span>
            </Heading>
          </Button>
          <DisclosurePanel className="pl-[calc(15px+var(--spacing)*2)] pb-4">
            {sortedFiles.length > 0 ? (
              <ul className="text-sm text-text-dark">
                {Array.from(sortedFiles).map((file) => (
                  <li key={file.path}>
                    <Checkbox
                      defaultSelected
                      slot="selection"
                      className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-1 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
                      onChange={(isSelected) => {
                        if (!isSelected) void deselect(file.path)
                      }}
                    >
                      {({ isSelected }) => (
                        <>
                          <span
                            className="flex items-center justify-center mt-0.5 size-[15px] rounded-sm text-accent-text-light
                                        border border-border-light  group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid
                                        bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light
                                        flex-shrink-0"
                          >
                            {isSelected && <CheckIcon />}
                          </span>
                          <span className="flex flex-col text-left">
                            <span className="flex items-baseline gap-2">
                              <span className="font-normal text-text-dark break-all">
                                {file.title}
                              </span>
                              <span className="text-xs text-solid-light">
                                {file.tokenCount == null
                                  ? 'counting...'
                                  : `${file.tokenCount} tokens${
                                      file.tokenPercentage == null
                                        ? ''
                                        : ` (${Math.ceil(file.tokenPercentage)}%)`
                                    }`}
                              </span>
                            </span>
                            <span className="text-xs text-solid-light break-all">
                              {file.prettyPath}
                            </span>
                          </span>
                        </>
                      )}
                    </Checkbox>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-text-dark">
                Files selected in the tree will appear here.
              </div>
            )}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}
