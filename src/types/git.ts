interface GitChange {
  path: string
  changeType: string
  linesAdded: number
  linesDeleted: number
  tokenCount: number
}

type GitStatusResult = GitChange[] | null
