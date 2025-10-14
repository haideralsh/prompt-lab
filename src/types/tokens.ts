interface TokenCountResult {
  id: string
  tokenCount: number
  tokenPercentage: number
}

type TokenCountsEvent = {
  selectionId: string
  totalFilesTokenCount: number
  files: TokenCountResult[]
}
