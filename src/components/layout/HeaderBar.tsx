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
} from '../../state/atoms'
import { invoke } from '@tauri-apps/api/core'
import { CopyIcon } from '@radix-ui/react-icons'

function HeaderBar() {
  const directory = useAtomValue(directoryAtom)
  const tree = useAtomValue(treeAtom)
  const selectedNodes = useAtomValue(selectedNodesAtom)
  const selectedPagesIds = useAtomValue(selectedPagesIdsAtom)
  const selectedDiffIds = useAtomValue(selectedDiffIdsAtom)
  const selectedInstructionIds = useAtomValue(selectedInstructionIdsAtom)
  const unsavedInstruction = useAtomValue(unsavedInstructionAtom)
  const treeDisplayMode = useAtomValue(treeDisplayModeAtom)

  async function handleCopyToClipboard() {
    await invoke('copy_all_to_clipboard', {
      treeDisplayMode,
      fullTree: tree,
      root: directory?.path ?? '',
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

      <div className="flex items-center gap-1">
        <button
          onClick={handleCopyToClipboard}
          className="inline-flex items-center gap-1.5 text-xs py-0.5 px-2 text-text-dark hover:bg-interactive-dark rounded-sm hover:text-text-light transition-colors duration-150 outline-none focus:ring-inset focus:ring-1 focus:ring-accent-border-light"
          title="Copy to clipboard"
        >
          <CopyIcon />
          <span>Copy to clipboard</span>
        </button>
        <TokenCount count={0} />
      </div>
    </div>
  )
}

export default HeaderBar
