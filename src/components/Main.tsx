import { useMemo } from 'react'
import { useSidebarContext } from './Sidebar/SidebarContext'

export function Main() {
  const { selectedFiles } = useSidebarContext()

  const sortedFiles = useMemo(() => {
    return selectedFiles.sort((a, b) => {
      if (a.tokenCount == null) return 1
      if (b.tokenCount == null) return -1

      return b.tokenCount - a.tokenCount
    })
  }, [selectedFiles])

  return (
    <section className="flex-1 p-4">
      <h2 className="text-sm font-semibold text-white mb-2">Selected files</h2>
      {sortedFiles.length > 0 && (
        <ul className="space-y-4 text-sm text-white">
          {Array.from(sortedFiles).map((path) => (
            <li key={path.id} className="flex flex-col gap-2">
              <span className="flex items-center gap-1">
                <span className="font-semibold">{path.title}</span>
                <span className="text-gray-400">
                  {path.tokenCount == null
                    ? 'counting...'
                    : `${path.tokenCount} tokens${
                        path.tokenPercentage == null
                          ? ''
                          : ` (${Math.ceil(path.tokenPercentage)}%)`
                      }`}
                </span>
              </span>
              <span className="text-xs">{path.id}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
