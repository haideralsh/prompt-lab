import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { Checkbox, CheckboxGroup } from 'react-aria-components'
import { CheckIcon } from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import { CopyButton } from '../common/CopyButton'
import {
  GitStatusResult,
  GitStatusUpdatedEvent,
  GitTokenCountsEvent,
} from '../../types/git'

function mergeTokenCountsWithPrevious(
  incoming: GitStatusResult,
  previous: GitStatusResult,
): GitStatusResult {
  if (previous.length === 0) return incoming

  const previousTokenCounts = new Map(
    previous
      .filter((change) => change.tokenCount != null)
      .map((change) => [change.path, change.tokenCount as number]),
  )

  if (previousTokenCounts.size === 0) {
    return incoming
  }

  let didUpdate = false

  const merged = incoming.map((change) => {
    if (change.tokenCount != null) return change
    const previousTokenCount = previousTokenCounts.get(change.path)
    if (previousTokenCount == null) return change
    didUpdate = true
    return { ...change, tokenCount: previousTokenCount }
  })

  return didUpdate ? merged : incoming
}

export function GitPanel() {
  const { directory, selectedDiffIds, setSelectedDiffIds } = useSidebarContext()
  const [gitStatus, setGitStatus] = useState<GitStatusResult | null>(null)

  async function copyToClipboard(content: string | string[] | Set<string>) {
    if (!directory?.path) return

    const paths = typeof content === 'string' ? [content] : Array.from(content)

    await invoke<void>('copy_diff_to_clipboard', {
      directoryPath: directory.path,
      paths,
    })
  }

  useEffect(() => {
    let unlisten: UnlistenFn | undefined

    async function listenToGitTokenCounts() {
      unlisten = await listen<GitTokenCountsEvent>(
        'git-token-counts',
        (event) => {
          if (event.payload.root !== directory.path) return

          setGitStatus((prev) => {
            if (!prev || prev.length === 0) return prev

            let didUpdate = false

            const next = prev.map((change) => {
              const tokenCount = event.payload.files[change.path]
              if (tokenCount == null) return change
              if (change.tokenCount === tokenCount) return change
              didUpdate = true
              return { ...change, tokenCount }
            })

            return didUpdate ? next : prev
          })
        },
      )
    }

    void listenToGitTokenCounts()

    return () => {
      if (unlisten) unlisten()
    }
  }, [directory.path])

  useEffect(() => {
    async function inquireGitStatus() {
      if (!directory?.path) return

      try {
        const changes = await invoke<GitStatusResult | null>('get_git_status', {
          directoryPath: directory.path,
        })

        if (changes === null) {
          setGitStatus(null)
        } else {
          setGitStatus((prev) => {
            if (!prev || prev.length === 0) return changes
            return mergeTokenCountsWithPrevious(changes, prev)
          })
        }
      } catch (error) {
        setGitStatus(null)
      }
    }

    void inquireGitStatus()
  }, [directory.path])

  useEffect(() => {
    let unlisten: UnlistenFn | undefined

    async function listenToGitStatus() {
      if (!directory?.path) return

      await invoke<void>('watch_directory_for_git_changes', {
        directoryPath: directory.path,
      })

      unlisten = await listen<GitStatusUpdatedEvent>(
        'git-status-updated',
        (event) => {
          const payload = event.payload
          if (payload.root !== directory.path) return

          setGitStatus((prev) => {
            if (!prev || prev.length === 0) return payload.changes
            return mergeTokenCountsWithPrevious(payload.changes, prev)
          })
        },
      )
    }

    void listenToGitStatus()

    return () => {
      if (unlisten) unlisten()
    }
  }, [directory.path])

  const gitChanges = gitStatus ?? []
  const selectedDiffCount = selectedDiffIds.size
  const isGroupSelected =
    gitChanges.length > 0 && selectedDiffCount === gitChanges.length
  const isGroupIndeterminate =
    selectedDiffCount > 0 && selectedDiffCount < gitChanges.length
  const selectedTokenCount = gitChanges.reduce((acc, change) => {
    if (!selectedDiffIds.has(change.path)) return acc
    const tokenCount = change.tokenCount ?? 0
    return acc + tokenCount
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
        setSelectedDiffIds(
          () => new Set(gitChanges.map((change) => change.path)),
        )
      }}
      onDeselectAll={() => {
        setSelectedDiffIds(() => new Set())
      }}
      tokenCount={selectedTokenCount}
      actions={
        <CopyButton
          onCopy={async () => {
            await copyToClipboard(selectedDiffIds)
          }}
          className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
        />
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
                          <CopyButton
                            onCopy={async () => {
                              await copyToClipboard(change.path)
                            }}
                            className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                          />
                          <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm uppercase group-hover:text-text-dark group-hover:border-border-light">
                            {change.tokenCount?.toLocaleString() ?? '-'}
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
        <div className="text-xs text-solid-light">
          {gitStatus === null
            ? 'This directory does not appear to be a Git repository'
            : 'Your Git changes will appear here.'}
        </div>
      )}
    </PanelDisclosure>
  )
}
