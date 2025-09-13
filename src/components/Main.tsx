import { useEffect, useMemo, useState } from 'react'
import { useSidebarContext } from './Sidebar/SidebarContext'
import { invoke } from '@tauri-apps/api/core'
import { SelectionResult } from '../types/FileTree'
import {
  Button,
  Checkbox,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
} from 'react-aria-components'
import {
  CheckIcon,
  CommitIcon,
  FileIcon,
  TriangleDownIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons'

export function Main() {
  const {
    selectedFiles,
    directory,
    selectedNodes,
    setSelectedFiles,
    setSelectedNodes,
    setIndeterminateNodes,
  } = useSidebarContext()

  const [gitStatus, setGitStatus] = useState<GitStatusResult>(null)

  const sortedFiles = useMemo(() => {
    return selectedFiles.sort((a, b) => {
      if (a.tokenCount == null) return 1
      if (b.tokenCount == null) return -1

      return b.tokenCount - a.tokenCount
    })
  }, [selectedFiles])

  async function deselect(id: string | number) {
    const selection = await invoke<SelectionResult>('toggle_selection', {
      path: directory?.path,
      current: Array.from(selectedNodes),
      id: id,
    })
    setSelectedNodes(new Set(selection.selectedNodes))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminate))
  }

  useEffect(() => {
    invoke<GitStatusResult>('git_status', {
      root: directory?.path,
    }).then((change) => setGitStatus(change))
  }, [directory?.path])

  return (
    <section className="flex-1 px-2 pb-2 bg-background-dark">
      <DisclosureGroup
        defaultExpandedKeys={['selected', 'git']}
        allowsMultipleExpanded
      >
        <Disclosure id="selected" className="border-b border-border-dark -mx-2">
          {({ isExpanded }) => (
            <>
              <div className="sticky top-0 px-2 py-2 bg-background-dark">
                <Heading className="flex items-center gap-1 text-text-dark">
                  <Checkbox
                    slot="selection"
                    defaultSelected
                    className="flex items-center justify-center size-[15px] rounded-sm  text-accent-text-light
                                border border-border-light  data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid
                                bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light
                                flex-shrink-0"
                  >
                    {({ isSelected }) => isSelected && <CheckIcon />}
                  </Checkbox>
                  <Button
                    slot="trigger"
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? <TriangleDownIcon /> : <TriangleRightIcon />}

                    <FileIcon />
                    <span className="text-xs">
                      Selected files ({sortedFiles.length})
                    </span>
                  </Button>
                </Heading>
              </div>
              <DisclosurePanel>
                {sortedFiles.length > 0 && (
                  <ul className="space-y-4 text-sm text-text-dark mt-2">
                    {Array.from(sortedFiles).map((path) => (
                      <li key={path.id} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col gap-2">
                            <span className="flex items-center gap-1">
                              <span className="font-normal">{path.title}</span>
                              <span className="text-text-dark">
                                {path.tokenCount == null
                                  ? 'counting...'
                                  : `${path.tokenCount} tokens${
                                      path.tokenPercentage == null
                                        ? ''
                                        : ` (${Math.ceil(path.tokenPercentage)}%)`
                                    }`}
                              </span>
                            </span>
                            <span className="text-xs">{path.id}</span>
                          </div>
                          <button
                            className="text-xs bg-interactive-dark hover:bg-interactive-mid active:bg-interactive-light flex items-center col gap-1.5 rounded-xs cursor-pointer px-2 py-1 w-fit text-text-light"
                            onClick={() => deselect(path.id)}
                          >
                            Deselect
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
        <Disclosure id="git" className="border-b border-border-dark -mx-2">
          {({ isExpanded }) => (
            <>
              <div className="sticky top-0 px-2 py-2 bg-background-dark">
                <Heading className="flex items-center gap-1 text-xs text-text-dark">
                  <Checkbox
                    slot="selection"
                    defaultSelected
                    className="flex items-center justify-center size-[15px] rounded-sm  text-accent-text-light
                                border border-border-light  data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid
                                bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light
                                flex-shrink-0"
                  >
                    {({ isSelected }) => isSelected && <CheckIcon />}
                  </Checkbox>
                  <Button
                    slot="trigger"
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? (
                      <TriangleDownIcon className="size-4" />
                    ) : (
                      <TriangleRightIcon className="size-4" />
                    )}
                    <CommitIcon />
                    <span>
                      Git (
                      {gitStatus ? gitStatus.length : 'Not a Git repository'})
                    </span>
                  </Button>
                </Heading>
              </div>
              <DisclosurePanel className="px-2 pb-4">
                {gitStatus && gitStatus.length > 0 ? (
                  <ul className="space-y-3 text-sm text-text-dark mt-2">
                    {gitStatus.map((change) => (
                      <li
                        key={change.path}
                        className="flex items-baseline gap-2"
                      >
                        <div className="flex flex-col">
                          <div className="flex gap-2 items-center">
                            <Checkbox
                              slot="selection"
                              className="flex items-center justify-center size-[15px] rounded-sm  text-accent-text-light
                                          border border-border-light  data-[selected]:border-accent-border-mid data-[indeterminate]:border-accent-border-mid
                                          bg-transparent data-[selected]:bg-accent-interactive-light data-[indeterminate]:bg-accent-interactive-light
                                          flex-shrink-0"
                            >
                              {({ isSelected }) => isSelected && <CheckIcon />}
                            </Checkbox>
                            <span className="font-normal">{change.path}</span>
                          </div>
                          <span className="text-xs text-text-dark pl-[calc(15px+var(--spacing)*2)]">
                            {/* TODO: make the change type an icon */}
                            {change.changeType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <span className="text-red bg-red/15 px-1 py-0.5 rounded-sm">
                            -{change.linesDeleted}
                          </span>
                          <span className="text-green bg-green/15 px-1 py-0.5 rounded-sm">
                            +{change.linesAdded}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-text-dark mt-2">No changes</div>
                )}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      </DisclosureGroup>
    </section>
  )
}
