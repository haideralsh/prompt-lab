import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { CopyButton } from '../common/CopyButton'
import {
  GitStatusResult,
  GitStatusUpdatedEvent,
  GitTokenCountsEvent,
} from '../../types/git'
import { Panel } from './Panel'
import { TokenCount } from '../common/TokenCount'
import { useAtom, useAtomValue } from 'jotai'
import { directoryAtom, selectedDiffIdsAtom } from '../../state/atoms'
import { PanelRowCheckbox } from './PanelRowCheckbox'
import { PanelList } from './PanelList'
import { EmptyPanelListMessage } from './EmptyPanelListMessage'

function mergeTokenCountsWithPrevious(
  incoming: GitStatusResult,
  previous: GitStatusResult
): GitStatusResult {
  if (previous.length === 0) return incoming

  const previousTokenCounts = new Map(
    previous
      .filter((change) => change.tokenCount != null)
      .map((change) => [change.path, change.tokenCount as number])
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
  const directory = useAtomValue(directoryAtom)
  const [selectedDiffIds, setSelectedDiffIds] = useAtom(selectedDiffIdsAtom)
  const [gitStatus, setGitStatus] = useState<GitStatusResult | null>(null)

  async function copyToClipboard(content: string | string[] | Set<string>) {
    if (!directory.path) return

    const paths = typeof content === 'string' ? [content] : Array.from(content)

    await invoke<void>('copy_diffs_to_clipboard', {
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
        }
      )
    }

    void listenToGitTokenCounts()

    return () => {
      if (unlisten) unlisten()
    }
  }, [directory.path])

  useEffect(() => {
    async function inquireGitStatus() {
      if (!directory.path) return

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
      if (!directory.path) return

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
        }
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
    <Panel
      id="git"
      label="Git"
      count={gitChanges.length}
      panelClassName="p-2 flex flex-col gap-1"
      isGroupSelected={isGroupSelected}
      isGroupIndeterminate={isGroupIndeterminate}
      onSelectAll={() => {
        setSelectedDiffIds(
          () => new Set(gitChanges.map((change) => change.path))
        )
      }}
      onDeselectAll={() => {
        setSelectedDiffIds(() => new Set())
      }}
      tokenCount={selectedTokenCount}
      endActions={
        <CopyButton
          isDisabled={selectedDiffIds.size === 0}
          onCopy={async () => {
            await copyToClipboard(selectedDiffIds)
          }}
        />
      }
    >
      {gitChanges.length > 0 ? (
        <PanelList
          ariaLabel="Git changes"
          selectedValues={selectedDiffIds}
          onChangeSelectedValues={(values) => setSelectedDiffIds(values)}
          className="text-sm text-text-dark"
        >
          {gitChanges.map((change) => (
            <li key={change.path}>
              <PanelRowCheckbox
                value={change.path}
                endActions={
                  <>
                    {change.tokenCount && (
                      <CopyButton
                        onCopy={async () => {
                          await copyToClipboard(change.path)
                        }}
                      />
                    )}
                    <TokenCount count={change.tokenCount} />
                  </>
                }
              >
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
              </PanelRowCheckbox>
            </li>
          ))}
        </PanelList>
      ) : (
        <EmptyPanelListMessage>
          {gitStatus === null
            ? 'This directory does not appear to be a Git repository'
            : 'Your Git changes will appear here. Selected Git diffs will be included in your prompt.'}
        </EmptyPanelListMessage>
      )}
    </Panel>
  )
}
