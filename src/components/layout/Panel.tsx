import { ReactNode } from 'react'
import {
  Button,
  Checkbox,
  Disclosure,
  DisclosurePanel,
  Heading,
} from 'react-aria-components'
import {
  CheckIcon,
  MinusIcon,
  TriangleDownIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons'
import { TokenCount } from '../common/token-count'

export interface PanelDisclosureProps {
  id: string
  label: string
  count: number
  tokenCount: number
  children: ReactNode
  actions: ReactNode
  panelClassName?: string
  headingClassName?: string
  iconClassName?: string
  isGroupSelected: boolean
  isGroupIndeterminate: boolean
  onSelectAll: (() => void) | boolean
  onDeselectAll: () => void
}

export function Panel({
  id,
  label,
  count,
  children,
  panelClassName,
  headingClassName,
  iconClassName,
  isGroupSelected,
  isGroupIndeterminate,
  onSelectAll,
  onDeselectAll,
  actions,
  tokenCount,
}: PanelDisclosureProps) {
  const resolvedIconClass =
    iconClassName === undefined ? 'size-4' : iconClassName

  function handleSelectionChange(selected: boolean) {
    if (selected) {
      if (typeof onSelectAll === 'function') onSelectAll()
    } else onDeselectAll()
  }

  const shouldDisableGroupCheckbox =
    onSelectAll === false && (count === 0 || !isGroupSelected)

  return (
    <Disclosure id={id} className="-mx-2 mb-0.5">
      {({ isExpanded }) => (
        <>
          <Button
            slot="trigger"
            className="flex w-full items-center gap-1 cursor-pointer sticky top-0 px-2 py-1.5 bg-interactive-dark z-10"
          >
            <Heading
              className={`flex justify-between w-full group ${
                headingClassName ?? ''
              }`}
            >
              <div className="flex items-center gap-1 text-xs text-text-dark">
                <Checkbox
                  isSelected={isGroupSelected}
                  isIndeterminate={isGroupIndeterminate}
                  onChange={handleSelectionChange}
                  isDisabled={shouldDisableGroupCheckbox}
                  className="relative flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light flex-shrink-0 hover:bg-accent-interactive-dark data-[disabled]:border-interactive-light data-[disabled]:hover:bg-transparent"
                >
                  {isGroupSelected && <CheckIcon />}
                  {isGroupIndeterminate && <MinusIcon />}
                </Checkbox>
                {isExpanded ? (
                  <TriangleDownIcon className={resolvedIconClass} />
                ) : (
                  <TriangleRightIcon className={resolvedIconClass} />
                )}
                <span className="flex items-center gap-3 uppercase font-medium tracking-wide text-xs">
                  <span>{label}</span>
                  <span className="text-solid-dark">{count}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                  {actions}
                </span>
                <TokenCount count={tokenCount} showLabel />
              </div>
            </Heading>
          </Button>
          <DisclosurePanel>
            <div className={`${panelClassName} bg-background-light`}>
              {children}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}
