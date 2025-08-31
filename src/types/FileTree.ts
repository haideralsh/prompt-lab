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

export interface SelectionResult {
  selected: Id[]
  indeterminate: Id[]
}

export interface DirectoryError {
  code: number
  directory_name?: string
}
