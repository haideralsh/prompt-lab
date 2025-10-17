import { useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Button,
  Key,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-aria-components'
import { ReaderIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'motion/react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { sortFilesByTokenCount } from '../../helpers/sortFilesByTokenCount'
import {
  FileNode,
  Id,
  SelectionResult,
  TreeDisplayMode,
  treeDisplayModes,
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
  totalFilesTokenCountAtom,
  treeTokenCountAtom,
} from '../../state/atoms'
import { Panel } from './Panel'
import { PanelList } from './PanelList'
import { PanelRowCheckbox } from './PanelRowCheckbox'
import { EmptyPanelListMessage } from './EmptyPanelListMessage'

export function SelectedFilesPanel() {
  const [selectedFiles, setSelectedFiles] = useAtom(selectedFilesAtom)
  const directory = useAtomValue(directoryAtom)
  const [selectedNodes, setSelectedNodes] = useAtom(selectedNodesAtom)
  const setIndeterminateNodes = useSetAtom(indeterminateNodesAtom)
  const tree = useAtomValue(treeAtom)
  const [treeDisplayMode, setTreeDisplayMode] = useAtom(treeDisplayModeAtom)
  const totalFilesTokenCount = useAtomValue(totalFilesTokenCountAtom)
  const [treeTokenCount, setTreeTokenCount] = useAtom(treeTokenCountAtom)

  const sortedFiles = useMemo(() => {
    return sortFilesByTokenCount(selectedFiles)
  }, [selectedFiles])

  async function deselect(path: Id) {
    const selection = await invoke<SelectionResult>('toggle_selection', {
      directoryPath: directory.path,
      current: Array.from(selectedNodes),
      nodePath: path,
    })
    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  async function deselectAll() {
    const selection = await invoke<SelectionResult>('clear_selection', {
      directoryPath: directory.path,
    })
    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  async function copyFiles(paths: Id[]) {
    await invoke('copy_files_to_clipboard', {
      directoryPath: directory.path,
      treeDisplayMode,
      fullTree: tree,
      selectedNodes: paths,
    })
  }

  async function handleOpenFile(file: FileNode) {
    try {
      await invoke('open_with_editor', { path: file.path })
    } catch (error) {
      queue.add({
        title: 'Failed to open file',
        description: (error as ApplicationError).message,
      })
    }
  }

  function handleTreeDisplayModeChange(keys: Set<Key>) {
    const [mode] = Array.from(keys) as Array<TreeDisplayMode>

    if (treeDisplayModes.has(mode)) {
      setTreeDisplayMode(mode)
      void updateTreeTokenCount(mode)
    }
  }

  async function updateTreeTokenCount(mode: TreeDisplayMode) {
    invoke<number>('count_rendered_tree_tokens', {
      treeDisplayMode: mode,
      fullTree: tree,
      selectedNodes: Array.from(selectedNodes) as string[],
    })
      .then((count) => setTreeTokenCount(count))
      .catch(() => setTreeTokenCount(0))
  }

  return (
    <Panel
      id="selected"
      label="Selected files"
      count={sortedFiles.length}
      headingClassName="flex items-center gap-1 text-text-dark"
      panelClassName="p-2 flex flex-col gap-1"
      isGroupSelected={sortedFiles.length > 0}
      isGroupIndeterminate={false}
      onSelectAll={false}
      onDeselectAll={() => {
        void deselectAll()
      }}
      tokenCount={totalFilesTokenCount + treeTokenCount}
      endActions={
        <>
          <ToggleButtonGroup
            aria-label="Directory tree in model context"
            selectedKeys={new Set([treeDisplayMode])}
            onSelectionChange={handleTreeDisplayModeChange}
            className="inline-flex items-center rounded-sm border border-border-mid overflow-hidden [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-border-mid"
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
          <CopyButton
            onCopy={() => copyFiles(sortedFiles.map((file) => file.path))}
            isDisabled={sortedFiles.length === 0 && treeDisplayMode === 'none'}
          />
        </>
      }
    >
      {sortedFiles.length > 0 ? (
        <PanelList
          ariaLabel="Selected files"
          className="text-sm text-text-dark"
        >
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
                <PanelRowCheckbox
                  defaultSelected
                  onChange={(isSelected) => {
                    if (!isSelected) void deselect(file.path)
                  }}
                  endActions={
                    <>
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
                    </>
                  }
                >
                  <span className="font-normal text-text-dark break-all truncate">
                    {file.title}
                  </span>
                  <span className="hidden group-hover:inline text-solid-light truncate">
                    {file.prettyPath}
                  </span>
                </PanelRowCheckbox>
              </motion.li>
            ))}
          </AnimatePresence>
        </PanelList>
      ) : (
        <EmptyPanelListMessage>
          Files selected in the tree will appear here and their content will be
          included in the prompt.
        </EmptyPanelListMessage>
      )}
    </Panel>
  )
}
