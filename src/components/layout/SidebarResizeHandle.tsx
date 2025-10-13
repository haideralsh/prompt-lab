interface SidebarResizeHandleProps {
  startDragging: (e: React.MouseEvent<Element, MouseEvent>) => void
  isDragging: boolean
}

export function SidebarResizeHandle({
  startDragging,
  isDragging,
}: SidebarResizeHandleProps) {
  return (
    <div
      onMouseDown={startDragging}
      data-sidebar-handle
      className="absolute -right-0.75 top-0 h-full w-2 cursor-col-resize select-none group"
    >
      <div
        className={`absolute right-0 top-0 h-full transition-all z-20 ${
          isDragging
            ? 'w-1 bg-accent-border-dark'
            : 'w-0 bg-accent-border-dark group-hover:w-1'
        }`}
      />
    </div>
  )
}
