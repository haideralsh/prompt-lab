import React, { useState, useEffect, useRef } from 'react'

interface ResizableLayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
}

export const ResizableLayout = ({ sidebar, main }: ResizableLayoutProps) => {
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const minSidebarWidth = 15
  const maxSidebarWidth = 1000
  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const stopDragging = () => {
    setIsDragging(false)
  }
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
      className="flex h-screen w-full overflow-hidden text-[#D0D0D0] bg-black"
    >
      <div
        className="h-full"
        style={{
          width: `${sidebarWidth}px`,
        }}
      >
        {sidebar}
      </div>
      <div
        className="flex items-stretch cursor-col-resize relative"
        onMouseDown={startDragging}
      >
        <div
          className={`w-1 bg-gray-300 h-full ${isDragging ? 'bg-blue-400' : 'hover:bg-blue-400'} transition-colors`}
        ></div>
      </div>
      <div className="flex-1 h-full overflow-auto">{main}</div>
    </div>
  )
}
