import { useEffect, useRef, useState } from 'react'
import { queue } from '../../ToastQueue'
import { getErrorMessage } from '../../../helpers/getErrorMessage'
import { fetchSavedPages } from './lib'
import { useAtomValue, useSetAtom } from 'jotai'
import { directoryAtom, selectedPagesIdsAtom } from '../../../state/atoms'
import { GhostButton } from '../../common/GhostButton'
import { editSavedPage, SavedPageMetadata, SavedPages } from '@/api/web'

type EditSavedPageProps = {
  page: SavedPageMetadata
  onSave: (savedPages: SavedPages) => void
  onCancel: () => void
}

export function EditSavedPage({ page, onSave, onCancel }: EditSavedPageProps) {
  const directory = useAtomValue(directoryAtom)
  const setSelectedPagesIds = useSetAtom(selectedPagesIdsAtom)
  const [editingTitle, setEditingTitle] = useState(page.title)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  if (!directory) {
    return null
  }

  const inputId = `edit-title-${encodeURIComponent(page.url)}`

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function preserveSelectedPages(
    allPages: SavedPages,
    selectedUrls: Set<string>
  ) {
    const allUrls = new Set(allPages.map((page) => page.url))
    const updatedAllPages = new Set<string>()

    for (const id of selectedUrls) {
      if (allUrls.has(id)) updatedAllPages.add(id)
    }

    return updatedAllPages
  }

  async function handleSubmit() {
    const trimmedTitle = editingTitle.trim()
    if (!trimmedTitle) return

    try {
      setIsSaving(true)

      await editSavedPage({
        directoryPath: directory.path,
        url: page.url,
        newTitle: trimmedTitle,
      })

      const pages = await fetchSavedPages(directory.path)

      setSelectedPagesIds((selectedUrls) =>
        preserveSelectedPages(pages, selectedUrls)
      )
      onSave(pages)
    } catch (error) {
      const message = getErrorMessage(error)
      queue.add({
        title: 'Failed to update title',
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}
      className="ml-7 px-2 py-0.5"
    >
      <label className="sr-only" htmlFor={inputId}>
        Edit title
      </label>
      <div className="px-1.5 rounded-sm group bg-transparent border border-interactive-light has-focus:border-border-mid">
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={inputRef}
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            disabled={isSaving}
            className="selection:bg-accent-border-light selection:text-text-light placeholder:text-sm placeholder:text-solid-light w-full text-text-dark py-1 pl-1 pr-26 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
          />

          <div className="absolute inset-y-0 right-0.5 flex items-center gap-1.5">
            <GhostButton
              type="submit"
              isDisabled={isSaving || !editingTitle.trim()}
            >
              Save
            </GhostButton>
            <GhostButton type="button" onPress={onCancel} isDisabled={isSaving}>
              Cancel
            </GhostButton>
          </div>
        </div>
      </div>
    </form>
  )
}
