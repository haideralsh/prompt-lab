import { invoke } from '@tauri-apps/api/core'

export interface SavedPageMetadata {
  title: string
  url: string
  tokenCount: number
  faviconPath?: string | null
}

export type SavedPages = readonly SavedPageMetadata[]

export async function listSavedPages(directoryPath: string) {
  return await invoke<SavedPages>('list_saved_pages', { directoryPath })
}

export async function savePageAsMd(params: {
  directoryPath: string
  url: string
}) {
  return await invoke<SavedPageMetadata>('save_page_as_md', params)
}

export async function deleteSavedPage(params: {
  directoryPath: string
  url: string
}) {
  await invoke<void>('delete_saved_page', params)
}

export async function editSavedPage(params: {
  directoryPath: string
  url: string
  newTitle: string
}) {
  await invoke<void>('edit_saved_page', params)
}
