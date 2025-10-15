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
      <span className="uppercase font-medium tracking-wide text-xs text-text-dark">
        Prompt
      </span>

      <div className="flex items-center gap-3">
        <CopyButton
          onCopy={handleCopyToClipboard}
          idleLabel="Copy all"
          copiedLabel="Copied"
        />
        <TokenCount count={totalTokenCount} />
      </div>
    </div>
  )
}

export default HeaderBar
