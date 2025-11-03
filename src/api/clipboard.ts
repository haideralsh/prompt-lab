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

export async function copyFilesToClipboard(params: {
  directoryPath: string
  treeDisplayMode: TreeDisplayMode
  fullTree: Tree
  selectedNodes: Set<Key>
}) {
  await invoke<void>('copy_files_to_clipboard', {
    directoryPath: params.directoryPath,
    treeDisplayMode: params.treeDisplayMode,
    fullTree: params.fullTree,
    selectedNodes: Array.from(params.selectedNodes),
  })
}

export async function copyPagesToClipboard(params: {
  directoryPath: string
  urls: string[]
}) {
  await invoke<void>('copy_pages_to_clipboard', params)
}

export async function copyInstructionsToClipboard(params: {
  directoryPath: string
  instructionIds: string[]
  instructions?: Array<{ name: string; content: string }>
}) {
  await invoke<void>('copy_instructions_to_clipboard', {
    directoryPath: params.directoryPath,
    instructionIds: params.instructionIds,
    instructions: params.instructions ?? [],
  })
}

export async function copyDiffsToClipboard(
  directoryPath: string,
  paths: string | string[] | Set<string>,
) {
  const pathsArray = typeof paths === 'string' ? [paths] : Array.from(paths)

  await invoke<void>('copy_diffs_to_clipboard', {
    directoryPath,
    paths: pathsArray,
  })
}
