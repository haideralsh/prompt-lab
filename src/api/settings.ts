import { invoke } from '@tauri-apps/api/core'

export async function getEditor() {
  return await invoke<string | null>('get_editor')
}

export async function pickEditor() {
  return await invoke<string>('pick_editor')
}

export async function setEditor(params: { editorPath: string }) {
  await invoke<void>('set_editor', params)
}
