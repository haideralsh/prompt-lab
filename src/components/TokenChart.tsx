import { useState } from 'react'
import { FileNode } from '../types/FileTree'

interface TokenChartProps {
  files: FileNode[]
  totalTokenCount: number
}

const colors = [
  '#2F6E7F',
  '#7EA9EC',
  '#7545F3',
  '#A86CD9',
  '#A74091',
  '#E8926B',
  '#8C873E',
  // '#70C5DF',
  // '#3D78C2',
  // '#BEAFFA',
  // '#953CD2',
  '#A7A7AD', // other
]

const FILES_TO_DISPLAY_COUNT = 11 - 4 // still deciding the number of files to display

export default function TokenChart({
  files,
  totalTokenCount,
}: TokenChartProps) {
  const topFiles = files.slice(0, FILES_TO_DISPLAY_COUNT).map((file) => ({
    ...file,
    percentage: file.tokenCount
      ? Math.ceil((file.tokenCount / totalTokenCount) * 100)
      : 0,
  }))

  const remainingFiles = files.slice(FILES_TO_DISPLAY_COUNT)
  const remainingTokens = remainingFiles.reduce(
    (sum, file) => sum + (file.tokenCount || 0),
    0,
  )
  const otherPercentage =
    remainingTokens > 0
      ? Math.ceil((remainingTokens / totalTokenCount) * 100)
      : 0

  const chartData = [...topFiles]
  if (otherPercentage > 0) {
    chartData.push({
      path: 'CONTEXTER_OTHER_CATAGORY_KEY',
      title: 'other',
      tokenCount: remainingTokens,
      percentage: otherPercentage,
    })
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="w-full mx-auto">
      <div className="relative h-1.5 bg-interactive-dark rounded-full overflow-hidden mb-2">
        {chartData.map((file, index) => (
          <div
            key={file.path}
            className="absolute top-0 h-full transition-all duration-300 cursor-pointer ease-linear"
            style={{
              backgroundColor: colors[index],
              left: `${chartData
                .slice(0, index)
                .reduce((sum, f) => sum + f.percentage, 0)}%`,
              width: `${file.percentage}%`,
              borderRight:
                index !== chartData.length - 1
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
        {chartData.map((file, index) => (
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
              {file.title} ({file.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
