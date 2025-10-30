import { invoke } from '@tauri-apps/api/core'
import { Tree, Id, SelectionResult, TreeDisplayMode } from '../types/file-tree'

export async function toggleSelection(params: {
  directoryPath: string
  current: string[]
  nodePath: Id
  treeDisplayMode: TreeDisplayMode
  fullTree: Tree | null
}) {
  return await invoke<SelectionResult>('toggle_selection', params)
}

export async function clearSelection(params: {
  directoryPath: string
  treeDisplayMode: TreeDisplayMode
  fullTree: Tree | null
}) {
  return await invoke<SelectionResult>('clear_selection', params)
}

export async function openWithEditor(params: { path: string }) {
  await invoke('open_with_editor', params)
}

export async function countRenderedTreeTokens(params: {
  treeDisplayMode: TreeDisplayMode
  fullTree: Tree | null
  selectedNodes: string[]
}) {
  return await invoke<number>('count_rendered_tree_tokens', params)
}
