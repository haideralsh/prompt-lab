type Id = string

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
  id: Id
  title: string
}

export interface SelectionResult {
  selected: Id[]
  indeterminate: Id[]
  selectedFiles: FileNode[]
}

export interface DirectoryError {
  code: number
  directory_name?: string
}
