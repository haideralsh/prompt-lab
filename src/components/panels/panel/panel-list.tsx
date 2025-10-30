import { ReactNode } from 'react'
import { CheckboxGroup } from 'react-aria-components'

export interface PanelListProps {
  ariaLabel: string
  selectedValues?: Set<string>
  onChangeSelectedValues?: (values: Set<string>) => void
  className?: string
  children: ReactNode
}

export function PanelList({
  ariaLabel,
  selectedValues,
  onChangeSelectedValues,
  className = 'text-sm text-text-dark',
  children,
}: PanelListProps) {
  const list = <ul className={className}>{children}</ul>

  if (selectedValues && onChangeSelectedValues) {
    return (
      <CheckboxGroup
        aria-label={ariaLabel}
        value={Array.from(selectedValues)}
        onChange={(values) => {
          const set = new Set<string>(values as string[])
          onChangeSelectedValues(set)
        }}
      >
        {list}
      </CheckboxGroup>
    )
  }

  return list
}
