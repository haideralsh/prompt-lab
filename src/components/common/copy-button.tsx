import { forwardRef, useState } from 'react'
import { Button } from 'react-aria-components'
import { queue } from '@/components/toasts/toast-queue'
import { getErrorMessage } from '../../helpers/get-error-message'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'

interface CopyButtonProps extends React.ComponentProps<typeof Button> {
  onCopy: () => Promise<void>
  errorMessage?: string
  idleLabel?: string
  copiedLabel?: string
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      onCopy,
      errorMessage = 'Failed to copy to clipboard',
      idleLabel,
      copiedLabel,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false)

    const handlePress = async () => {
      try {
        await onCopy()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        queue.add({
          title: errorMessage,
          description: getErrorMessage(error),
        })
      }
    }

    return (
      <Button
        className="group"
        onPress={handlePress}
        ref={ref}
        isDisabled={copied}
        {...props}
      >
        <div className="flex items-center text-xs gap-1.25 text-text-dark hover:text-text-light group-data-[disabled]:hover:text-text-dark group-data-[disabled]:text-text-dark group-data-[disabled]:cursor-not-allowed">
          {copied ? (
            <>
              <CheckIcon className="text-green" />
              {copiedLabel && (
                <span className="w-12 text-left">{copiedLabel}</span>
              )}
            </>
          ) : (
            <>
              <CopyIcon />
              {idleLabel && <span className="w-12 text-left">{idleLabel}</span>}
            </>
          )}
        </div>
      </Button>
    )
  }
)

CopyButton.displayName = 'CopyButton'
