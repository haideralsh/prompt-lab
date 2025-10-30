import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import TokenChart from '@/components/visualization/token-chart'
import { sortFilesByTokenCount } from '@/helpers/sort-files-by-token-count'
import { selectedFilesAtom, totalFilesTokenCountAtom } from '@/state/atoms'

export function Footer() {
  const selectedFiles = useAtomValue(selectedFilesAtom)
  const totalFilesTokenCount = useAtomValue(totalFilesTokenCountAtom)

  const sortedFiles = useMemo(() => {
    return sortFilesByTokenCount(selectedFiles)
  }, [selectedFiles])

  if (sortedFiles.length === 0) return null

  return (
    <div className="flex items-center justify-between gap-8 bg-background-dark p-3">
      <TokenChart
        files={sortedFiles}
        totalFilesTokenCount={totalFilesTokenCount}
      />
    </div>
  )
}
