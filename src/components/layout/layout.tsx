import React, { useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Header } from './header'
import { useTokenCountListener } from './use-token-count-listener'
import { useResizeableSidebar } from './use-resizeable-sidebar'
import { SidebarResizeHandle } from './sidebar-resize-handle'

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
        <Header />

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea>{main}</ScrollArea>
        </div>

        {footer}
      </div>
    </div>
  )
}
