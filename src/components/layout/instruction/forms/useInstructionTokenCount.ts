import { useEffect, useState, useTransition } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useDebounceValue } from 'usehooks-ts'

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

    invoke<number>('count_instruction_tokens', {
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
