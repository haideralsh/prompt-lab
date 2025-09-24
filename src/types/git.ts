interface GitChange {
  path: string
  changeType: string
  linesAdded: number
  linesDeleted: number
  tokenCount: number | null
  diffHash: string
}

type GitStatusResult = GitChange[] | null

interface GitTokenCountUpdate {
  path: string
  tokenCount: number
  diffHash: string
}

interface GitTokenCountsEvent {
  root: string
  files: GitTokenCountUpdate[]
}
