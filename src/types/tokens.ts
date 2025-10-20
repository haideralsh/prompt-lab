interface TokenCountResult {
  id: string
  tokenCount: number
  tokenPercentage: number
}

type TokenCountsEvent = {
  selectionId: string
  totalFilesTokenCount: number
  totalTreeTokenCount?: number
  files: TokenCountResult[]
}
