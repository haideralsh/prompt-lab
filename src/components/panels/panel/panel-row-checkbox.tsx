import { ReactNode } from 'react'
import { Checkbox } from 'react-aria-components'
import { CheckIcon } from '@radix-ui/react-icons'

export interface PanelRowCheckboxProps {
  value?: string
  isDisabled?: boolean
  defaultSelected?: boolean
  onChange?: (isSelected: boolean) => void
  className?: string
  children: ReactNode
  endActions?: ReactNode
}

export function PanelRowCheckbox({
  value,
  isDisabled,
  defaultSelected,
  onChange,
  className,
  children,
  endActions,
}: PanelRowCheckboxProps) {
  return (
    <Checkbox
      value={value}
      isDisabled={isDisabled}
      defaultSelected={defaultSelected}
      onChange={onChange}
      className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5 data-[hovered]:bg-accent-interactive-dark data-[disabled]:opacity-75 data-[disabled]:hover:bg-transparent ${
        className ?? ''
      }`}
    >
      {({ isSelected }) => (
        <>
          <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light flex-shrink-0">
            {isSelected && <CheckIcon />}
          </span>
          <span className="flex items-center gap-1.5 w-full min-w-0">
            {children}
          </span>
          <span>
            <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
              {endActions}
            </span>
          </span>
        </>
      )}
    </Checkbox>
  )
}
