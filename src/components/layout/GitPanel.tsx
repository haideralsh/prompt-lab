import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Button, Checkbox } from 'react-aria-components'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'
import { useSidebarContext } from '../Sidebar/SidebarContext'

export function GitPanel() {
  const { directory } = useSidebarContext()
  const [gitStatus, setGitStatus] = useState<GitStatusResult>(null)

  async function handleCopyToClipboard(path: string) {
    // TODO: implement
  }
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
      panelClassName="p-2 flex flex-col gap-1"
    >
      {gitStatus && gitStatus.length > 0 ? (
        <ul className="text-sm text-text-dark">
          {gitStatus.map((change) => (
            <li key={change.path}>
              <Checkbox
                defaultSelected
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
