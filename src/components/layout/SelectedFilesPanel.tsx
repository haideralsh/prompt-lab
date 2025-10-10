import { useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Button,
  Checkbox,
  Key,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-aria-components'
import { CheckIcon, ReaderIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'motion/react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { PanelDisclosure } from './PanelDisclosure'
import { sortFilesByTokenCount } from '../../helpers/sortFilesByTokenCount'
import {
  FileNode,
  Id,
  SelectionResult,
  TreeDisplayMode,
} from '../../types/FileTree'
import { CopyButton } from '../common/CopyButton'
import { queue } from '../ToastQueue'
import { ApplicationError } from '../../helpers/getErrorMessage'
import { TokenCount } from '../common/TokenCount'
import {
  directoryAtom,
  indeterminateNodesAtom,
  selectedFilesAtom,
  selectedNodesAtom,
  treeAtom,
  treeDisplayModeAtom,
  totalTokenCountAtom,
} from '../../state/atoms'

export function SelectedFilesPanel() {
  const [selectedFiles, setSelectedFiles] = useAtom(selectedFilesAtom)
  const directory = useAtomValue(directoryAtom)
  const [selectedNodes, setSelectedNodes] = useAtom(selectedNodesAtom)
  const setIndeterminateNodes = useSetAtom(indeterminateNodesAtom)
  const tree = useAtomValue(treeAtom)
  const treeDisplayMode = useAtomValue(treeDisplayModeAtom)
  const setTreeDisplayMode = useSetAtom(treeDisplayModeAtom)
  const totalTokenCount = useAtomValue(totalTokenCountAtom)

  const sortedFiles = useMemo(() => {
    return sortFilesByTokenCount(selectedFiles)
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
      directoryPath: directory?.path,
      treeDisplayMode,
      fullTree: tree,
      selectedNodes: paths,
    })
  }

  async function handleOpenFile(file: FileNode) {
    try {
      await invoke('open_file', { path: file.path })
    } catch (error) {
      queue.add({
        title: 'Failed to open file',
        description: (error as ApplicationError).message,
      })
    }
  }

  function handleTreeDisplayModeChange(keys: Set<Key>) {
    const [choice] = Array.from(keys) as Array<TreeDisplayMode>

    if (choice) {
      setTreeDisplayMode(choice)
    }
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
      titleActions={
        <ToggleButtonGroup
          aria-label="Directory tree in model context"
          selectedKeys={new Set([treeDisplayMode])}
          onSelectionChange={handleTreeDisplayModeChange}
          className="hidden group-hover:inline-flex group-hover:items-center rounded-sm border border-border-mid overflow-hidden [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-border-mid"
          disallowEmptySelection
        >
          <ToggleButton
            id="none"
            className="uppercase text-xs tracking-wide px-1.5 flex items-center justify-center text-text-dark hover:bg-interactive-mid data-[selected]:bg-text-dark data-[selected]:text-background-light"
          >
            No Tree
          </ToggleButton>
          <ToggleButton
            id="selected"
            className="uppercase text-xs tracking-wide px-1.5 flex items-center justify-center text-text-dark hover:bg-interactive-mid data-[selected]:bg-text-dark data-[selected]:text-background-light"
          >
            Selected Only
          </ToggleButton>
          <ToggleButton
            id="full"
            className="uppercase text-xs tracking-wide px-1.5 flex items-center justify-center text-text-dark hover:bg-interactive-mid data-[selected]:bg-text-dark data-[selected]:text-background-light"
          >
            Full Tree
          </ToggleButton>
        </ToggleButtonGroup>
      }
      endActions={
        <CopyButton
          onCopy={() => copyFiles(sortedFiles.map((file) => file.path))}
          isDisabled={sortedFiles.length === 0}
        />
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
                exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
                className="overflow-hidden"
                layout
              >
                <Checkbox
                  defaultSelected
                  className="relative grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
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
                          <Button
                            onPress={() => {
                              void handleOpenFile(file)
                            }}
                            className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                          >
                            <ReaderIcon />
                          </Button>
                          <CopyButton
                            onCopy={async () => {
                              await copyFiles([file.path])
                            }}
                          />
                          <TokenCount count={file.tokenCount} />
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
