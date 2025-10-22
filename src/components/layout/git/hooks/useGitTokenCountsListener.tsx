import { UnlistenFn } from '@tauri-apps/api/event'
import { useEffect, Dispatch, SetStateAction } from 'react'
import { listen } from '@tauri-apps/api/event'
import { GitStatusResult, GitTokenCountsEvent } from '@/types/git'
import { DirectoryInfo } from '@/types/DirectoryInfo'

export function useGitTokenCountsListener(
  directory: DirectoryInfo,
  onGitStatusUpdate: Dispatch<SetStateAction<GitStatusResult | null>>
) {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined

    async function listenToGitTokenCounts() {
      unlisten = await listen<GitTokenCountsEvent>(
        'git-token-counts',
        (event) => {
          if (event.payload.root !== directory.path) return

          onGitStatusUpdate((prev) => {
            if (!prev || prev.length === 0) return prev

            let didUpdate = false

            const next = prev.map((change) => {
              const tokenCount = event.payload.files[change.path]
              if (tokenCount == null) return change
              if (change.tokenCount === tokenCount) return change
              didUpdate = true
              return { ...change, tokenCount }
            })

            return didUpdate ? next : prev
          })
        }
      )
    }

    void listenToGitTokenCounts()

    return () => {
      if (unlisten) unlisten()
    }
  }, [directory.path])
}
