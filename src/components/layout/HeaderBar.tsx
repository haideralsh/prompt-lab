import { useAtomValue } from 'jotai'
import { TokenCount } from '../common/TokenCount'
import {
  directoryAtom,
  selectedNodesAtom,
  treeAtom,
  selectedPagesIdsAtom,
  selectedDiffIdsAtom,
  selectedInstructionIdsAtom,
  unsavedInstructionAtom,
  treeDisplayModeAtom,
  totalTokenCountAtom,
} from '../../state/atoms'
import { invoke } from '@tauri-apps/api/core'
import { CopyButton } from '../common/CopyButton'
import { SettingsDialog } from './SettingsDialog'
import { DividerVerticalIcon } from '@radix-ui/react-icons'

function HeaderBar() {
  const directory = useAtomValue(directoryAtom)
  const tree = useAtomValue(treeAtom)
  const selectedNodes = useAtomValue(selectedNodesAtom)
  const selectedPagesIds = useAtomValue(selectedPagesIdsAtom)
  const selectedDiffIds = useAtomValue(selectedDiffIdsAtom)
  const selectedInstructionIds = useAtomValue(selectedInstructionIdsAtom)
  const unsavedInstruction = useAtomValue(unsavedInstructionAtom)
  const treeDisplayMode = useAtomValue(treeDisplayModeAtom)
  const totalTokenCount = useAtomValue(totalTokenCountAtom)

  async function handleCopyToClipboard() {
    await invoke('copy_all_to_clipboard', {
      treeDisplayMode,
      fullTree: tree,
      root: directory.path,
      selectedNodes: Array.from(selectedNodes),
      gitDiffPaths: Array.from(selectedDiffIds),
      urls: Array.from(selectedPagesIds),
      instructionIds: Array.from(selectedInstructionIds),
      instructions: unsavedInstruction
        ? [
            {
              name: unsavedInstruction.name,
              content: unsavedInstruction.content,
            },
          ]
        : [],
    })
  }

  return (
    <div className="bg-background-dark p-2 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="uppercase font-medium tracking-wide text-xs text-text-dark">
          Prompt
        </span>
      </div>

      <div className="flex items-center gap-3 text-text-dark">
        <div className="flex item-center gap-1.5">
          <SettingsDialog />
          <DividerVerticalIcon className="text-border-light" />
          <CopyButton
            onCopy={handleCopyToClipboard}
            idleLabel="Copy all"
            copiedLabel="Copied"
          />
        </div>
        <TokenCount count={totalTokenCount} showLabel />
      </div>
    </div>
  )
}

export default HeaderBar
