import { atom } from 'jotai'
import type { Key } from 'react-aria-components'
import type { DirectoryInfo } from '../types/DirectoryInfo'
import type { FileNode, Tree, TreeDisplayMode } from '../types/FileTree'
import type { Instruction } from '../components/layout/instruction/types'
import { NO_DIRECTORY } from './initial'

export const directoryAtom = atom<DirectoryInfo>(NO_DIRECTORY)
export const treeAtom = atom<Tree>([])
export const filteredTreeAtom = atom<Tree>([])
export const selectedNodesAtom = atom<Set<Key>>(new Set<Key>())
export const selectedFilesAtom = atom<FileNode[]>([])
export const selectedPagesIdsAtom = atom<Set<string>>(new Set<string>())
export const selectedDiffIdsAtom = atom<Set<string>>(new Set<string>())
export const indeterminateNodesAtom = atom<Set<Key>>(new Set<Key>())
export const selectedInstructionIdsAtom = atom<Set<string>>(new Set<string>())
export const unsavedInstructionAtom = atom<Instruction | null>(null)
export const totalFilesTokenCountAtom = atom<number>(0)
export const totalPagesTokenCountAtom = atom<number>(0)
export const totalTokenCountAtom = atom<number>(
  (get) => get(totalFilesTokenCountAtom) + get(totalPagesTokenCountAtom),
)
export const treeDisplayModeAtom = atom<TreeDisplayMode>('selected')
