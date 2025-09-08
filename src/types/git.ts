interface GitChange {
  path: string
  changeType: string
}

type GitStatusResult = GitChange[] | null
