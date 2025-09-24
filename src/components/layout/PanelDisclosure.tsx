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

interface PanelDisclosureProps {
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
  onSelectAll: () => void
  onDeselectAll: () => void
}

const PANEL_CLASS_NAME = 'border-b border-interactive-mid -mx-2'
const TRIGGER_BUTTON_CLASS =
  'flex w-full items-center gap-1 cursor-pointer sticky top-0 px-2 py-2 bg-background-light'

const HEADER_CHECKBOX_CLASS =
  'flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light flex-shrink-0 hover:bg-accent-interactive-dark'
const TITLE_CLASS =
  'flex items-baseline gap-1.5 uppercase font-medium tracking-wide text-xs'
const PANEL_CONTENT_CLASS = 'pl-[calc(15px+var(--spacing)*2)] pb-4'

export function PanelDisclosure({
  id,
  label,
  count,
  children,
  panelClassName,
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
  const resolvedPanelClass = panelClassName ?? PANEL_CONTENT_CLASS

  function handleSelectionChange(selected: boolean) {
    if (selected) onSelectAll()
    else onDeselectAll()
  }

  return (
    <Disclosure id={id} className={PANEL_CLASS_NAME}>
      {({ isExpanded }) => (
        <>
          <Button slot="trigger" className={TRIGGER_BUTTON_CLASS}>
            <Heading className="flex justify-between w-full group">
              <div className="flex items-center gap-1 text-xs text-text-dark">
                <Checkbox
                  slot="selection"
                  isSelected={isGroupSelected}
                  isIndeterminate={isGroupIndeterminate}
                  onChange={handleSelectionChange}
                  className={HEADER_CHECKBOX_CLASS}
                >
                  {isGroupSelected && <CheckIcon />}
                  {isGroupIndeterminate && <MinusIcon />}
                </Checkbox>
                {isExpanded ? (
                  <TriangleDownIcon className={resolvedIconClass} />
                ) : (
                  <TriangleRightIcon className={resolvedIconClass} />
                )}
                <span className={TITLE_CLASS}>
                  <span>{label}</span>
                  <span className="bg-interactive-light px-1.5 rounded-sm text-xs font-normal">
                    {count}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                  {actions}
                </span>
                <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm uppercase mr-2">
                  {tokenCount && tokenCount.toLocaleString()}
                </span>
              </div>
            </Heading>
          </Button>
          <DisclosurePanel className={resolvedPanelClass}>
            {children}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}
