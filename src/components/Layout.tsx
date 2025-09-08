import React, { useState, useEffect, useRef } from 'react'

const MIN_SIDEBAR_WIDTH = 15
const MAX_SIDEBAR_WIDTH = 1000

interface LayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
  footer: React.ReactNode
}

export function Layout({ sidebar, main, footer }: LayoutProps) {
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
      className="h-screen flex flex-col bg-background-dark"
    >
      {/* Top Section (scrolls) */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div
          className="bg-sidebar border-r border-border-dark relative flex-none"
          style={{ width: sidebarWidth }}
        >
          <div className="h-full overflow-auto">{sidebar}</div>

          {/* Drag handle */}
          <div
            onMouseDown={startDragging}
            className="absolute right-0 top-0 h-full w-[1px] cursor-col-resize select-none"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-background">{main}</div>
      </div>

      {/* Bottom Section (always visible) */}
      <div className="flex-none border-t border-border-dark">
        <div className="p-3">{footer}</div>
      </div>
    </div>
  )
}
