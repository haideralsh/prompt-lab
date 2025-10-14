import { useState } from 'react'
import { Button } from 'react-aria-components'
import { queue } from '../ToastQueue'
import { getErrorMessage } from '../../helpers/getErrorMessage'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'

export function CopyButton({
  onCopy,
  errorMessage = 'Failed to copy to clipboard',
  idleLabel,
  copiedLabel,
  ...props
}: {
  onCopy: () => Promise<void>
  errorMessage?: string
  idleLabel?: string
  copiedLabel?: string
} & React.ComponentProps<typeof Button>) {
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
      isDisabled={copied}
      {...props}
    >
      <div className="flex items-center text-xs gap-1.25 text-text-dark hover:text-text-light group-data-[disabled]:hover:text-text-dark group-data-[disabled]:text-text-dark group-data-[disabled]:cursor-not-allowed">
        {copied ? (
          <>
            <CheckIcon className="text-green" />
            {copiedLabel && <span>{copiedLabel}</span>}
          </>
        ) : (
          <>
            <CopyIcon />
            {idleLabel && <span>{idleLabel}</span>}
          </>
        )}
      </div>
    </Button>
  )
}
