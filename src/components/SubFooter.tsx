import { useSidebarContext } from './Sidebar/SidebarContext'

export function SubFooter() {
  const { selectedFiles, totalTokenCount } = useSidebarContext()

  const selectedCount = selectedFiles.length

  return (
    <div className="flex items-center justify-between w-full">
      <span>{selectedCount} files selected</span>
      <span>~{totalTokenCount.toLocaleString()} total tokens</span>
    </div>
  )
}
