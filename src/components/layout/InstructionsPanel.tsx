import { FormEvent, useState } from 'react'
import { Checkbox } from 'react-aria-components'
import { CheckIcon } from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'

export function InstructionsPanel() {
  const [instruction, setInstruction] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isInstructionSelected, setIsInstructionSelected] = useState(true)

  async function handleAddNewPage(event?: FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault()
    }

    const trimmedInstruction = instruction.trim()
    if (!trimmedInstruction || isSaving) return

    setIsSaving(true)

    // try {
    //   if (!directory?.path) {
    //     queue.add({
    //       title: 'No directory selected',
    //       description: 'Select a directory before saving pages.',
    //     })
    //     return
    //   }

    //   await invoke<SavedPageMetadata>('save_page_as_md', {
    //     directoryPath: directory.path,
    //     url: trimmedUrl,
    //   })

    //   const pages = await invoke<SavedPages>('list_saved_pages', {
    //     directoryPath: directory.path,
    //   })

    //   setSavedPages(pages)
    //   setSelectedPagesIds((selectedUrls) =>
    //     preserveSelectedPages(pages, selectedUrls),
    //   )

    //   setWebUrl('')
    //   setIsAddingWeb(false)
    // } catch (error) {
    //   const message = getErrorMessage(error)

    //   queue.add({
    //     title: 'Failed to add URL',
    //     description: message,
    //   })
    // } finally {
    //   setIsSavingWeb(false)
    // }
  }

  // async function handleDelete(entry: SavedPageMetadata) {
  //   // TODO: Show a confirmation dialog before deleting
  //   if (!directory) return

  //   try {
  //     await invoke<void>('delete_saved_page', {
  //       directoryPath: directory.path,
  //       url: entry.url,
  //     })

  //     const pages = await invoke<SavedPages>('list_saved_pages', {
  //       directoryPath: directory.path,
  //     })

  //     setSavedPages(pages)
  //     setSelectedPagesIds((prev) => {
  //       const next = new Set(prev)
  //       next.delete(entry.url)
  //       return next
  //     })
  //   } catch (error) {
  //     const message = getErrorMessage(error)

  //     queue.add({
  //       title: 'Failed to delete page',
  //       description: message,
  //     })
  //   }
  // }

  // async function handleCopyToClipboard(entry: SavedPageMetadata) {
  //   if (!directory?.path) return

  //   await invoke<void>('copy_pages_to_clipboard', {
  //     directoryPath: directory.path,
  //     urls: [entry.url],
  //   })
  // }

  // async function handleCopySelectedToClipboard() {
  //   if (!directory?.path) return

  //   await invoke<void>('copy_pages_to_clipboard', {
  //     directoryPath: directory.path,
  //     urls: Array.from(selectedPagesIds),
  //   })
  // }

  // function selectAll() {
  //   setSelectedPagesIds(() => new Set(savedPages.map((e) => e.url)))
  // }

  // function deselectAll() {
  //   setSelectedPagesIds(() => new Set())
  // }

  // const isGroupSelected =
  //   savedPages.length > 0 && selectedPagesIds.size === savedPages.length
  // const isGroupIndeterminate =
  //   selectedPagesIds.size > 0 && selectedPagesIds.size < savedPages.length

  return (
    <PanelDisclosure
      id="instructions"
      label="Instructions"
      count={0} // TODO
      panelClassName="p-2 flex flex-col gap-1"
      isGroupSelected={isInstructionSelected}
      isGroupIndeterminate={false}
      onSelectAll={() => {
        setIsInstructionSelected(true)
      }}
      onDeselectAll={() => {
        setIsInstructionSelected(false)
      }}
      tokenCount={0}
      actions={null}
      // tokenCount={savedPages
      //   .filter((page) => selectedPagesIds.has(page.url))
      //   .reduce((acc, page) => acc + page.tokenCount, 0)}
      // actions={
      //   <WebPanelActions
      //     isAddingNewPage={isAddingNewPage}
      //     onShowAddNewPress={showAddNewPageForm}
      //     onCopyToClipboardPress={handleCopySelectedToClipboard}
      //   />
      // }
    >
      <form
        onSubmit={(event) => {
          void handleAddNewPage(event)
        }}
      >
        <div className="mr-2 mt-1 mb-2">
          <div className="flex items-start gap-2">
            <Checkbox
              slot="selection"
              aria-label="Include instructions"
              isSelected={isInstructionSelected}
              onChange={(selected) => {
                setIsInstructionSelected(selected)
              }}
              className="group mt-1 flex-shrink-0"
            >
              {({ isSelected }) => (
                <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light">
                  {isSelected && <CheckIcon />}
                </span>
              )}
            </Checkbox>
            <div className="flex-1 rounded-sm bg-transparent border border-interactive-light has-focus:border-border-mid ">
              <label className="sr-only" htmlFor="user-instruction">
                Enter your instructions here...
              </label>
              <div className="relative flex items-center">
                <textarea
                  id="user-instruction"
                  placeholder="Enter your instructions here..."
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                  disabled={isSaving}
                  rows={6}
                  className="placeholder:text-sm placeholder:text-solid-light w-full text-text-dark py-1.5 px-2 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
                />

                {/*<div className="absolute inset-y-0 right-0.5 flex items-center gap-1.5">
                <Button
                  type="submit"
                  isDisabled={isSavingWeb || !webUrl.trim()}
                  className="text-xs  tracking-wide p-1 flex items-center justify-center rounded-sm  text-text-dark data-[disabled]:text-text-dark/60  hover:text-text-light"
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
              </div>*/}
              </div>
            </div>
          </div>
        </div>
      </form>
    </PanelDisclosure>
  )
}
