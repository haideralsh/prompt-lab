import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { Button, Checkbox, CheckboxGroup } from 'react-aria-components'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import { queue } from '../ToastQueue'

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong.'
}

export function GitPanel() {
  const { directory, selectedDiffIds, setSelectedDiffIds } = useSidebarContext()
  const [gitStatus, setGitStatus] = useState<GitStatusResult>(null)

  async function handleCopyToClipboard(path: string) {
    if (!directory?.path) return

    try {
      await invoke<void>('copy_diff_to_clipboard', {
        directoryPath: directory.path,
        paths: [path],
      })

      queue.add({
        title: 'Diff copied to clipboard',
      })
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to copy diff',
        description: message,
      })
    }
  }

  async function handleCopySelectedDiffsToClipboard() {
    if (!directory?.path) return

    try {
      await invoke<void>('copy_diff_to_clipboard', {
        directoryPath: directory.path,
        paths: Array.from(selectedDiffIds),
      })

      queue.add({
        title: 'Selected diffs copied to clipboard',
      })
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to copy diff',
        description: message,
      })
    }
  }

  useEffect(() => {
    if (!directory?.path) {
      setGitStatus(null)
      setSelectedDiffIds(() => new Set())
      return
    }

    invoke<GitStatusResult>('git_status', {
      root: directory.path,
    }).then((change) => {
      setGitStatus(change)
      setSelectedDiffIds(() =>
        new Set(change?.map((diff) => diff.path) ?? []),
      )
    })
  }, [directory?.path])

  useEffect(() => {
    let unlisten: UnlistenFn | undefined

    async function listenToGitTokenCounts() {
      unlisten = await listen<GitTokenCountsEvent>(
        'git-token-counts',
        (event) => {
          if (!event?.payload?.files?.length) return
          if (!directory?.path || event.payload.root !== directory.path) return

          setGitStatus((prev) => {
            if (!prev?.length) return prev

            const map = new Map(prev.map((change) => [change.path, change]))
            let updated = false

            for (const file of event.payload.files) {
              const existing = map.get(file.path)
              if (!existing) continue
              if (existing.diffHash !== file.diffHash) continue
              if (existing.tokenCount === file.tokenCount) continue

              map.set(file.path, {
                ...existing,
                tokenCount: file.tokenCount,
              })
              updated = true
            }

            return updated ? Array.from(map.values()) : prev
          })
        },
      )
    }

    void listenToGitTokenCounts()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [directory?.path])

  const gitChanges = gitStatus ?? []
  const selectedDiffCount = selectedDiffIds.size
  const isGroupSelected =
    gitChanges.length > 0 && selectedDiffCount === gitChanges.length
  const isGroupIndeterminate =
    selectedDiffCount > 0 && selectedDiffCount < gitChanges.length
  const selectedTokenCount = gitChanges.reduce((acc, change) => {
    if (!selectedDiffIds.has(change.path)) return acc
    return acc + (change.tokenCount ?? 0)
  }, 0)

  return (
    <PanelDisclosure
      id="git"
      label="Git"
      count={gitChanges.length}
      panelClassName="p-2 flex flex-col gap-1"
      isGroupSelected={isGroupSelected}
      isGroupIndeterminate={isGroupIndeterminate}
      onSelectAll={() => {
        setSelectedDiffIds(() =>
          new Set(gitChanges.map((change) => change.path)),
        )
      }}
      onDeselectAll={() => {
        setSelectedDiffIds(() => new Set())
      }}
      tokenCount={selectedTokenCount}
      actions={
        <Button
          onPress={() => {
            void handleCopySelectedDiffsToClipboard()
          }}
          className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
        >
          <CopyIcon />
        </Button>
      }
    >
      {gitChanges.length > 0 ? (
        <CheckboxGroup
          aria-label="Git changes"
          value={Array.from(selectedDiffIds)}
          onChange={(values) => setSelectedDiffIds(new Set(values))}
        >
          <ul className="text-sm text-text-dark">
            {gitChanges.map((change) => (
              <li key={change.path}>
                <Checkbox
                  value={change.path}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
                  slot="selection"
                >
                  {({ isSelected }) => (
                    <>
                      <span
                        className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light
                                  border border-border-light  group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid
                                  bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light
                                  flex-shrink-0"
                      >
                        {isSelected && <CheckIcon />}
                      </span>
                      <span className="flex items-center gap-3 w-full">
                        <span
                          className="text-text-dark bg-border-dark rounded-sm text-xs px-1 py-0.5 justify-self-start -mr-1"
                          title={change.changeType}
                        >
                          {change.changeType.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-normal text-text-dark break-all">
                          {change.path}
                        </span>
                        <span className="text-red bg-red/15 px-1 py-0.5 rounded-l-sm rounded-r-none text-xs font-semibold justify-self-start">
                          -{change.linesDeleted}
                        </span>
                        <span className="text-green bg-green/15 px-1 py-0.5 rounded-r-sm rounded-l-none text-xs font-semibold justify-self-start -ml-3">
                          +{change.linesAdded}
                        </span>
                      </span>
                      <span>
                        <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                          <Button
                            onPress={() => {
                              void handleCopyToClipboard(change.path)
                            }}
                            className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                          >
                            <CopyIcon />
                          </Button>
                          <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm uppercase group-hover:text-text-dark group-hover:border-border-light">
                            {change.tokenCount?.toLocaleString() ?? '–'}
                          </span>
                        </span>
                      </span>
                    </>
                  )}
                </Checkbox>
              </li>
            ))}
          </ul>
        </CheckboxGroup>
      ) : (
        <div className="text-xs text-text-dark pl-[calc(15px+var(--spacing)*2)]">
          {gitStatus && gitStatus.length === 0
            ? 'Your Git changes will appear here.'
            : 'This directory does not appear to be a Git repository'}
        </div>
      )}
    </PanelDisclosure>
  )
}
