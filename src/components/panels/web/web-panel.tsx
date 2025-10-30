import { FormEvent, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Button } from 'react-aria-components'
import {
  GlobeIcon,
  Pencil1Icon,
  ReloadIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { queue } from '@/components/toasts/toast-queue'
import { flushSync } from 'react-dom'
import { getErrorMessage } from '../../../helpers/get-error-message'
import { CopyButton } from '../../common/copy-button'
import { EditSavedPage } from './edit-saved-page-form'
import { GhostButton } from '../../common/ghost-button'

import { preserveSelected } from '../../../helpers/preserve-selected'
import { TokenCount } from '../../common/token-count'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  directoryAtom,
  selectedPagesIdsAtom,
  totalPagesTokenCountAtom,
} from '../../../state/atoms'
import {
  deleteSavedPage,
  SavedPageMetadata,
  savePageAsMd,
  type SavedPages,
} from '@/api/web'
import { fetchSavedPages } from './lib'
import { WebPanelActions } from './web-panel-actions'
import { Panel } from '../panel/panel'
import { PanelList } from '../panel/panel-list'
import { PanelRowCheckbox } from '../panel/panel-row-checkbox'
import { EmptyPanelListMessage } from '@/components/panels/panel/empty-panel-list-message'

export function WebDisclosurePanel() {
  const directory = useAtomValue(directoryAtom)
  const [selectedPagesIds, setSelectedPagesIds] = useAtom(selectedPagesIdsAtom)
  const setTotalPagesTokenCount = useSetAtom(totalPagesTokenCountAtom)
  const [savedPages, setSavedPages] = useState<SavedPages>([])
  const [isAddingNewPage, setIsAddingWeb] = useState(false)
  const [webUrl, setWebUrl] = useState('')
  const [isSavingWeb, setIsSavingWeb] = useState(false)
  const [reloadingUrls, setReloadingUrls] = useState<Set<string>>(
    () => new Set(),
  )
  const webUrlInputRef = useRef<HTMLInputElement | null>(null)
  const [editingPageUrl, setEditingPageUrl] = useState<string | null>(null)
  const [brokenFavicons, setBrokenFavicons] = useState<Set<string>>(
    () => new Set(),
  )

  const totalPagesTokenCount = savedPages
    .filter((page) => selectedPagesIds.has(page.url))
    .reduce((acc, page) => acc + page.tokenCount, 0)

  useEffect(() => {
    setTotalPagesTokenCount(totalPagesTokenCount)
  }, [totalPagesTokenCount, setTotalPagesTokenCount])

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
      await savePageAsMd({ directoryPath: directory.path, url: trimmedUrl })

      const pages = await fetchSavedPages(directory.path)

      setSavedPages(pages)
      setSelectedPagesIds((selectedUrls) =>
        preserveSelected(pages, selectedUrls, (page) => page.url),
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
      await savePageAsMd({ directoryPath: directory.path, url: entry.url })

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
      await deleteSavedPage({
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
      tokenCount={totalPagesTokenCount}
      actions={
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
          onChangeSelectedValues={(values: Set<string>) =>
            setSelectedPagesIds(values)
          }
          className="text-sm"
        >
          {savedPages.map((entry) => {
            const isReloading = reloadingUrls.has(entry.url)
            const isEditing = editingPageUrl === entry.url

            return (
              <li
                key={`${entry.url}`}
                className={`${
                  isReloading ? 'pointer-events-none opacity-75' : 'opacity-100'
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
                          className="text-red/75 hover:text-red data-[disabled]:text-red/75"
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
                            new Set(prev).add(entry.url),
                          )
                        }
                        alt={entry.title}
                        className="size-[15px] rounded-xs"
                      />
                    ) : (
                      <GlobeIcon className="text-solid-light" />
                    )}
                    <span className="shrink-0 font-normal text-text-dark">
                      {entry.title}
                    </span>
                    <span className="hidden truncate text-solid-light group-hover:inline">
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
          <div className="mt-1 mr-2 mb-2 ml-8">
            <div className="group rounded-sm bg-transparent outline-1 -outline-offset-1 outline-interactive-light has-[input:focus-within]:outline-1 has-[input:focus-within]:-outline-offset-1 has-[input:focus-within]:outline-border-mid">
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
                  className="min-w-0 grow bg-transparent px-2 py-1.5 text-sm text-text-dark placeholder:text-solid-light focus:outline-none disabled:text-text-dark/60"
                />

                <div className="flex items-center gap-1.5 px-1">
                  <GhostButton
                    type="submit"
                    isDisabled={isSavingWeb || !webUrl.trim()}
                  >
                    Add
                  </GhostButton>
                  <GhostButton
                    type="button"
                    onPress={handleCancelWeb}
                    isDisabled={isSavingWeb}
                  >
                    Cancel
                  </GhostButton>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Panel>
  )
}
