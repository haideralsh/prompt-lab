import { useEffect, useState } from 'react'
import { CopyButton } from '../../common/CopyButton'
import { GitStatusResult } from '../../../types/git'
import { Panel } from '../Panel'
import { TokenCount } from '../../common/TokenCount'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  directoryAtom,
  selectedDiffIdsAtom,
  totalGitDiffTokenCountAtom,
} from '../../../state/atoms'
import { PanelRowCheckbox } from '../PanelRowCheckbox'
import { PanelList } from '../PanelList'
import { EmptyPanelListMessage } from '../EmptyPanelListMessage'
import { copyDiffsToClipboard } from './lib'
import { useInquireGitStatus } from './hooks/useInquireGitStatus'
import { useGitStatusListener } from './hooks/useGitStatusListener'
import { useGitTokenCountsListener } from './hooks/useGitTokenCountsListener'

export function GitPanel() {
  const directory = useAtomValue(directoryAtom)
  const [selectedDiffIds, setSelectedDiffIds] = useAtom(selectedDiffIdsAtom)
  const [gitStatus, setGitStatus] = useState<GitStatusResult | null>(null)
  const setTotalGitDiffTokenCount = useSetAtom(totalGitDiffTokenCountAtom)

  useInquireGitStatus(directory, setGitStatus)
  useGitTokenCountsListener(directory, setGitStatus)
  useGitStatusListener(directory, setGitStatus)

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

  useEffect(() => {
    setTotalGitDiffTokenCount(selectedTokenCount)
  }, [selectedTokenCount, setTotalGitDiffTokenCount])

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
      actions={
        <CopyButton
          isDisabled={selectedDiffIds.size === 0}
          onCopy={async () => {
            await copyDiffsToClipboard(directory, selectedDiffIds)
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
                          await copyDiffsToClipboard(directory, change.path)
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
