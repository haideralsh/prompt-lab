interface GitChange {
  path: string
  changeType: string
  linesAdded: number
  linesDeleted: number
  tokenCount?: number | null
}

export type GitStatusResult = {
  results: GitChange[]
  truncated: boolean
}

export interface GitTokenCountsEvent {
  root: string
  files: Record<string, number>
}

export type GitStatusUpdatedEvent = {
  root: string
  results: GitChange[]
  truncated: boolean
}
