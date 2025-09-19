import { FormEvent, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Button, Checkbox } from 'react-aria-components'
import { CheckIcon, ReloadIcon, TrashIcon } from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'
import { queue } from '../ToastQueue'
import { useSidebarContext } from '../Sidebar/SidebarContext'

interface WebEntry {
  title: string
  url: string
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong.'
}

export function WebDisclosurePanel() {
  const { directory } = useSidebarContext()
  const [webEntries, setWebEntries] = useState<WebEntry[]>([])
  const [isAddingWeb, setIsAddingWeb] = useState(false)
  const [webUrl, setWebUrl] = useState('')
  const [isSavingWeb, setIsSavingWeb] = useState(false)
  const [reloadingUrls, setReloadingUrls] = useState<Set<string>>(
    () => new Set(),
  )

  useEffect(() => {
    async function loadSavedPages(selectedDirectoryPath: string) {
      try {
        const pages = await invoke<WebEntry[]>('list_saved_pages', {
          directoryPath: selectedDirectoryPath,
        })
        setWebEntries(pages)
      } catch (error) {
        const message = getErrorMessage(error)

        queue.add({
          title: 'Failed to load saved pages',
          description: message,
        })
      }
    }

    if (!directory?.path) {
      setWebEntries([])
      return
    }

    void loadSavedPages(directory.path)
  }, [directory?.path])

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
      if (!directory?.path) {
        queue.add({
          title: 'No directory selected',
          description: 'Select a directory before saving pages.',
        })
        return
      }

      await invoke<WebEntry>('save_page_as_md', {
        directoryPath: directory.path,
        url: trimmedUrl,
      })

      const pages = await invoke<WebEntry[]>('list_saved_pages', {
        directoryPath: directory.path,
      })

      setWebEntries(pages)
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

  async function handleReload(entry: WebEntry) {
    if (!directory || reloadingUrls.has(entry.url)) return

    setReloadingUrls((prev) => {
      const next = new Set(prev)
      next.add(entry.url)
      return next
    })

    try {
      await invoke<void>('delete_saved_page', {
        directoryPath: directory.path,
        url: entry.url,
      })

      await invoke<void>('save_page_as_md', {
        directoryPath: directory.path,
        url: entry.url,
      })

      const pages = await invoke<WebEntry[]>('list_saved_pages', {
        directoryPath: directory.path,
      })

      setWebEntries(pages)
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

  async function handleDelete(entry: WebEntry) {
    // TODO: Show a confirmation dialog before deleting
    if (!directory) return

    try {
      await invoke<void>('delete_saved_page', {
        directoryPath: directory.path,
        url: entry.url,
      })

      const pages = await invoke<WebEntry[]>('list_saved_pages', {
        directoryPath: directory.path,
      })

      setWebEntries(pages)
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to delete page',
        description: message,
      })
    }
  }

  return (
    <PanelDisclosure
      id="web"
      label="Web"
      count={webEntries.length}
      panelClassName="pl-[calc(15px+var(--spacing)*2)] pr-2 pb-4 flex flex-col gap-3"
    >
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
        <ul className="text-sm ">
          {webEntries.map((entry) => {
            const isReloading = reloadingUrls.has(entry.url)

            return (
              <li
                key={`${entry.url}`}
                className={`${isReloading ? 'opacity-75 pointer-events-none' : 'opacity-100'}`}
              >
                <Checkbox
                  defaultSelected
                  isDisabled={isReloading}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5
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
                      <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                        <Button
                          onPress={() => {
                            void handleReload(entry)
                          }}
                          className="text-text-light/75 hover:text-text-light"
                          isDisabled={isReloading}
                        >
                          <ReloadIcon />
                        </Button>
                        <Button
                          onPress={() => {
                            void handleDelete(entry)
                          }}
                          className=" text-red/75 hover:text-red px-1"
                          isDisabled={isReloading}
                        >
                          <TrashIcon />
                        </Button>
                      </span>
                    </>
                  )}
                </Checkbox>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="text-xs text-text-dark">
          Saved pages will appear here after scraping.
        </div>
      )}
    </PanelDisclosure>
  )
}
