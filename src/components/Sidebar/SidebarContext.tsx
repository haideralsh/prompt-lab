import React, { useState, Dispatch, SetStateAction } from 'react'
import { FileNode, Tree } from '../../types/FileTree'
import { DirectoryInfo } from '../../types/DirectoryInfo'
import { Key } from 'react-aria-components'

type SidebarContext = {
  directory: DirectoryInfo | null
  setDirectory: (root: DirectoryInfo) => void
  tree: Tree
  setTree: (tree: Tree) => void
  filteredTree: Tree
  setFilteredTree: (tree: Tree) => void
  selectedNodes: Set<Key>
  setSelectedNodes: (nodes: Set<Key>) => void
  selectedFiles: FileNode[]
  setSelectedFiles: Dispatch<SetStateAction<FileNode[]>>
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
      'useSidebarContext must be used within a SidebarContextProvider'
    )
  }
  return context
}

export function SidebarContextProvider(props: SidebarContextProps) {
  const [selectedNodes, setSelectedNodes] = useState<Set<Key>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([])
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0)
  const [indeterminateNodes, setIndeterminateNodes] = useState<Set<Key>>(
    new Set()
  )
  const [tree, setTree] = useState<Tree>([])
  const [filteredTree, setFilteredTree] = useState<Tree>([])
  const [directory, setDirectory] = useState<DirectoryInfo | null>(null)

  return (
    <SidebarContext.Provider
      value={{
        selectedNodes,
        setSelectedNodes,
        selectedFiles,
        setSelectedFiles,
        totalTokenCount,
        setTotalTokenCount,
        indeterminateNodes,
        setIndeterminateNodes,
        filteredTree,
        setFilteredTree,
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
