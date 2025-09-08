import React, { useState, useEffect, useRef } from 'react'

interface LayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
  footer: React.ReactNode
}

export const Layout = ({ sidebar, main, footer }: LayoutProps) => {
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const minSidebarWidth = 15
  const maxSidebarWidth = 1000

  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const stopDragging = () => setIsDragging(false)

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      if (newWidth >= minSidebarWidth && newWidth <= maxSidebarWidth) {
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
      className="h-screen flex flex-col text-white bg-black"
    >
      {/* Top Section (scrolls) */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div
          className="bg-sidebar border-r border-sidebar-border relative flex-none"
          style={{ width: sidebarWidth }}
        >
          <div className="h-full overflow-auto">{sidebar}</div>

          {/* Drag handle */}
          <div
            onMouseDown={startDragging}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-background">{main}</div>
      </div>

      {/* Bottom Section (always visible) */}
      <div className="flex-none bg-muted border-t border-border">
        <div className="p-6">{footer}</div>
      </div>
    </div>
  )
}
