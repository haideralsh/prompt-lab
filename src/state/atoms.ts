import { atom } from 'jotai'
import type { Key } from 'react-aria-components'
import type { DirectoryInfo } from '../types/DirectoryInfo'
import type { FileNode, Tree, TreeDisplayMode } from '../types/FileTree'
import type { Instruction } from '../components/panels/instruction/types'
import { NO_DIRECTORY } from './initial'
import { atomWithReset, RESET } from 'jotai/utils'

export const directoryAtom = atomWithReset<DirectoryInfo>(NO_DIRECTORY)
export const treeAtom = atomWithReset<Tree>([])
export const filteredTreeAtom = atomWithReset<Tree>([])
export const selectedNodesAtom = atomWithReset<Set<Key>>(new Set<Key>())
export const selectedFilesAtom = atomWithReset<FileNode[]>([])
export const selectedPagesIdsAtom = atomWithReset<Set<string>>(
  new Set<string>(),
)
export const selectedDiffIdsAtom = atomWithReset<Set<string>>(new Set<string>())
export const indeterminateNodesAtom = atomWithReset<Set<Key>>(new Set<Key>())
export const selectedInstructionIdsAtom = atomWithReset<Set<string>>(
  new Set<string>(),
)
export const unsavedInstructionAtom = atomWithReset<Instruction | null>(null)
export const instructionsTokenCountAtom = atomWithReset<number>(0)
export const totalFilesTokenCountAtom = atomWithReset<number>(0)
export const totalPagesTokenCountAtom = atomWithReset<number>(0)
export const totalGitDiffTokenCountAtom = atomWithReset<number>(0)
export const treeTokenCountAtom = atomWithReset<number>(0)
export const treeDisplayModeAtom = atomWithReset<TreeDisplayMode>('selected')
export const totalTokenCountAtom = atom<number>(
  (get) =>
    get(totalFilesTokenCountAtom) +
    get(totalPagesTokenCountAtom) +
    get(totalGitDiffTokenCountAtom) +
    get(instructionsTokenCountAtom) +
    get(treeTokenCountAtom),
)
export const resetStateAtom = atom(
  null, // This is a write-only atom, so the read value is null
  (_, set) => {
    set(directoryAtom, RESET)
    set(treeAtom, RESET)
    set(filteredTreeAtom, RESET)
    set(selectedNodesAtom, RESET)
    set(selectedFilesAtom, RESET)
    set(selectedPagesIdsAtom, RESET)
    set(selectedDiffIdsAtom, RESET)
    set(indeterminateNodesAtom, RESET)
    set(selectedInstructionIdsAtom, RESET)
    set(unsavedInstructionAtom, RESET)
    set(instructionsTokenCountAtom, RESET)
    set(totalFilesTokenCountAtom, RESET)
    set(totalPagesTokenCountAtom, RESET)
    set(totalGitDiffTokenCountAtom, RESET)
    set(treeTokenCountAtom, RESET)
    set(treeDisplayModeAtom, RESET)
  },
)
