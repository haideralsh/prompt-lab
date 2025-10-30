import { Tree, TreeDisplayMode } from '@/types/file-tree'
import { invoke } from '@tauri-apps/api/core'
import { DirectoryInfo } from '@/types/directory-info'
import { Key } from 'react-aria-components'
import { Instruction } from '@/components/panels/instruction/types'

export async function copyAllToClipboard(params: {
  treeDisplayMode: TreeDisplayMode
  fullTree: Tree
  root: DirectoryInfo['name']
  selectedNodes: Set<Key>
  gitDiffPaths: Set<string>
  urls: Set<string>
  instructionIds: Set<string>
  unsavedInstruction: Instruction | null
}) {
  await invoke('copy_all_to_clipboard', {
    treeDisplayMode: params.treeDisplayMode,
    fullTree: params.fullTree,
    root: params.root,
    selectedNodes: Array.from(params.selectedNodes),
    gitDiffPaths: Array.from(params.gitDiffPaths),
    urls: Array.from(params.urls),
    instructionIds: Array.from(params.instructionIds),
    instructions: params.unsavedInstruction
      ? [
          {
            name: params.unsavedInstruction.name,
            content: params.unsavedInstruction.content,
          },
        ]
      : [],
  })
}
