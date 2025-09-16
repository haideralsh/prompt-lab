import { useEffect, useState } from 'react'
import { DirectoryPickerButton } from './DirectoryPickerButton'
import type { DirectoryInfo } from '../types/DirectoryInfo'
import { invoke } from '@tauri-apps/api/core'
import { ERROR_CODES } from '../constants'
import type { SearchResult, DirectoryError } from '../types/FileTree'
import { useSidebarContext } from './Sidebar/SidebarContext'
import { queue } from './ToastQueue'

async function processDirectories(
  directories: DirectoryInfo[],
): Promise<DirectoryInfo[]> {
  const prettyPaths = await Promise.all(
    directories.map((d) =>
      invoke<string>('pretty_directory_path', { path: d.path }),
    ),
  )
  return directories.map((d, i) => ({ ...d, prettyPath: prettyPaths[i] }))
}

export function LaunchScreen() {
  const [recentOpened, setRecentOpened] = useState<DirectoryInfo[]>([])
  const { setTree, setDirectory, setFilteredTree } = useSidebarContext()

  useEffect(() => {
    async function loadRecentOpened() {
      try {
        const directories = await invoke<DirectoryInfo[]>(
          'get_recent_directories',
        )

        const processed = await processDirectories(directories)

        setRecentOpened(processed)
      } catch (err) {
        const { code } = err as DirectoryError
        if (code === ERROR_CODES.STORE_READ_ERROR) {
          queue.add({
            title: 'Failed to load recent directories.',
          })
        }
      }
    }

    loadRecentOpened()
  }, [])

  async function handleDirectoryPick(directory: DirectoryInfo) {
    try {
      // TODO: change command name; not really the most descriptive name
      const resp = await invoke<SearchResult>('search_tree', {
        path: directory.path,
      })

      setDirectory(directory)
      setTree(resp.results)
      setFilteredTree(resp.results)
      invoke('add_recent_directory', { directory })
    } catch (err) {
      const e = err as DirectoryError
      if (e && e.code === ERROR_CODES.DIRECTORY_READ_ERROR) {
        queue.add({
          title: `Error reading directory ${e.directory_name ?? ''}`,
        })
      }
    }
  }

  return (
    <main className="min-h-screen h-full justify-center items-center flex bg-background-dark">
      <div className="flex flex-col max-w-72 gap-8">
        <DirectoryPickerButton onPick={handleDirectoryPick} />

        {recentOpened.length > 0 && (
          <ul role="list" className="flex flex-col gap-3">
            {recentOpened.map((dir) => (
              <li
                role="button"
                tabIndex={0}
                onClick={() => handleDirectoryPick(dir)}
                key={`${dir.path}|${dir.name}`}
                className="relative flex items-center cursor-pointer group"
              >
                <div className="flex flex-col">
                  <h2 className="text-sm text-text-dark group-hover:text-text-light">
                    {dir.name}
                  </h2>
                  <span className="text-xs text-text-dark group-hover:text-text-light whitespace-nowrap">
                    {dir.prettyPath}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
