import { PlusIcon } from '@radix-ui/react-icons'
import { useSidebarContext } from '../Sidebar/SidebarContext'

export function Tabs() {
  const { directory } = useSidebarContext()
  const label = directory?.name ?? 'Overview'

  return (
    <div
      role="tablist"
      className="relative z-0 flex items-center gap-2 px-1 bg-interactive-dark"
      data-orientation="horizontal"
      data-activation-direction="left"
    >
      <Tab>{label}</Tab>
      <NewTab />
    </div>
  )
}

function Tab(props: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected
      data-selected
      tabIndex={0}
      className={`flex items-center justify-center px-3 py-1.5 border-0 text-xs font-medium whitespace-nowrap bg-background-dark text-text-light outline-none select-none hover:text-text-light focus-visible:relative ${props.className}`}
      {...props}
    >
      {props.children}
    </button>
  )
}

function NewTab() {
  return (
    <Tab className="px-0 text-text-dark">
      <PlusIcon />
    </Tab>
  )
}
