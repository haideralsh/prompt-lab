import { useState } from 'react'
import { FileNode } from '../types/FileTree'

interface ChartDataItem {
  path: string
  prettyPath: string
  title: string
  tokenCount?: number
  actualPercentage: number
  displayWidth: number
  normalizedWidth: number
}

interface TokenChartProps {
  files: FileNode[]
  totalFilesTokenCount: number
}

const colors = [
  'var(--color-visualize-1)',
  'var(--color-visualize-2)',
  'var(--color-visualize-3)',
  'var(--color-visualize-4)',
  'var(--color-visualize-5)',
  'var(--color-visualize-6)',
  'var(--color-visualize-7)',
  'var(--color-visualize-other)', // other
]

const FILES_TO_DISPLAY_COUNT = 11 - 4 // still deciding the number of files to display

const MIN_VISIBLE_WIDTH = 0.5

export default function TokenChart({
  files,
  totalFilesTokenCount,
}: TokenChartProps) {
  const topFiles = files.slice(0, FILES_TO_DISPLAY_COUNT).map((file) => ({
    ...file,
    actualPercentage: file.tokenCount
      ? (file.tokenCount / totalFilesTokenCount) * 100
      : 0,
  }))

  const remainingFiles = files.slice(FILES_TO_DISPLAY_COUNT)
  const remainingTokens = remainingFiles.reduce(
    (sum, file) => sum + (file.tokenCount || 0),
    0,
  )
  const otherActualPercentage =
    remainingTokens > 0 ? (remainingTokens / totalFilesTokenCount) * 100 : 0

  const chartData = [...topFiles]
  if (otherActualPercentage > 0) {
    chartData.push({
      path: 'PROMPTLAB_OTHER_CATAGORY_KEY',
      prettyPath: 'PROMPTLAB_OTHER_CATAGORY_KEY',
      title: 'other',
      tokenCount: remainingTokens,
      actualPercentage: otherActualPercentage,
    })
  }

  const getAdjustedWidths = (): ChartDataItem[] => {
    let adjustedData = chartData.map((file) => ({
      ...file,
      displayWidth: Math.max(file.actualPercentage, MIN_VISIBLE_WIDTH),
      normalizedWidth: 0,
    }))

    const totalDisplayWidth = adjustedData.reduce(
      (sum, file) => sum + file.displayWidth,
      0,
    )

    adjustedData = adjustedData.map((file) => ({
      ...file,
      normalizedWidth:
        totalDisplayWidth > 0
          ? (file.displayWidth / totalDisplayWidth) * 100
          : 0,
    }))

    return adjustedData
  }

  const finalData = getAdjustedWidths()

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="w-full mx-auto">
      <div className="relative h-1.5 bg-interactive-dark rounded-full overflow-hidden mb-2">
        {finalData.map((file, index) => (
          <div
            key={file.path}
            className="absolute top-0 h-full transition-all duration-300 cursor-pointer ease-linear"
            style={{
              backgroundColor: colors[index],
              left: `${finalData
                .slice(0, index)
                .reduce((sum, f) => sum + f.normalizedWidth, 0)}%`,
              width: `${file.normalizedWidth}%`,
              borderRight:
                index !== finalData.length - 1
                  ? '3px solid var(--color-background-dark)'
                  : undefined,
              opacity:
                hoveredIndex !== null && hoveredIndex !== index ? 0.3 : 1,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {finalData.map((file, index) => (
          <div
            key={file.path}
            className="flex items-center gap-1.5 cursor-pointer transition-opacity duration-300"
            style={{
              opacity:
                hoveredIndex !== null && hoveredIndex !== index ? 0.3 : 1,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="size-2 rounded-full"
              style={{ backgroundColor: colors[index] }}
            />
            <span className="text-text-light">
              {file.title} ({file.actualPercentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
