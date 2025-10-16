export type Id = string

export type Tree = TreeNode[]

export interface TreeNode {
  id: Id
  title: string
  type: 'directory' | 'file'
  children: TreeNode[]
}

export interface SearchResult {
  matchedIdsCount: number
  results: TreeNode[]
}

export interface FileNode {
  path: Id
  title: string
  tokenCount?: number
  tokenPercentage?: number
  prettyPath: string
}

export interface SelectionResult {
  selectedNodesPaths: Id[]
  indeterminateNodesPaths: Id[]
  selectedFiles: FileNode[]
}

export type TreeDisplayMode = 'full' | 'selected' | 'none'

export const treeDisplayModes: Set<TreeDisplayMode> = new Set([
  'selected',
  'full',
  'none',
])
