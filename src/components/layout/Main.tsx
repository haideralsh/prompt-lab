import { FormEvent, useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
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
  TriangleDownIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import { Id, SelectionResult } from '../../types/FileTree'
import { queue } from '../ToastQueue'

interface WebEntry {
  url: string
  timestamp: string
}

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
  const [webEntries, setWebEntries] = useState<WebEntry[]>([])
  const [isAddingWeb, setIsAddingWeb] = useState(false)
  const [webUrl, setWebUrl] = useState('')
  const [isSavingWeb, setIsSavingWeb] = useState(false)

  const sortedFiles = useMemo(() => {
    return selectedFiles.sort((a, b) => {
      if (a.tokenCount == null) return 1
      if (b.tokenCount == null) return -1

      return b.tokenCount - a.tokenCount
    })
  }, [selectedFiles])

  async function deselect(path: Id) {
    const selection = await invoke<SelectionResult>('toggle_selection', {
      directoryPath: directory?.path,
      current: Array.from(selectedNodes),
      nodePath: path,
    })
    setSelectedNodes(new Set(selection.selectedNodesPaths))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminateNodesPaths))
  }

  function handleCancelWeb() {
    if (isSavingWeb) return

    setIsAddingWeb(false)
    setWebUrl('')
  }

  async function handleWebSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault()
    }

    const trimmedUrl = webUrl.trim()
    if (!trimmedUrl || isSavingWeb) return

    setIsSavingWeb(true)

    try {
      const page = await invoke<WebEntry>('save_page_as_md', {
        url: trimmedUrl,
      })

      setWebEntries((prev) => [...prev, page])
      setWebUrl('')
      setIsAddingWeb(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Something went wrong.'

      queue.add({
        title: 'Failed to add URL',
        description: message,
      })
    } finally {
      setIsSavingWeb(false)
    }
  }

  useEffect(() => {
    invoke<GitStatusResult>('git_status', {
      root: directory?.path,
    }).then((change) => setGitStatus(change))
  }, [directory?.path])

  return (
    <section className="flex-1 px-2 bg-background-dark">
      <DisclosureGroup
        defaultExpandedKeys={['selected', 'git']}
        allowsMultipleExpanded
      >
        <Disclosure
          id="selected"
          className="border-b border-interactive-mid -mx-2"
        >
          {({ isExpanded }) => (
            <>
              <Button
                slot="trigger"
                className="flex w-full items-center gap-1 cursor-pointer sticky top-0 px-2 py-2 bg-background-light"
              >
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

                  {isExpanded ? <TriangleDownIcon /> : <TriangleRightIcon />}
                  <span className="uppercase font-semibold tracking-wide text-xs">
                    Selected files ({sortedFiles.length})
                  </span>
                </Heading>
              </Button>
              <DisclosurePanel className="pl-[calc(15px+var(--spacing)*2)] pb-4">
                {sortedFiles.length > 0 ? (
                  <ul className="text-sm text-text-dark">
                    {Array.from(sortedFiles).map((file) => (
                      <li key={file.path}>
                        <Checkbox
                          defaultSelected
                          slot="selection"
                          className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-1 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
                          onChange={(isSelected) => {
                            if (!isSelected) void deselect(file.path)
                          }}
                        >
                          {({ isSelected }) => (
                            <>
                              <span
                                className="flex items-center justify-center mt-0.5 size-[15px] rounded-sm text-accent-text-light
                                            border border-border-light  group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid
                                            bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light
                                            flex-shrink-0"
                              >
                                {isSelected && <CheckIcon />}
                              </span>
                              <span className="flex flex-col text-left">
                                <span className="flex items-baseline gap-2">
                                  <span className="font-normal text-text-dark break-all">
                                    {file.title}
                                  </span>
                                  <span className="text-xs text-solid-light">
                                    {file.tokenCount == null
                                      ? 'counting...'
                                      : `${file.tokenCount} tokens${
                                          file.tokenPercentage == null
                                            ? ''
                                            : ` (${Math.ceil(
                                                file.tokenPercentage,
                                              )}%)`
                                        }`}
                                  </span>
                                </span>
                                <span className="text-xs text-solid-light break-all">
                                  {file.prettyPath}
                                </span>
                              </span>
                            </>
                          )}
                        </Checkbox>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-text-dark">
                    Files selected in the tree will appear here.
                  </div>
                )}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
        <Disclosure id="git" className="border-b border-interactive-mid -mx-2">
          {({ isExpanded }) => (
            <>
              <Button
                slot="trigger"
                className="flex w-full items-center gap-1 cursor-pointer sticky top-0 px-2 py-2 bg-background-light"
              >
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
                  {isExpanded ? (
                    <TriangleDownIcon className="size-4" />
                  ) : (
                    <TriangleRightIcon className="size-4" />
                  )}
                  <span className="uppercase font-semibold tracking-wide text-xs">
                    Git ({(gitStatus && gitStatus.length) ?? 0})
                  </span>
                </Heading>
              </Button>
              <DisclosurePanel className="pl-[calc(15px+var(--spacing)*2)] pr-2 pb-4">
                {gitStatus && gitStatus.length > 0 ? (
                  <ul className="text-sm text-text-dark">
                    {gitStatus.map((change) => (
                      <li key={change.path}>
                        <Checkbox
                          defaultSelected
                          className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
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
                              <span className="font-normal text-text-dark break-all">
                                {change.path}
                              </span>
                              <span className="text-red bg-red/15 px-1 py-0.5 rounded-l-sm rounded-r-none text-xs font-semibold justify-self-start tabular-nums">
                                -{change.linesDeleted}
                              </span>
                              <span className="text-green bg-green/15 px-1 py-0.5 rounded-r-sm rounded-l-none text-xs font-semibold justify-self-start tabular-nums -ml-3">
                                +{change.linesAdded}
                              </span>
                              <span
                                className="text-text-dark bg-border-dark rounded-sm text-xs px-1 py-0.5 justify-self-start"
                                title={change.changeType}
                              >
                                {change.changeType.slice(0, 1).toUpperCase()}
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
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
        <Disclosure id="web" className="border-b border-interactive-mid -mx-2">
          {({ isExpanded }) => (
            <>
              <Button
                slot="trigger"
                className="flex w-full items-center gap-1 cursor-pointer sticky top-0 px-2 py-2 bg-background-light"
              >
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
                  {isExpanded ? (
                    <TriangleDownIcon className="size-4" />
                  ) : (
                    <TriangleRightIcon className="size-4" />
                  )}
                  <span className="uppercase font-semibold tracking-wide text-xs">
                    Web ({webEntries.length})
                  </span>
                </Heading>
              </Button>
              <DisclosurePanel className="pl-[calc(15px+var(--spacing)*2)] pr-2 pb-4 flex flex-col gap-3">
                {isAddingWeb ? (
                  <form
                    onSubmit={(event) => {
                      void handleWebSubmit(event)
                    }}
                    className="flex flex-col gap-2"
                  >
                    <label className="sr-only" htmlFor="web-url">
                      Enter URL to scrape
                    </label>
                    <input
                      id="web-url"
                      type="url"
                      placeholder="https://example.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={webUrl}
                      onChange={(event) => setWebUrl(event.target.value)}
                      disabled={isSavingWeb}
                      className="placeholder:text-sm placeholder:text-solid-light w-full text-text-light py-1 px-2 text-sm rounded-sm bg-background-light border border-interactive-mid focus:outline-none focus:border-accent-border-mid disabled:opacity-70"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onPress={handleCancelWeb}
                        isDisabled={isSavingWeb}
                        className="px-2 py-1 text-xs rounded-sm border border-interactive-mid text-text-dark hover:bg-interactive-mid data-[disabled]:opacity-60"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isDisabled={isSavingWeb || !webUrl.trim()}
                        className="px-2 py-1 text-xs rounded-sm bg-accent-interactive-dark text-text-light data-[disabled]:opacity-60"
                      >
                        {isSavingWeb ? 'Adding...' : 'Add'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    type="button"
                    onPress={() => {
                      setIsAddingWeb(true)
                      setWebUrl('')
                    }}
                    className="w-fit px-2 py-1 text-xs rounded-sm bg-accent-interactive-dark text-text-light"
                  >
                    Add
                  </Button>
                )}

                {webEntries.length > 0 ? (
                  <ul className="text-sm text-text-dark">
                    {webEntries.map((entry) => (
                      <li key={`${entry.url}-${entry.timestamp}`}>
                        <Checkbox
                          defaultSelected
                          className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
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
                              <span className="font-normal text-text-dark break-all">
                                {entry.url}
                              </span>
                            </>
                          )}
                        </Checkbox>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-text-dark">
                    Saved pages will appear here after scraping.
                  </div>
                )}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      </DisclosureGroup>
    </section>
  )
}
