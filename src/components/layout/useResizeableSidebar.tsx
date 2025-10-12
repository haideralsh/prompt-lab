import { useEffect, useState } from 'react'

const DEFAULT_SIDEBAR_WIDTH = 300
const MIN_SIDEBAR_WIDTH = 15
const MAX_SIDEBAR_WIDTH = 1000

interface SidebarResizeHandleProps {
  sidebarWidth: number
  startDragging: (e: React.MouseEvent<Element, MouseEvent>) => void
  isDragging: boolean
}

export function useResizeableSidebar(
  containerRef: React.RefObject<HTMLDivElement>
): SidebarResizeHandleProps {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [isDragging, setIsDragging] = useState(false)

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

  return { sidebarWidth, startDragging, isDragging }
}
