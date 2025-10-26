import { useEffect, useState } from 'react'
import { DirectoryPickerButton } from './DirectoryPickerButton'
import type { DirectoryInfo } from '../types/DirectoryInfo'
import { invoke } from '@tauri-apps/api/core'
import { updateWindowTitle } from './sidebar/update-window-title'
import { ERROR_CODES } from '../constants'
import type { SearchResult } from '../types/FileTree'
import { queue } from '@/components/toasts/toast-queue'
import { ApplicationError } from '../helpers/getErrorMessage'
import { useSetAtom } from 'jotai'
import { directoryAtom, filteredTreeAtom, treeAtom } from '../state/atoms'

export function LaunchScreen() {
  const [recentOpened, setRecentOpened] = useState<DirectoryInfo[]>([])
  const setTree = useSetAtom(treeAtom)
  const setDirectory = useSetAtom(directoryAtom)
  const setFilteredTree = useSetAtom(filteredTreeAtom)

  useEffect(() => {
    async function loadRecentOpened() {
      try {
        const directories = await invoke<DirectoryInfo[]>(
          'get_recent_directories'
        )

        setRecentOpened(directories)
      } catch (err) {
        const { code } = err as ApplicationError
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
      const resp = await invoke<SearchResult>('search_tree', {
        path: directory.path,
      })

      setDirectory(directory)
      setTree(resp.results)
      setFilteredTree(resp.results)

      updateWindowTitle(
        directory.prettyPath ?? directory.name ?? directory.path
      )
      invoke('add_recent_directory', { directory })
    } catch (err) {
      const e = err as ApplicationError
      if (e && e.code === ERROR_CODES.DIRECTORY_READ_ERROR) {
        queue.add({
          title: `Error reading directory ${e.message ?? ''}`,
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
