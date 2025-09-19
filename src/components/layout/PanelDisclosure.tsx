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
  TriangleDownIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons'

interface PanelDisclosureProps {
  id: string
  label: string
  count: number
  children: ReactNode
  panelClassName?: string
  headingClassName?: string
  iconClassName?: string
}

const PANEL_CLASS_NAME = 'border-b border-interactive-mid -mx-2'
const TRIGGER_BUTTON_CLASS =
  'flex w-full items-center gap-1 cursor-pointer sticky top-0 px-2 py-2 bg-background-light'
const HEADING_DEFAULT_CLASS = 'flex items-center gap-1 text-xs text-text-dark'
const HEADER_CHECKBOX_CLASS =
  'flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light flex-shrink-0 hover:bg-accent-interactive-dark'
const TITLE_CLASS = 'uppercase font-medium tracking-wide text-xs'
const PANEL_CONTENT_CLASS = 'pl-[calc(15px+var(--spacing)*2)] pb-4'

export function PanelDisclosure({
  id,
  label,
  count,
  children,
  panelClassName,
  headingClassName,
  iconClassName,
}: PanelDisclosureProps) {
  const resolvedHeadingClass = headingClassName ?? HEADING_DEFAULT_CLASS
  const resolvedIconClass =
    iconClassName === undefined ? 'size-4' : iconClassName
  const resolvedPanelClass = panelClassName ?? PANEL_CONTENT_CLASS

  return (
    <Disclosure id={id} className={PANEL_CLASS_NAME}>
      {({ isExpanded }) => (
        <>
          <Button slot="trigger" className={TRIGGER_BUTTON_CLASS}>
            <Heading className={resolvedHeadingClass}>
              <Checkbox
                slot="selection"
                defaultSelected
                className={HEADER_CHECKBOX_CLASS}
              >
                {({ isSelected }) => isSelected && <CheckIcon />}
              </Checkbox>
              {isExpanded ? (
                <TriangleDownIcon className={resolvedIconClass} />
              ) : (
                <TriangleRightIcon className={resolvedIconClass} />
              )}
              <span className={TITLE_CLASS}>
                {label} ({count})
              </span>
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
