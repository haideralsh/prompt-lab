import React, { useState, Dispatch, SetStateAction } from 'react'
import { FileNode, Tree } from '../../types/FileTree'
import { DirectoryInfo } from '../../types/DirectoryInfo'
import { Key } from 'react-aria-components'
import { Instruction } from '../layout/instruction/types'

export type TreeMode = 'full' | 'selected' | 'none'

type SidebarContext = {
  directory: DirectoryInfo
  setDirectory: (root: DirectoryInfo) => void
  tree: Tree
  setTree: (tree: Tree) => void
  filteredTree: Tree
  setFilteredTree: (tree: Tree) => void
  selectedNodes: Set<Key>
  setSelectedNodes: (nodes: Set<Key>) => void
  selectedFiles: FileNode[]
  setSelectedFiles: Dispatch<SetStateAction<FileNode[]>>
  selectedPagesIds: Set<string>
  setSelectedPagesIds: Dispatch<SetStateAction<Set<string>>>
  selectedDiffIds: Set<string>
  setSelectedDiffIds: Dispatch<SetStateAction<Set<string>>>
  totalTokenCount: number
  setTotalTokenCount: Dispatch<SetStateAction<number>>
  indeterminateNodes: Set<Key>
  setIndeterminateNodes: (nodes: Set<Key>) => void
  selectedInstructionIds: Set<string>
  setSelectedInstructionIds: Dispatch<SetStateAction<Set<string>>>
  unsavedInstruction: Instruction | null
  setUnsavedInstruction: Dispatch<SetStateAction<Instruction | null>>
  treeMode: TreeMode
  setTreeMode: Dispatch<SetStateAction<TreeMode>>
}

// @ts-expect-error createContext expects a value on initialization but it really shouldn't :facepalm
const SidebarContext = React.createContext<SidebarContext>()

interface SidebarContextProps {
  children: React.ReactNode
}

export function useSidebarContext() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error(
      'useSidebarContext must be used within a SidebarContextProvider',
    )
  }
  return context
}

export function SidebarContextProvider(props: SidebarContextProps) {
  const [selectedNodes, setSelectedNodes] = useState<Set<Key>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([])
  const [selectedPagesIds, setSelectedPagesIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [selectedDiffIds, setSelectedDiffIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0)
  const [indeterminateNodes, setIndeterminateNodes] = useState<Set<Key>>(
    new Set(),
  )
  const [tree, setTree] = useState<Tree>([])
  const [filteredTree, setFilteredTree] = useState<Tree>([])
  const [directory, setDirectory] = useState<DirectoryInfo>()
  const [selectedInstructionIds, setSelectedInstructionIds] = useState<
    Set<string>
  >(() => new Set())
  const [unsavedInstruction, setUnsavedInstruction] =
    useState<Instruction | null>(null)
  const [treeMode, setTreeMode] = useState<TreeMode>('selected')

  return (
    <SidebarContext.Provider
      value={{
        selectedNodes,
        setSelectedNodes,
        selectedFiles,
        setSelectedFiles,
        selectedPagesIds,
        setSelectedPagesIds,
        selectedDiffIds,
        setSelectedDiffIds,
        totalTokenCount,
        setTotalTokenCount,
        indeterminateNodes,
        setIndeterminateNodes,
        filteredTree,
        setFilteredTree,
        // @ts-expect-error: There is no directory initially, and I don't want to mark it as nullable because it screws with the rest of the codebase...
        directory,
        setDirectory,
        tree,
        setTree,
        selectedInstructionIds,
        setSelectedInstructionIds,
        unsavedInstruction,
        setUnsavedInstruction,
        treeMode,
        setTreeMode,
      }}
    >
      {props.children}
    </SidebarContext.Provider>
  )
}
