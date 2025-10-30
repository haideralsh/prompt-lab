import { Dispatch, SetStateAction, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { DirectoryInfo } from '@/types/directory-info'
import { GitStatusResult } from '@/types/git'
import { mergeTokenCountsWithPrevious } from '../lib'

export function useInquireGitStatus(
  directory: DirectoryInfo,
  onGitStatusUpdate: Dispatch<SetStateAction<GitStatusResult | null>>
) {
  useEffect(() => {
    async function inquireGitStatus() {
      if (!directory.path) return

      try {
        const changes = await invoke<GitStatusResult | null>('get_git_status', {
          directoryPath: directory.path,
        })

        if (changes === null) {
          onGitStatusUpdate(() => null)
        } else {
          onGitStatusUpdate((prev) => {
            if (!prev || prev.length === 0) return changes
            return mergeTokenCountsWithPrevious(changes, prev)
          })
        }
      } catch (error) {
        onGitStatusUpdate(() => null)
      }
    }

    void inquireGitStatus()
  }, [directory.path])
}
