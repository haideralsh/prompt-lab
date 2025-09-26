interface GitChange {
  path: string
  changeType: string
  linesAdded: number
  linesDeleted: number
  tokenCount?: number | null
}

export type GitStatusResult = GitChange[]

export interface GitTokenCountsEvent {
  root: string
  files: Record<string, number>
}

export type GitStatusUpdatedEvent = {
  root: string
  changes: GitChange[]
}
