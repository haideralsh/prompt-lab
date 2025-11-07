import { Dispatch, SetStateAction, useEffect } from 'react'
import { DirectoryInfo } from '@/types/directory-info'
import { getGitStatus } from '@/api/git'
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
        const changes = await getGitStatus({
          directoryPath: directory.path,
        })

        if (changes === null) {
          onGitStatusUpdate(() => null)
        } else {
          onGitStatusUpdate((prev) => {
            if (!prev || prev.results.length === 0) return changes
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
