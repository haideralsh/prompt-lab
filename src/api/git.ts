import { invoke } from '@tauri-apps/api/core'
import type { GitStatusResult } from '@/types/git'

export async function watchDirectoryForGitChanges(params: {
  directoryPath: string
}) {
  await invoke<void>('watch_directory_for_git_changes', params)
}

export async function getGitStatus(params: { directoryPath: string }) {
  return await invoke<GitStatusResult | null>('get_git_status', params)
}

export async function copyDiffsToClipboard(
  directoryPath: string,
  content: string | string[] | Set<string>,
) {
  const filePaths =
    typeof content === 'string' ? [content] : Array.from(content)

  await invoke<void>('copy_diffs_to_clipboard', {
    directoryPath: directoryPath,
    filePaths,
  })
}
