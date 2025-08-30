import React, { useState } from 'react'
import { Tree } from '../../types/FileTree'
import { DirectoryInfo } from '../../types/DirectoryInfo'
import { Key } from 'react-aria-components'

type SidebarContext = {
  directory: DirectoryInfo | null
  setDirectory: (root: DirectoryInfo) => void
  tree: Tree
  setTree: (tree: Tree) => void
  selectedNodes: Set<Key>
  setSelectedNodes: (nodes: Set<Key>) => void
}

const SidebarContext = React.createContext<SidebarContext>({
  directory: null,
  setDirectory: () => {},
  tree: [],
  setTree: () => {},
  selectedNodes: new Set<Key>(),
  setSelectedNodes: () => {},
})

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
  const [tree, setTree] = useState<Tree>([])
  const [directory, setDirectory] = useState<DirectoryInfo | null>(null)

  return (
    <SidebarContext.Provider
      value={{
        selectedNodes,
        setSelectedNodes,
        tree,
        setTree,
        directory,
        setDirectory,
      }}
    >
      {props.children}
    </SidebarContext.Provider>
  )
}
