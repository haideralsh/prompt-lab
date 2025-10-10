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
import { TokenCount } from '../common/TokenCount'

interface PanelDisclosureProps {
  id: string
  label: string
  count: number
  tokenCount: number
  children: ReactNode
  endActions: ReactNode
  titleActions?: ReactNode
  panelClassName?: string
  headingClassName?: string
  iconClassName?: string
  isGroupSelected: boolean
  isGroupIndeterminate: boolean
  onSelectAll: (() => void) | boolean
  onDeselectAll: () => void
}

const PANEL_CLASS_NAME = 'border-b border-interactive-mid -mx-2'
const TRIGGER_BUTTON_CLASS =
  'flex w-full items-center gap-1 cursor-pointer sticky top-0 px-2 py-1.5 bg-background-light'

const HEADER_CHECKBOX_CLASS =
  'relative flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light flex-shrink-0 hover:bg-accent-interactive-dark data-[disabled]:border-interactive-light data-[disabled]:hover:bg-transparent'
const TITLE_CLASS =
  'flex items-center gap-3 uppercase font-medium tracking-wide text-xs'
const PANEL_CONTENT_CLASS = 'pb-4'

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
  endActions,
  titleActions,
  tokenCount,
}: PanelDisclosureProps) {
  const resolvedIconClass =
    iconClassName === undefined ? 'size-4' : iconClassName
  const resolvedPanelClass = panelClassName ?? PANEL_CONTENT_CLASS

  function handleSelectionChange(selected: boolean) {
    if (selected) {
      if (typeof onSelectAll === 'function') onSelectAll()
    } else onDeselectAll()
  }

  const shouldDisableGroupCheckbox =
    onSelectAll === false && (count === 0 || !isGroupSelected)

  return (
    <Disclosure id={id} className={PANEL_CLASS_NAME}>
      {({ isExpanded }) => (
        <>
          <Button slot="trigger" className={TRIGGER_BUTTON_CLASS}>
            <Heading className="flex justify-between w-full group">
              <div className="flex items-center gap-1 text-xs text-text-dark">
                <Checkbox
                  isSelected={isGroupSelected}
                  isIndeterminate={isGroupIndeterminate}
                  onChange={handleSelectionChange}
                  isDisabled={shouldDisableGroupCheckbox}
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
                  <span className="flex items-center gap-1.5">
                    <span>{label}</span>
                  </span>
                  <span className="text-solid-dark">{count}</span>
                  {titleActions}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                  {endActions}
                </span>
                <TokenCount count={tokenCount} />
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
