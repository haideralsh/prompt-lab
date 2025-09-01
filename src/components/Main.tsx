import { useSidebarContext } from './Sidebar/SidebarContext'
import { invoke } from '@tauri-apps/api/core'

export function Main() {
  const { selectedFiles } = useSidebarContext()

  async function handleCopyToClipboard() {
    await invoke<any>('copy_files_to_clipboard', {
      paths: selectedFiles.map((file) => file.id),
    })
  }

  return (
    <section className="flex-1 p-4">
      <h2 className="text-sm font-semibold text-white mb-2">Selected files</h2>
      {selectedFiles.length > 0 ? (
        <div className="flex flex-col gap-4">
          <ul className="list-disc pl-5 space-y-1 text-sm text-white">
            {Array.from(selectedFiles).map((path) => (
              <li key={path.id}>{path.title}</li>
            ))}
          </ul>
          <button
            onClick={handleCopyToClipboard}
            type="button"
            className="rounded-sm bg-gray-600 px-2 py-1 text-xs font-semibold text-white shadow-xs hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 dark:bg-gray-500 dark:shadow-none dark:hover:bg-gray-400 dark:focus-visible:outline-gray-500"
          >
            Copy to Clipboard
          </button>
        </div>
      ) : (
        <div className="text-sm text-white">No files selected.</div>
      )}
    </section>
  )
}
