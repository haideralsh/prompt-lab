import React, { useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Header } from './header'
import { useTokenCountListener } from './use-token-count-listener'
import { useResizeableSidebar } from '../sidebar/use-resizeable-sidebar'
import { SidebarResizeHandle } from '../sidebar/sidebar-resize-handle'

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

      <div className="flex min-h-0 flex-1 flex-col">
        <Header />

        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea>{main}</ScrollArea>
        </div>

        {footer}
      </div>
    </div>
  )
}
