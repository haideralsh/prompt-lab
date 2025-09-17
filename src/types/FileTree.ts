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
}

export interface SelectionResult {
  selectedNodesPaths: Id[]
  indeterminateNodesPaths: Id[]
  selectedFiles: FileNode[]
}

export interface DirectoryError {
  code: number
  directory_name?: string
}

export type TreeMode = 'selected' | 'full' | 'none' | undefined
