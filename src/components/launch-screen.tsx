import { useEffect, useState } from 'react'
import { DirectoryPickerButton } from './directory-picker-button'
import type { DirectoryInfo } from '@/types/directory-info'
import { updateWindowTitle } from '@/helpers/update-window-title'
import {
  getRecentDirectories,
  searchTree,
  addRecentDirectory,
} from '@/api/directory'
import { ERROR_CODES } from '@/constants'
import { queue } from '@/components/toasts/toast-queue'
import { ApplicationError } from '@/helpers/get-error-message'
import { useSetAtom } from 'jotai'
import { directoryAtom, filteredTreeAtom, treeAtom } from '@/state/atoms'

export function LaunchScreen() {
  const [recentOpened, setRecentOpened] = useState<DirectoryInfo[]>([])
  const setTree = useSetAtom(treeAtom)
  const setDirectory = useSetAtom(directoryAtom)
  const setFilteredTree = useSetAtom(filteredTreeAtom)

  useEffect(() => {
    async function loadRecentOpened() {
      try {
        const directories = await getRecentDirectories()

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
      const resp = await searchTree({
        path: directory.path,
        forceRefresh: true,
      })

      setDirectory(directory)
      setTree(resp.results)
      setFilteredTree(resp.results)

      updateWindowTitle(
        directory.prettyPath ?? directory.name ?? directory.path,
      )
      addRecentDirectory({ directory })
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
    <main className="flex h-full min-h-screen items-center justify-center bg-background-dark">
      <div className="flex max-w-72 flex-col gap-8">
        <DirectoryPickerButton onPick={handleDirectoryPick} />

        {recentOpened.length > 0 && (
          <ul role="list" className="flex flex-col gap-3">
            {recentOpened.map((dir) => (
              <li
                role="button"
                tabIndex={0}
                onClick={() => handleDirectoryPick(dir)}
                key={`${dir.path}|${dir.name}`}
                className="group relative flex cursor-pointer items-center"
              >
                <div className="flex flex-col">
                  <h2 className="text-sm text-text-dark group-hover:text-text-light">
                    {dir.name}
                  </h2>
                  <span className="text-xs whitespace-nowrap text-text-dark group-hover:text-text-light">
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
