import { UnlistenFn } from '@tauri-apps/api/event'
import { useEffect, Dispatch, SetStateAction } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { GitStatusResult, GitStatusUpdatedEvent } from '@/types/git'
import { DirectoryInfo } from '@/types/directory-info'
import { mergeTokenCountsWithPrevious } from '../lib'

export function useGitStatusListener(
  directory: DirectoryInfo,
  onGitStatusUpdate: Dispatch<SetStateAction<GitStatusResult | null>>
) {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined

    async function listenToGitStatus() {
      await invoke<void>('watch_directory_for_git_changes', {
        directoryPath: directory.path,
      })

      unlisten = await listen<GitStatusUpdatedEvent>(
        'git-status-updated',
        (event) => {
          const { payload } = event
          if (payload.root !== directory.path) return

          onGitStatusUpdate((prev) => {
            if (!prev || prev.length === 0) return payload.changes
            return mergeTokenCountsWithPrevious(payload.changes, prev)
          })
        }
      )
    }

    void listenToGitStatus()

    return () => {
      if (unlisten) unlisten()
    }
  }, [directory.path])
}
