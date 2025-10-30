import { useState, useEffect, useRef } from 'react'
import { Button } from 'react-aria-components'
import { queue } from '@/components/toasts/toast-queue'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'
import { getErrorMessage } from '@/helpers/get-error-message'
import { useAtomValue } from 'jotai'
import { copyAllToClipboard } from '@/api/clipboard'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { platform } from '@tauri-apps/plugin-os'
import {
  directoryAtom,
  selectedDiffIdsAtom,
  selectedInstructionIdsAtom,
  selectedNodesAtom,
  selectedPagesIdsAtom,
  treeAtom,
  treeDisplayModeAtom,
  unsavedInstructionAtom,
} from '@/state/atoms'

export function CopyAllButton() {
  const [copied, setCopied] = useState(false)
  const [userPlatform, setUserPlatform] = useState('unknown')
  const timeoutRef = useRef<number | null>(null)

  const directory = useAtomValue(directoryAtom)
  const tree = useAtomValue(treeAtom)
  const selectedNodes = useAtomValue(selectedNodesAtom)
  const selectedPagesIds = useAtomValue(selectedPagesIdsAtom)
  const selectedDiffIds = useAtomValue(selectedDiffIdsAtom)
  const selectedInstructionIds = useAtomValue(selectedInstructionIdsAtom)
  const unsavedInstruction = useAtomValue(unsavedInstructionAtom)
  const treeDisplayMode = useAtomValue(treeDisplayModeAtom)
  const handlePressRef = useRef(handlePress)

  useEffect(() => {
    const p = platform()
    setUserPlatform(p === 'macos' ? 'mac' : 'other')
  }, [])

  async function handlePress() {
    if (copied) return

    try {
      await copyAllToClipboard({
        treeDisplayMode,
        fullTree: tree,
        root: directory.path,
        selectedNodes: selectedNodes,
        gitDiffPaths: selectedDiffIds,
        urls: selectedPagesIds,
        instructionIds: selectedInstructionIds,
        unsavedInstruction,
      })

      setCopied(true)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false)
        timeoutRef.current = null
      }, 2000)
    } catch (error) {
      queue.add({
        title: 'Failed to copy to clipboard',
        description: getErrorMessage(error),
      })
    }
  }

  useEffect(() => {
    handlePressRef.current = handlePress
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isC = e.key.toLowerCase() === 'c'
      const hasShift = e.shiftKey
      const hasCmdOrCtrl = e.metaKey || e.ctrlKey

      if (isC && hasShift && hasCmdOrCtrl) {
        handlePressRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <Button
      className="group focus:outline-none focus-visible:ring-offset-background-dark"
      onPress={handlePress}
      isDisabled={copied}
    >
      <div
        className={twMerge(
          clsx([
            'flex items-center gap-1.25 rounded-sm bg-accent-interactive-mid px-2 py-1 text-xs text-text-light transition-colors group-focus-visible:ring-2 group-focus-visible:ring-accent-border-mid group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-background-dark hover:bg-accent-interactive-light',
            {
              'bg-accent-background-dark pr-3.5 hover:bg-accent-background-dark':
                copied,
            },
          ]),
        )}
      >
        {copied ? <CheckIcon className="text-green" /> : <CopyIcon />}
        <span className="flex items-center gap-2.5 text-left">
          <span>{copied ? 'Copied to clipboard' : 'Copy all'}</span>
          {copied
            ? null
            : userPlatform !== 'unknown'
              ? userPlatform === 'mac'
                ? MacShortcutLegend
                : WindowsLinuxShortcutLegend
              : null}
        </span>
      </div>
    </Button>
  )
}

const MacShortcutLegend = (
  <span className="space-x-0.5 text-text-dark">
    <span>⌘</span>
    <span>⇧</span>
    <span>C</span>
  </span>
)

const WindowsLinuxShortcutLegend = (
  <span className="-ml-0.5 text-text-dark">
    <span>Ctrl+Shift+C</span>
  </span>
)
