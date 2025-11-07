import { GitStatusResult } from '@/types/git'

export function mergeTokenCountsWithPrevious(
  incoming: GitStatusResult,
  previous: GitStatusResult,
): GitStatusResult {
  if (previous.results.length === 0) return incoming

  const previousTokenCounts = new Map(
    previous.results
      .filter((change) => change.tokenCount != null)
      .map((change) => [change.path, change.tokenCount as number]),
  )

  if (previousTokenCounts.size === 0) {
    return incoming
  }

  let didUpdate = false

  const merged = incoming.results.map((change) => {
    if (change.tokenCount != null) return change
    const previousTokenCount = previousTokenCounts.get(change.path)
    if (previousTokenCount == null) return change
    didUpdate = true
    return { ...change, tokenCount: previousTokenCount }
  })

  return didUpdate
    ? { results: merged, truncated: incoming.truncated }
    : incoming
}
