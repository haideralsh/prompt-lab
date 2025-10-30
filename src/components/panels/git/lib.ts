import { invoke } from '@tauri-apps/api/core'
import { GitStatusResult } from '../../../types/git'
import { DirectoryInfo } from '@/types/directory-info'

export function mergeTokenCountsWithPrevious(
  incoming: GitStatusResult,
  previous: GitStatusResult
): GitStatusResult {
  if (previous.length === 0) return incoming

  const previousTokenCounts = new Map(
    previous
      .filter((change) => change.tokenCount != null)
      .map((change) => [change.path, change.tokenCount as number])
  )

  if (previousTokenCounts.size === 0) {
    return incoming
  }

  let didUpdate = false

  const merged = incoming.map((change) => {
    if (change.tokenCount != null) return change
    const previousTokenCount = previousTokenCounts.get(change.path)
    if (previousTokenCount == null) return change
    didUpdate = true
    return { ...change, tokenCount: previousTokenCount }
  })

  return didUpdate ? merged : incoming
}

export async function copyDiffsToClipboard(
  directory: DirectoryInfo,
  content: string | string[] | Set<string>
) {
  const paths = typeof content === 'string' ? [content] : Array.from(content)

  await invoke<void>('copy_diffs_to_clipboard', {
    directoryPath: directory.path,
    paths,
  })
}
