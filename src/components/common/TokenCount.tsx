interface TokenCountProps {
  count: number | null | undefined
}

export function TokenCount({ count }: TokenCountProps) {
  return (
    <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm uppercase group-hover:text-text-dark group-hover:border-border-light">
      {count?.toLocaleString() ?? '-'}
    </span>
  )
}
