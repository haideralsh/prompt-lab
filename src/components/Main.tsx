import { useSidebarContext } from './Sidebar/SidebarContext'

export function Main() {
  const { selectedNodes } = useSidebarContext()

  return (
    <section className="flex-1 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        Selected files
      </h2>
      {selectedNodes.length > 0 ? (
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-900">
          {selectedNodes.map((path) => (
            <li key={path}>{path}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No files selected.</div>
      )}
    </section>
  )
}
