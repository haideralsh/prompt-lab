import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Checkbox } from 'react-aria-components'
import { CheckIcon } from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'
import { useSidebarContext } from '../Sidebar/SidebarContext'

export function GitPanel() {
  const { directory } = useSidebarContext()
  const [gitStatus, setGitStatus] = useState<GitStatusResult>(null)

  useEffect(() => {
    invoke<GitStatusResult>('git_status', {
      root: directory?.path,
    }).then((change) => setGitStatus(change))
  }, [directory?.path])

  return (
    <PanelDisclosure
      id="git"
      label="Git"
      count={(gitStatus && gitStatus.length) ?? 0}
      panelClassName="pl-[calc(15px+var(--spacing)*2)] pr-2 pb-4"
    >
      {gitStatus && gitStatus.length > 0 ? (
        <ul className="text-sm text-text-dark">
          {gitStatus.map((change) => (
            <li key={change.path}>
              <Checkbox
                defaultSelected
                className="flex items-center gap-3 group text-left w-full rounded-sm px-2 py-0.5 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
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
                  </>
                )}
              </Checkbox>
            </li>
          ))}
        </ul>
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
