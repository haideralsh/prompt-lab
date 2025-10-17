import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import { ComponentProps, ReactNode } from 'react'

export function DialogTrigger({
  children,
  ...props
}: ComponentProps<typeof BaseDialog.Trigger>) {
  return <BaseDialog.Trigger {...props}>{children}</BaseDialog.Trigger>
}

interface DialogContentProps {
  title: string
  description?: string
  children?: ReactNode
}

export function DialogContent({
  title,
  description,
  children,
}: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-40 min-h-dvh bg-background-dark opacity-80 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 supports-[-webkit-touch-callout:none]:absolute" />
      <BaseDialog.Popup className="fixed top-1/2 left-1/2 z-40 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-background-light p-6 text-text-light outline-1 outline-interactive-light transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
        <BaseDialog.Title className="-mt-1.5 mb-1 text-sm font-medium">
          {title}
        </BaseDialog.Title>
        {description && (
          <BaseDialog.Description className="mb-6 text-base text-text-dark">
            {description}
          </BaseDialog.Description>
        )}
        {children}
        <div className="flex justify-end gap-4">
          <BaseDialog.Close className="flex h-10 items-center justify-center rounded-sm border border-border-mid bg-interactive-light px-3.5 text-base font-medium text-text-light select-none hover:bg-interactive-mid focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent-border-light active:bg-interactive-dark">
            Close
          </BaseDialog.Close>
        </div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}

export const Dialog = BaseDialog.Root
