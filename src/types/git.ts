interface GitChange {
  path: string
  changeType: string
  linesAdded: number
  linesDeleted: number
}

type GitStatusResult = GitChange[] | null
