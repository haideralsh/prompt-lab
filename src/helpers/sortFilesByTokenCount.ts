import type { FileNode } from '../types/FileTree'

export function sortFilesByTokenCount(files: FileNode[]) {
  return files.sort((a, b) => {
    if (a.tokenCount == null && b.tokenCount == null) {
      return a.title.localeCompare(b.title)
    }
    if (a.tokenCount == null) return 1
    if (b.tokenCount == null) return -1

    const countDiff = b.tokenCount - a.tokenCount
    if (countDiff !== 0) return countDiff

    return a.title.localeCompare(b.title)
  })
}
