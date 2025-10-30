import { invoke } from '@tauri-apps/api/core'
import type { DirectoryInfo } from '@/types/directory-info'
import type { SearchResult } from '@/types/file-tree'

export async function pickDirectory() {
  return await invoke<DirectoryInfo | null>('pick_directory')
}

export async function getRecentDirectories() {
  return await invoke<DirectoryInfo[]>('get_recent_directories')
}

export async function addRecentDirectory(params: { directory: DirectoryInfo }) {
  await invoke<void>('add_recent_directory', params)
}

export async function searchTree(params: { path: string; query?: string }) {
  const { path, query } = params
  return await invoke<SearchResult>(
    'search_tree',
    query !== undefined ? { path, query } : { path }
  )
}
