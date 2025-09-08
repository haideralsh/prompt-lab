interface TokenCountResult {
  id: string
  tokenCount: number
  tokenPercentage: number
}

type TokenCountsEvent = {
  selectionId: string
  totalTokenCount: number
  files: TokenCountResult[]
}
