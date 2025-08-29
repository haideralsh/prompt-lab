import React, { useState } from 'react'
import { Tree } from '../../types/FileTree'
import { DirectoryInfo } from '../../types/DirectoryInfo'

type SidebarContext = {
  root: DirectoryInfo | null
  setRoot: (root: DirectoryInfo | null) => void
  tree: Tree
  setTree: (tree: Tree) => void
  selectedNodes: string[]
  setSelectedNodes: React.Dispatch<React.SetStateAction<string[]>>
}

const SidebarContext = React.createContext<SidebarContext>({
  root: null,
  setRoot: () => {},
  tree: [],
  setTree: () => {},
  selectedNodes: [],
  setSelectedNodes: () => {},
})

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
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [tree, setTree] = useState<Tree>([])
  const [root, setRoot] = useState<DirectoryInfo | null>(null)

  return (
    <SidebarContext.Provider
      value={{ selectedNodes, setSelectedNodes, tree, setTree, root, setRoot }}
    >
      {props.children}
    </SidebarContext.Provider>
  )
}
