import { useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Checkbox } from 'react-aria-components'
import { CheckIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'motion/react'
import { PanelDisclosure } from './PanelDisclosure'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import { Id, SelectionResult } from '../../types/FileTree'
import { CopyButton } from '../common/CopyButton'

export function SelectedFilesPanel() {
  const {
    selectedFiles,
    directory,
    selectedNodes,
    setSelectedFiles,
    setSelectedNodes,
    setIndeterminateNodes,
    totalTokenCount,
    tree,
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

  async function deselectAll() {
    const selection = await invoke<SelectionResult>('clear_selection', {
      directoryPath: directory?.path,
    })
    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  async function copyFiles(paths: Id[]) {
    await invoke('copy_files_to_clipboard', {
      directoryPath: directory.path,
      treeMode: 'selected',
      fullTree: tree,
      selectedNodes: paths,
    })
  }

  return (
    <PanelDisclosure
      id="selected"
      label="Selected files"
      count={sortedFiles.length}
      headingClassName="flex items-center gap-1 text-text-dark"
      panelClassName="p-2 flex flex-col gap-1"
      iconClassName=""
      isGroupSelected={sortedFiles.length > 0}
      isGroupIndeterminate={false}
      onSelectAll={false}
      onDeselectAll={() => {
        void deselectAll()
      }}
      tokenCount={totalTokenCount}
      actions={
        sortedFiles.length ? (
          <CopyButton
            onCopy={() => copyFiles(sortedFiles.map((file) => file.path))}
            className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
            isDisabled={sortedFiles.length === 0}
          />
        ) : undefined
      }
    >
      {sortedFiles.length > 0 ? (
        <ul className="text-sm text-text-dark">
          <AnimatePresence initial={false}>
            {Array.from(sortedFiles).map((file) => (
              <motion.li
                key={file.path}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{
                  opacity: 0,
                  height: 0,
                  transition: { duration: 0.15 },
                }}
                className="overflow-hidden"
                layout
              >
                <Checkbox
                  defaultSelected
                  slot="selection"
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
                  onChange={(isSelected) => {
                    if (!isSelected) void deselect(file.path)
                  }}
                >
                  {({ isSelected }) => (
                    <>
                      <span
                        className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light
                                  border border-border-light  group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid
                                  bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light
                                  flex-shrink-0"
                      >
                        {isSelected && <CheckIcon />}
                      </span>
                      <span className="flex items-center gap-1.5 w-full min-w-0">
                        <span className="font-normal text-text-dark break-all truncate">
                          {file.title}
                        </span>
                        <span className="hidden group-hover:inline text-solid-light truncate">
                          {file.prettyPath}
                        </span>
                      </span>
                      <span>
                        <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                          <CopyButton
                            onCopy={async () => {
                              await copyFiles([file.path])
                            }}
                            className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                          />
                          <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm group-hover:text-text-dark group-hover:border-border-light">
                            {file.tokenCount == null
                              ? 'counting...'
                              : file.tokenCount.toLocaleString()}
                          </span>
                        </span>
                      </span>
                    </>
                  )}
                </Checkbox>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="text-xs/loose text-solid-light ">
          Files selected in the tree will appear here and their content will be
          included in the prompt.
        </div>
      )}
    </PanelDisclosure>
  )
}
