import React, { useState } from 'react'

type SidebarContext = {
  selectedNodes: string[]
  setSelectedNodes: React.Dispatch<React.SetStateAction<string[]>>
}

const SidebarContext = React.createContext<SidebarContext>({
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

  return (
    <SidebarContext.Provider value={{ selectedNodes, setSelectedNodes }}>
      {props.children}
    </SidebarContext.Provider>
  )
}
