import { UnlistenFn } from '@tauri-apps/api/event'
import { useEffect, Dispatch, SetStateAction } from 'react'
import { listen } from '@tauri-apps/api/event'
import { GitStatusResult, GitStatusUpdatedEvent } from '@/types/git'
import { DirectoryInfo } from '@/types/directory-info'
import { mergeTokenCountsWithPrevious } from '../lib'
import { watchDirectoryForGitChanges } from '@/api/git'

export function useGitStatusListener(
  directory: DirectoryInfo,
  onGitStatusUpdate: Dispatch<SetStateAction<GitStatusResult | null>>,
) {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined

    async function listenToGitStatus() {
      await watchDirectoryForGitChanges({
        directoryPath: directory.path,
      })

      unlisten = await listen<GitStatusUpdatedEvent>(
        'git-status-updated',
        (event) => {
          const { payload } = event
          if (payload.root !== directory.path) return

          onGitStatusUpdate((prev) => {
            if (!prev || prev.results.length === 0) {
              return { results: payload.results, truncated: payload.truncated }
            }
            return mergeTokenCountsWithPrevious(
              { results: payload.results, truncated: payload.truncated },
              prev,
            )
          })
        },
      )
    }

    void listenToGitStatus()

    return () => {
      if (unlisten) unlisten()
    }
  }, [directory.path])
}
