import { useState } from 'react'

export type Id = string | number

export interface FileNode {
  id: Id
  title: string
  tokenCount?: number
  tokenPercentage?: number
}

interface TokenChartProps {
  files: FileNode[]
  totalTokenCount: number
}

const colors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#a855f7', // purple
  '#3b82f6', // blue
  '#10b981', // green
  '#6b7280', // gray for "other"
]

const FILES_TO_DISPLAY_COUNT = 6

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
    0
  )
  const otherPercentage =
    remainingTokens > 0
      ? Math.ceil((remainingTokens / totalTokenCount) * 100)
      : 0

  const chartData = [...topFiles]
  if (otherPercentage > 0) {
    chartData.push({
      id: 'other',
      title: 'other',
      tokenCount: remainingTokens,
      percentage: otherPercentage,
    })
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="w-full mx-auto">
      <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden mb-3">
        {chartData.map((file, index) => (
          <div
            key={file.id}
            className="absolute top-0 h-full transition-all duration-300 cursor-pointer"
            style={{
              backgroundColor: colors[index],
              left: `${chartData
                .slice(0, index)
                .reduce((sum, f) => sum + f.percentage, 0)}%`,
              width: `${file.percentage}%`,
              opacity:
                hoveredIndex !== null && hoveredIndex !== index ? 0.3 : 1,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {chartData.map((file, index) => (
          <div
            key={file.id}
            className="flex items-center gap-2 cursor-pointer transition-opacity duration-300"
            style={{
              opacity:
                hoveredIndex !== null && hoveredIndex !== index ? 0.3 : 1,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: colors[index] }}
            />
            <span className="text-gray-300">
              {file.title} ({file.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
