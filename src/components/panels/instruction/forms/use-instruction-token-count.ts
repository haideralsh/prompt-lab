import { useEffect, useState, useTransition } from 'react'
import { useDebounceValue } from 'usehooks-ts'
import { countInstructionTokens } from '@/api/instructions'

const DEBOUNCE_DELAY_MS = 1000

export function useInstructionTokenCount(content: string) {
  const [tokenCount, setTokenCount] = useState(0)
  const [, startTransition] = useTransition()
  const [debouncedContent] = useDebounceValue(content, DEBOUNCE_DELAY_MS)

  useEffect(() => {
    if (debouncedContent.trim().length === 0) {
      startTransition(() => {
        setTokenCount(0)
      })
      return
    }

    countInstructionTokens({
      content: debouncedContent,
    })
      .then((count) => {
        startTransition(() => {
          setTokenCount(count)
        })
      })
      .catch((error) => {
        console.error('Failed to count instruction tokens', error)
      })
  }, [debouncedContent, startTransition])

  return { tokenCount }
}
