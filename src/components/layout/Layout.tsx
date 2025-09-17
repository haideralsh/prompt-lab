import React, { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '../ScrollArea'

const MIN_SIDEBAR_WIDTH = 15
const MAX_SIDEBAR_WIDTH = 1000

interface LayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
  footer: React.ReactNode
  subfooter: React.ReactNode
  tabs: React.ReactNode
}

export function Layout({
  sidebar,
  main,
  footer,
  subfooter,
  tabs,
}: LayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function startDragging(e: React.MouseEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  const stopDragging = () => setIsDragging(false)

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth)
      }
    }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', stopDragging)
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stopDragging)
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-hidden flex flex-col bg-background-dark"
    >
      <div className="flex-none">{tabs}</div>
      <div className="flex flex-1 min-h-0">
        <div
          className="border-r border-interactive-mid relative flex-none has-[[data-sidebar-handle]:hover]:border-r-border-light bg-background-light"
          style={{ width: sidebarWidth }}
        >
          <ScrollArea>{sidebar}</ScrollArea>

          <div
            onMouseDown={startDragging}
            data-sidebar-handle
            className="absolute -right-1.25 top-0 h-full w-2 cursor-col-resize select-none"
          />
        </div>

        <div className="flex-1">
          <ScrollArea>{main}</ScrollArea>
        </div>
      </div>

      <div className="flex-none border-t border-interactive-mid bg-background-light">
        <div className="p-3">{footer}</div>
      </div>

      <div className="flex-none bg-interactive-dark text-text-dark text-xs">
        <div className="py-1 px-2">{subfooter}</div>
      </div>
    </div>
  )
}
