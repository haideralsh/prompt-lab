import { FormEvent, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Button, Checkbox, CheckboxGroup } from 'react-aria-components'
import {
  CheckIcon,
  CopyIcon,
  PlusIcon,
  ReloadIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'
import { queue } from '../ToastQueue'
import { useSidebarContext } from '../Sidebar/SidebarContext'

interface SavedPageMetadata {
  title: string
  url: string
  tokenCount: number
}

interface SavedPages {
  savedPages: SavedPageMetadata[]
  totalPages: number
  totalTokens: number
}

const noSavedPages: SavedPages = {
  savedPages: [],
  totalPages: 0,
  totalTokens: 0,
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong.'
}

export function WebDisclosurePanel() {
  const { directory } = useSidebarContext()
  const [savedPages, setSavedPages] = useState<SavedPages>(noSavedPages)
  const [isAddingNewPage, setIsAddingWeb] = useState(false)
  const [webUrl, setWebUrl] = useState('')
  const [isSavingWeb, setIsSavingWeb] = useState(false)
  const [reloadingUrls, setReloadingUrls] = useState<Set<string>>(
    () => new Set(),
  )
  const [selectedPagesIds, setSelectedPagesIds] = useState<string[]>([])

  useEffect(() => {
    async function loadSavedPages(selectedDirectoryPath: string) {
      try {
        const pages = await invoke<SavedPages>('list_saved_pages', {
          directoryPath: selectedDirectoryPath,
        })
        setSavedPages(pages)
        setSelectedPagesIds(pages.savedPages.map((e) => e.url))
      } catch (error) {
        const message = getErrorMessage(error)

        queue.add({
          title: 'Failed to load saved pages',
          description: message,
        })
      }
    }

    if (!directory?.path) {
      setSavedPages(noSavedPages)
      setSelectedPagesIds([])
      return
    }

    void loadSavedPages(directory.path)
  }, [directory?.path])

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
      if (!directory?.path) {
        queue.add({
          title: 'No directory selected',
          description: 'Select a directory before saving pages.',
        })
        return
      }

      await invoke<SavedPageMetadata>('save_page_as_md', {
        directoryPath: directory.path,
        url: trimmedUrl,
      })

      const pages = await invoke<SavedPages>('list_saved_pages', {
        directoryPath: directory.path,
      })

      setSavedPages(pages)
      setSelectedPagesIds(pages.savedPages.map((e) => e.url))
      setWebUrl('')
      setIsAddingWeb(false)
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to add URL',
        description: message,
      })
    } finally {
      setIsSavingWeb(false)
    }
  }

  async function handleReload(entry: SavedPageMetadata) {
    if (!directory || reloadingUrls.has(entry.url)) return

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

      const pages = await invoke<SavedPages>('list_saved_pages', {
        directoryPath: directory.path,
      })

      setSavedPages(pages)
      setSelectedPagesIds((prev) =>
        prev.filter((url) => pages.savedPages.some((p) => p.url === url)),
      )
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
    if (!directory) return

    try {
      await invoke<void>('delete_saved_page', {
        directoryPath: directory.path,
        url: entry.url,
      })

      const pages = await invoke<SavedPages>('list_saved_pages', {
        directoryPath: directory.path,
      })

      setSavedPages(pages)
      setSelectedPagesIds((prev) => prev.filter((url) => url !== entry.url))
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to delete page',
        description: message,
      })
    }
  }

  async function handleCopyToClipboard(entry: SavedPageMetadata) {
    if (!directory?.path) return

    try {
      await invoke<void>('copy_page_to_clipboard', {
        directoryPath: directory.path,
        url: entry.url,
      })

      queue.add({
        title: 'Page copied to clipboard',
      })
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to copy page',
        description: message,
      })
    }
  }

  async function handleCopySelectedToClipboard() {
    if (!directory?.path) return

    try {
      await invoke<void>('copy_all_pages_to_clipboard', {
        directoryPath: directory.path,
        urls: selectedPagesIds,
      })

      queue.add({
        title: 'Page selected pages to clipboard',
      })
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to copy page',
        description: message,
      })
    }
  }

  function selectAll() {
    setSelectedPagesIds(savedPages.savedPages.map((e) => e.url))
  }

  function deselectAll() {
    setSelectedPagesIds([])
  }

  const isGroupSelected =
    savedPages.totalPages > 0 &&
    selectedPagesIds.length === savedPages.totalPages
  const isGroupIndeterminate =
    selectedPagesIds.length > 0 &&
    selectedPagesIds.length < savedPages.totalPages

  return (
    <PanelDisclosure
      id="web"
      label="Web"
      count={savedPages.totalPages}
      panelClassName="pl-[calc(15px+var(--spacing)*2)] pr-2 pb-4 flex flex-col gap-3"
      isGroupSelected={isGroupSelected}
      isGroupIndeterminate={isGroupIndeterminate}
      onSelectAll={selectAll}
      onDeselectAll={deselectAll}
      tokenCount={savedPages.totalTokens}
      actions={
        <>
          {!isAddingNewPage && (
            <Button
              type="button"
              onPress={() => {
                setIsAddingWeb(true)
                setWebUrl('')
              }}
              className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
            >
              <PlusIcon />
            </Button>
          )}
          <Button
            onPress={() => {
              void handleCopySelectedToClipboard()
            }}
            className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
          >
            <CopyIcon />
          </Button>
        </>
      }
    >
      {isAddingNewPage && (
        <form
          onSubmit={(event) => {
            void handleAddNewPage(event)
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
      )}

      {savedPages.totalPages > 0 ? (
        <CheckboxGroup
          aria-label="Saved pages"
          value={selectedPagesIds}
          onChange={setSelectedPagesIds}
        >
          <ul className="text-sm ">
            {savedPages.savedPages.map((entry) => {
              const isReloading = reloadingUrls.has(entry.url)

              return (
                <li
                  key={`${entry.url}`}
                  className={`${isReloading ? 'opacity-75 pointer-events-none' : 'opacity-100'}`}
                >
                  <Checkbox
                    value={entry.url}
                    isDisabled={isReloading}
                    className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5
                              hover:bg-accent-interactive-dark
                              data-[hovered]:bg-accent-interactive-dark
                              data-[disabled]:opacity-75
                              data-[disabled]:hover:bg-transparent"
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
                        <span className="flex items-center gap-1.5 w-full">
                          <span className="font-normal shrink-0 text-text-dark break-all">
                            {entry.title}
                          </span>
                          <span className="hidden group-hover:inline text-solid-light truncate">
                            {entry.url}
                          </span>
                        </span>
                        <span>
                          <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                            <Button
                              onPress={() => {
                                void handleCopyToClipboard(entry)
                              }}
                              className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                              isDisabled={isReloading}
                            >
                              <CopyIcon />
                            </Button>
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
                          </span>
                        </span>
                        <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm uppercase group-hover:text-text-dark group-hover:border-border-light">
                          {entry.tokenCount?.toLocaleString() ?? '–'}
                        </span>
                      </>
                    )}
                  </Checkbox>
                </li>
              )
            })}
          </ul>
        </CheckboxGroup>
      ) : (
        <div className="text-xs text-text-dark">
          Saved pages will appear here after scraping.
        </div>
      )}
    </PanelDisclosure>
  )
}
