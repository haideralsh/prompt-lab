import { Button } from 'react-aria-components'
import { ComponentProps } from 'react'

export function GhostButton({
  children,
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={`text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark data-[disabled]:text-text-dark/60 hover:text-text-light ${className || ''}`}
      {...props}
    >
      {children}
    </Button>
  )
}
