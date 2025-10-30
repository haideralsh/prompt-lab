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
import { TokenCount } from '../../common/token-count'

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
    <Disclosure id={id} className="-mx-2 mb-0.25">
      {({ isExpanded }) => (
        <>
          <Button
            slot="trigger"
            className="sticky top-0 z-10 flex w-full cursor-pointer items-center gap-1 bg-interactive-dark px-2 py-1.5"
          >
            <Heading
              className={`group flex w-full justify-between ${
                headingClassName ?? ''
              }`}
            >
              <div className="flex items-center gap-1 text-xs text-text-dark">
                <Checkbox
                  isSelected={isGroupSelected}
                  isIndeterminate={isGroupIndeterminate}
                  onChange={handleSelectionChange}
                  isDisabled={shouldDisableGroupCheckbox}
                  className="relative flex size-[15px] flex-shrink-0 items-center justify-center rounded-sm border border-border-light bg-transparent text-accent-text-light hover:bg-accent-interactive-dark data-[disabled]:border-interactive-light data-[disabled]:hover:bg-transparent data-[indeterminate]:border-accent-border-mid data-[indeterminate]:bg-accent-interactive-light data-[selected]:border-accent-border-mid data-[selected]:bg-accent-interactive-light"
                >
                  {isGroupSelected && <CheckIcon />}
                  {isGroupIndeterminate && <MinusIcon />}
                </Checkbox>
                {isExpanded ? (
                  <TriangleDownIcon className={resolvedIconClass} />
                ) : (
                  <TriangleRightIcon className={resolvedIconClass} />
                )}
                <span className="flex items-center gap-3 text-xs font-medium tracking-wide uppercase">
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
