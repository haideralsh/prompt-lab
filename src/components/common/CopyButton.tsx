import { useState } from 'react'
import { Button } from 'react-aria-components'
import { queue } from '../ToastQueue'
import { getErrorMessage } from '../../helpers/getErrorMessage'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'

export function CopyButton({
  onCopy,
  errorMessage = 'Failed to copy to clipboard',
  ...props
}: {
  onCopy: () => Promise<void>
  errorMessage?: string
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
    <Button onPress={handlePress} {...props}>
      {copied ? <CheckIcon className="text-green" /> : <CopyIcon />}
    </Button>
  )
}
