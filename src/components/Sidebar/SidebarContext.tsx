import React, { useState, Dispatch, SetStateAction } from 'react'
import { FileNode, Tree } from '../../types/FileTree'
import { DirectoryInfo } from '../../types/DirectoryInfo'
import { Key } from 'react-aria-components'

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
      }}
    >
      {props.children}
    </SidebarContext.Provider>
  )
}
