import { FormEvent, useEffect, useRef, useState } from 'react'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { Button } from 'react-aria-components'
import {
  GlobeIcon,
  Pencil1Icon,
  ReloadIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { queue } from '../ToastQueue'
import { flushSync } from 'react-dom'
import { getErrorMessage } from '../../helpers/getErrorMessage'
import { WebPanelActions } from './WebPanelActions'
import { CopyButton } from '../common/CopyButton'
import { EditSavedPage } from './EditSavedPage'

import { preserveSelected } from '../../helpers/preserveSelected'
import { TokenCount } from '../common/TokenCount'
import { appDataDir, join } from '@tauri-apps/api/path'
import { useAtom, useAtomValue } from 'jotai'
import { directoryAtom, selectedPagesIdsAtom } from '../../state/atoms'
import { PanelList } from './PanelList'
import { PanelRowCheckbox } from './PanelRowCheckbox'
import { Panel } from './Panel'
import { EmptyPanelListMessage } from './EmptyPanelListMessage'

export interface SavedPageMetadata {
  title: string
  url: string
  tokenCount: number
  faviconPath?: string | null
}

export type SavedPages = readonly SavedPageMetadata[]

export async function fetchSavedPages(
  directoryPath: string
): Promise<SavedPages> {
  try {
    const [pages, appDataDirPath] = await Promise.all([
      invoke<SavedPages>('list_saved_pages', { directoryPath }),
      appDataDir(),
    ])

    const faviconPromises = pages
      .filter((page) => page.faviconPath)
      .map(async (page) => {
        const filePath = await join(appDataDirPath, page.faviconPath!)
        return { page, faviconPath: convertFileSrc(filePath) }
      })

    const convertedFavicons = await Promise.all(faviconPromises)
    for (const { page, faviconPath } of convertedFavicons) {
      page.faviconPath = faviconPath
    }

    return pages
  } catch (error) {
    const message = getErrorMessage(error)

    queue.add({
      title: 'Failed to load saved pages',
      description: message,
    })

    return []
  }
}

export function WebDisclosurePanel() {
  const directory = useAtomValue(directoryAtom)
  const [selectedPagesIds, setSelectedPagesIds] = useAtom(selectedPagesIdsAtom)
  const [savedPages, setSavedPages] = useState<SavedPages>([])
  const [isAddingNewPage, setIsAddingWeb] = useState(false)
  const [webUrl, setWebUrl] = useState('')
  const [isSavingWeb, setIsSavingWeb] = useState(false)
  const [reloadingUrls, setReloadingUrls] = useState<Set<string>>(
    () => new Set()
  )
  const webUrlInputRef = useRef<HTMLInputElement | null>(null)
  const [editingPageUrl, setEditingPageUrl] = useState<string | null>(null)
  const [brokenFavicons, setBrokenFavicons] = useState<Set<string>>(
    () => new Set()
  )

  const totalTokenCount = savedPages
    .filter((page) => selectedPagesIds.has(page.url))
    .reduce((acc, page) => acc + page.tokenCount, 0)

  useEffect(() => {
    async function loadSavedPages(selectedDirectoryPath: string) {
      const pages = await fetchSavedPages(selectedDirectoryPath)
      setSavedPages(pages)
      setSelectedPagesIds(() => new Set())
    }

    void loadSavedPages(directory.path)
  }, [directory.path])

  function showAddNewPageForm() {
    flushSync(() => {
      setWebUrl('')
      setIsAddingWeb(true)
    })

    webUrlInputRef.current?.focus()
  }

  function handleCancelWeb() {
    if (isSavingWeb) return

    setIsAddingWeb(false)
    setWebUrl('')
  }

  async function handleAddNewPage(event?: FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault()
    }

    const trimmedUrl = webUrl.trim()
    if (!trimmedUrl || isSavingWeb) return

    setIsSavingWeb(true)

    try {
      await invoke<SavedPageMetadata>('save_page_as_md', {
        directoryPath: directory.path,
        url: trimmedUrl,
      })

      const pages = await fetchSavedPages(directory.path)

      setSavedPages(pages)
      setSelectedPagesIds((selectedUrls) =>
        preserveSelected(pages, selectedUrls, (page) => page.url)
      )

      setWebUrl('')
      setIsAddingWeb(false)
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to save page',
        description: message,
      })
    } finally {
      setIsSavingWeb(false)
    }
  }

  async function handleReload(entry: SavedPageMetadata) {
    if (reloadingUrls.has(entry.url)) return

    setReloadingUrls((prev) => {
      const next = new Set(prev)
      next.add(entry.url)
      return next
    })

    try {
      await invoke<SavedPageMetadata>('save_page_as_md', {
        directoryPath: directory.path,
        url: entry.url,
      })

      const pages = await fetchSavedPages(directory.path)

      setSavedPages(pages)
      setSelectedPagesIds((prev) => {
        const next = new Set<string>()
        for (const url of prev) {
          if (pages.some((p) => p.url === url)) {
            next.add(url)
          }
        }
        return next
      })
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to reload page',
        description: message,
      })
    } finally {
      setReloadingUrls((prev) => {
        const next = new Set(prev)
        next.delete(entry.url)
        return next
      })
    }
  }

  async function handleDelete(entry: SavedPageMetadata) {
    // TODO: Show a confirmation dialog before deleting

    try {
      await invoke<void>('delete_saved_page', {
        directoryPath: directory.path,
        url: entry.url,
      })

      const pages = await fetchSavedPages(directory.path)

      setSavedPages(pages)
      setSelectedPagesIds((prev) => {
        const next = new Set(prev)
        next.delete(entry.url)
        return next
      })
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to delete page',
        description: message,
      })
    }
  }

  async function handleCopyToClipboard(entry: SavedPageMetadata) {
    await invoke<void>('copy_pages_to_clipboard', {
      directoryPath: directory.path,
      urls: [entry.url],
    })
  }

  // title save logic moved into <EditSavedPage />

  async function handleCopySelectedToClipboard() {
    await invoke<void>('copy_pages_to_clipboard', {
      directoryPath: directory.path,
      urls: Array.from(selectedPagesIds),
    })
  }

  function selectAll() {
    setSelectedPagesIds(() => new Set(savedPages.map((e) => e.url)))
  }

  function deselectAll() {
    setSelectedPagesIds(() => new Set())
  }

  const isGroupSelected =
    savedPages.length > 0 && selectedPagesIds.size === savedPages.length
  const isGroupIndeterminate =
    selectedPagesIds.size > 0 && selectedPagesIds.size < savedPages.length

  return (
    <Panel
      id="web"
      label="Web"
      count={savedPages.length}
      panelClassName="p-2 flex flex-col gap-1"
      isGroupSelected={isGroupSelected}
      isGroupIndeterminate={isGroupIndeterminate}
      onSelectAll={selectAll}
      onDeselectAll={deselectAll}
      tokenCount={totalTokenCount}
      endActions={
        <WebPanelActions
          isAddingNewPage={isAddingNewPage}
          onShowAddNewPress={showAddNewPageForm}
          onCopyToClipboardPress={handleCopySelectedToClipboard}
          savedPagesCount={savedPages.length}
        />
      }
    >
      {savedPages.length > 0 ? (
        <PanelList
          ariaLabel="Saved pages"
          selectedValues={selectedPagesIds}
          onChangeSelectedValues={(values) => setSelectedPagesIds(values)}
          className="text-sm"
        >
          {savedPages.map((entry) => {
            const isReloading = reloadingUrls.has(entry.url)
            const isEditing = editingPageUrl === entry.url

            return (
              <li
                key={`${entry.url}`}
                className={`${
                  isReloading ? 'opacity-75 pointer-events-none' : 'opacity-100'
                }`}
              >
                {isEditing ? (
                  <EditSavedPage
                    page={entry}
                    onSave={(savedPages) => {
                      setSavedPages(savedPages)
                      setEditingPageUrl(null)
                    }}
                    onCancel={() => setEditingPageUrl(null)}
                  />
                ) : (
                  <PanelRowCheckbox
                    value={entry.url}
                    isDisabled={isReloading || Boolean(editingPageUrl)}
                    endActions={
                      <>
                        <Button
                          onPress={() => {
                            setEditingPageUrl(entry.url)
                          }}
                          className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                          isDisabled={isReloading || Boolean(editingPageUrl)}
                        >
                          <Pencil1Icon />
                        </Button>
                        <CopyButton
                          onCopy={() => handleCopyToClipboard(entry)}
                          isDisabled={isReloading}
                        />
                        <Button
                          onPress={() => {
                            void handleReload(entry)
                          }}
                          className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                          isDisabled={isReloading}
                        >
                          <ReloadIcon />
                        </Button>
                        <Button
                          onPress={() => {
                            void handleDelete(entry)
                          }}
                          className=" text-red/75 hover:text-red data-[disabled]:text-red/75"
                          isDisabled={isReloading}
                        >
                          <TrashIcon />
                        </Button>
                        <TokenCount count={entry.tokenCount} />
                      </>
                    }
                  >
                    {entry.faviconPath && !brokenFavicons.has(entry.url) ? (
                      <img
                        src={entry.faviconPath}
                        onError={() =>
                          setBrokenFavicons((prev) =>
                            new Set(prev).add(entry.url)
                          )
                        }
                        alt={entry.title}
                        className="size-[15px] rounded-xs"
                      />
                    ) : (
                      <GlobeIcon className="text-solid-light" />
                    )}
                    <span className="font-normal shrink-0 text-text-dark">
                      {entry.title}
                    </span>
                    <span className="hidden group-hover:inline text-solid-light truncate">
                      {entry.url}
                    </span>
                  </PanelRowCheckbox>
                )}
              </li>
            )
          })}
        </PanelList>
      ) : !isAddingNewPage ? (
        <EmptyPanelListMessage>
          Web pages will be formatted as markdown and included with your prompt.
          Add a new web page by clicking on the + button in the web panel
          header.
        </EmptyPanelListMessage>
      ) : null}

      {isAddingNewPage && (
        <form
          onSubmit={(event) => {
            void handleAddNewPage(event)
          }}
        >
          <div className="ml-8 mr-2 mt-1 mb-2">
            <div className="rounded-sm group bg-transparent outline-1 -outline-offset-1 outline-interactive-light has-[input:focus-within]:outline-1 has-[input:focus-within]:-outline-offset-1 has-[input:focus-within]:outline-border-mid">
              <label className="sr-only" htmlFor="web-url">
                add a web page URL
              </label>
              <div className="grid grid-cols-[auto_1fr_auto] items-center">
                <div className="shrink-0 pl-2">
                  <GlobeIcon className="text-solid-light" />
                </div>
                <input
                  id="web-url"
                  type="url"
                  placeholder="Enter a full URL"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  ref={webUrlInputRef}
                  value={webUrl}
                  onChange={(event) => setWebUrl(event.target.value)}
                  disabled={isSavingWeb}
                  className="min-w-0 grow py-1.5 px-2 text-sm text-text-dark placeholder:text-solid-light focus:outline-none bg-transparent disabled:text-text-dark/60"
                />

                <div className="flex items-center gap-1.5 px-1">
                  <Button
                    type="submit"
                    isDisabled={isSavingWeb || !webUrl.trim()}
                    className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark data-[disabled]:text-text-dark/60 hover:text-text-light"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    onPress={handleCancelWeb}
                    isDisabled={isSavingWeb}
                    className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark hover:text-text-light"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Panel>
  )
}
