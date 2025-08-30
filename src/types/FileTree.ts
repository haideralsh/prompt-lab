type Id = string

export type Tree = TreeNode[]

export interface TreeNode {
  id: Id
  title: string
  type: 'directory' | 'file'
  children: TreeNode[]
}

export interface FileSystemItem {
  id: Id
  title: string
  type: 'directory' | 'file'
  children: FileSystemItem[]
}

export interface SearchMatch {
  matchedIdsCount: number
  results: TreeNode[]
}

export interface DirectoryError {
  code: number
  directory_name?: string
}
