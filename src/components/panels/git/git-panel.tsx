import { useEffect, useState } from 'react'
import { CopyButton } from '../../common/copy-button'
import { GitStatusResult } from '../../../types/git'
import { TokenCount } from '../../common/token-count'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  directoryAtom,
  selectedDiffIdsAtom,
  totalGitDiffTokenCountAtom,
} from '../../../state/atoms'
import { copyDiffsToClipboard } from './lib'
import { useInquireGitStatus } from './hooks/use-inquire-git-status'
import { useGitStatusListener } from './hooks/use-git-status-listener'
import { useGitTokenCountsListener } from './hooks/use-git-token-counts-listener'
import { Panel } from '../panel/panel'
import { PanelList } from '../panel/panel-list'
import { PanelRowCheckbox } from '../panel/panel-row-checkbox'
import { EmptyPanelListMessage } from '@/components/panels/panel/empty-panel-list-message'

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
          () => new Set(gitChanges.map((change) => change.path)),
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
                <span className="flex w-full items-center gap-3">
                  <span
                    className="-mr-1 justify-self-start rounded-sm bg-border-dark px-1 py-0.5 text-xs text-text-dark"
                    title={change.changeType}
                  >
                    {change.changeType.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="font-normal break-all text-text-dark">
                    {change.path}
                  </span>
                  <span className="justify-self-start rounded-l-sm rounded-r-none bg-red/15 px-1 py-0.5 text-xs font-semibold text-red">
                    -{change.linesDeleted}
                  </span>
                  <span className="-ml-3 justify-self-start rounded-l-none rounded-r-sm bg-green/15 px-1 py-0.5 text-xs font-semibold text-green">
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
