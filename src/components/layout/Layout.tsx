import React, { useRef } from 'react'
import { ScrollArea } from '../ScrollArea'
import { useTokenCountListener } from './useTokenCountListener'
import HeaderBar from './HeaderBar'
import { useResizeableSidebar } from './useResizeableSidebar'
import { SidebarResizeHandle } from './SidebarResizeHandle'

interface LayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
  footer: React.ReactNode
}

export function Layout({ sidebar, main, footer }: LayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { sidebarWidth, startDragging, isDragging } =
    useResizeableSidebar(containerRef)

  useTokenCountListener()

  return (
    <div
      ref={containerRef}
      className="flex h-screen overflow-hidden bg-background-light"
    >
      <div
        className="relative flex-none bg-background-dark"
        style={{ width: sidebarWidth }}
      >
        <ScrollArea>{sidebar}</ScrollArea>
        <SidebarResizeHandle
          startDragging={startDragging}
          isDragging={isDragging}
        />
      </div>

      <div className="flex flex-1 min-h-0 flex-col">
        <HeaderBar />

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea>{main}</ScrollArea>
        </div>

        {footer}
      </div>
    </div>
  )
}
