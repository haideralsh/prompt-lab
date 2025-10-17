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
      <BaseDialog.Popup className="fixed top-1/2 left-1/2 z-40 -mt-8 w-96 min-h-64 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-md bg-background-light p-4 text-text-light outline-1 outline-interactive-light transition-all duration-75 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 flex flex-col">
        <div className="flex flex-col gap-6 flex-grow">
          <BaseDialog.Title className="font-medium tracking-wide text-sm text-text-light">
            {title}
          </BaseDialog.Title>
          {description && (
            <BaseDialog.Description className="text-base text-text-dark">
              {description}
            </BaseDialog.Description>
          )}
          {children}
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <BaseDialog.Close className="text-xs tracking-wide flex items-center justify-center rounded-sm text-text-dark hover:text-text-light">
            Close
          </BaseDialog.Close>
        </div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}

export const Dialog = BaseDialog.Root
