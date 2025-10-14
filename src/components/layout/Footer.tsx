import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import TokenChart from '../TokenChart'
import { sortFilesByTokenCount } from '../../helpers/sortFilesByTokenCount'
import { selectedFilesAtom, totalFilesTokenCountAtom } from '../../state/atoms'

export function Footer() {
  const selectedFiles = useAtomValue(selectedFilesAtom)
  const totalFilesTokenCount = useAtomValue(totalFilesTokenCountAtom)

  const sortedFiles = useMemo(() => {
    return sortFilesByTokenCount(selectedFiles)
  }, [selectedFiles])

  if (sortedFiles.length === 0) return null

  return (
    <div className="flex p-3 gap-8 justify-between items-center bg-background-dark">
      <TokenChart
        files={sortedFiles}
        totalFilesTokenCount={totalFilesTokenCount}
      />
    </div>
  )
}
