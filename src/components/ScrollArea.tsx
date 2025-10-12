import { ScrollArea as BaseUiScrollArea } from '@base-ui-components/react/scroll-area'

export function ScrollArea({ children }: React.PropsWithChildren) {
  return (
    <BaseUiScrollArea.Root className="h-full">
      <BaseUiScrollArea.Viewport className="h-full overscroll-contain">
        {children}
      </BaseUiScrollArea.Viewport>
      <BaseUiScrollArea.Scrollbar className="z-20 m-1 flex w-1 justify-center rounded opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[hovering]:duration-75 data-[scrolling]:opacity-100 data-[scrolling]:delay-0 data-[scrolling]:duration-75">
        <BaseUiScrollArea.Thumb className="w-full rounded bg-border-mid" />
      </BaseUiScrollArea.Scrollbar>
    </BaseUiScrollArea.Root>
  )
}
