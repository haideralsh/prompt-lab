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
