interface TokenCountProps {
  count: number | null | undefined
}

export function TokenCount({ count }: TokenCountProps) {
  return (
    <span className="text-xs border px-1 rounded-sm uppercase text-text-dark border-border-mid">
      {count?.toLocaleString() ?? '-'}
    </span>
  )
}
