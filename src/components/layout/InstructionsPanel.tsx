import { FormEvent, useEffect, useState } from 'react'
import { Button, Checkbox, CheckboxGroup } from 'react-aria-components'
import {
  BookmarkFilledIcon,
  BookmarkIcon,
  CheckIcon,
  CopyIcon,
  Pencil1Icon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import { invoke } from '@tauri-apps/api/core'
import { getErrorMessage } from '../../helpers/getErrorMessage'
import { queue } from '../ToastQueue'
import { CopyButton } from '../common/CopyButton'

interface SavedInstructionMetadata {
  id: string
  name: string
  content: string
  tokenCount: number
}

type SavedInstructions = SavedInstructionMetadata[]

import { preserveSelected } from '../../helpers/preserveSelected'

async function listInstructions(directoryPath: string) {
  return invoke<SavedInstructions>('list_instructions', {
    directoryPath,
  })
}

async function saveInstruction(
  directoryPath: string,
  name: string,
  content: string
) {
  await invoke<string>('save_instruction', {
    directoryPath,
    name,
    content,
  })

  return listInstructions(directoryPath)
}

export function InstructionsPanel() {
  const { directory } = useSidebarContext()
  const [instructions, setInstructions] = useState<SavedInstructions>([])
  const [selectedInstructionIds, setSelectedInstructionIds] = useState<
    Set<string>
  >(() => new Set())
  const [instruction, setInstruction] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInstructionSelected, setIsInstructionSelected] = useState(true)
  const [mode, setMode] = useState<'saving' | 'idle'>('idle')
  const [instructionTitle, setInstructionTitle] = useState('')

  useEffect(() => {
    async function loadInstructions() {
      try {
        const loadedInstructions = await listInstructions(directory.path)
        setInstructions(loadedInstructions)
        setSelectedInstructionIds(() => new Set())
      } catch (error) {
        const message = getErrorMessage(error)

        queue.add({
          title: 'Failed to load instructions',
          description: message,
        })
      }
    }

    void loadInstructions()
  }, [directory?.path])

  async function handleAddNewInstruction(event?: FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault()
    }

    const trimmedInstruction = instruction.trim()
    if (!trimmedInstruction || isLoading) return

    setIsLoading(true)

    try {
      const allInstructions = await saveInstruction(
        directory.path,
        instructionTitle.trim(),
        trimmedInstruction
      )

      setInstructions(allInstructions)
      setSelectedInstructionIds((selectedIds) =>
        preserveSelected(
          allInstructions,
          selectedIds,
          (instruction) => instruction.id
        )
      )
      setInstruction('')
      setInstructionTitle('')
      setMode('idle')
    } catch (error) {
      const message = getErrorMessage(error)

      queue.add({
        title: 'Failed to save instruction',
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PanelDisclosure
      id="instructions"
      label="Instructions"
      count={instructions.length}
      panelClassName="p-2 flex flex-col"
      isGroupSelected={
        instructions.length > 0 &&
        selectedInstructionIds.size === instructions.length
      }
      isGroupIndeterminate={
        selectedInstructionIds.size > 0 &&
        selectedInstructionIds.size < instructions.length
      }
      onSelectAll={() => {
        setSelectedInstructionIds(
          () => new Set(instructions.map((instruction) => instruction.id))
        )
        setIsInstructionSelected(true)
      }}
      onDeselectAll={() => {
        setSelectedInstructionIds(() => new Set())
        setIsInstructionSelected(false)
      }}
      tokenCount={instructions.reduce((accumulator, entry) => {
        if (selectedInstructionIds.has(entry.id)) {
          return accumulator + (entry.tokenCount ?? 0)
        }

        return accumulator
      }, 0)}
      actions={null}
    >
      {instructions.length > 0 && (
        <CheckboxGroup
          aria-label="Saved instructions"
          value={Array.from(selectedInstructionIds)}
          onChange={(values) => setSelectedInstructionIds(new Set(values))}
          className="text-text-dark"
        >
          <ul className="text-sm text-text-dark">
            {instructions.map((entry) => (
              <li key={entry.id}>
                <Checkbox
                  value={entry.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
                  slot="selection"
                >
                  {({ isSelected }) => (
                    <>
                      <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light flex-shrink-0">
                        {isSelected && <CheckIcon />}
                      </span>
                      <span className="flex items-center gap-1.5 w-full min-w-0">
                        <span
                          className="font-normal text-text-dark break-words truncate"
                          title={entry.name}
                        >
                          {entry.name}
                        </span>
                        <span
                          className="hidden group-hover:inline text-solid-light truncate"
                          title={entry.content}
                        >
                          {entry.content}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                          <Button className="text-text-light/75 hover:text-text-light">
                            <Pencil1Icon />
                          </Button>
                          <Button className="text-text-light/75 hover:text-text-light">
                            <CopyIcon />
                          </Button>
                          <Button className=" text-red/75 hover:text-red">
                            <TrashIcon />
                          </Button>
                        </span>
                        <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm uppercase">
                          {entry.tokenCount?.toLocaleString() ?? '-'}
                        </span>
                      </span>
                    </>
                  )}
                </Checkbox>
              </li>
            ))}
          </ul>
        </CheckboxGroup>
      )}

      <form
        onSubmit={(event) => {
          void handleAddNewInstruction(event)
        }}
      >
        <div className="mr-2 mt-0.5 mb-2">
          <div className="flex items-start gap-1">
            <Checkbox
              slot="selection"
              aria-label="Include instructions"
              isSelected={isInstructionSelected}
              onChange={(selected) => {
                setIsInstructionSelected(selected)
              }}
              className="group mt-1 flex-shrink-0 px-2"
            >
              {({ isSelected }) => (
                <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light">
                  {isSelected && <CheckIcon />}
                </span>
              )}
            </Checkbox>
            {mode === 'saving' ? (
              <div className="flex-1 rounded-sm bg-transparent border border-interactive-light has-focus:border-border-mid px-1.5 py-1 mt-1">
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="sr-only" htmlFor="bookmark-title">
                      Instruction title
                    </label>
                    <input
                      id="bookmark-title"
                      type="text"
                      placeholder="Add a title"
                      value={instructionTitle}
                      onChange={(event) =>
                        setInstructionTitle(event.target.value)
                      }
                      disabled={isLoading}
                      required
                      className="placeholder:text-sm placeholder:text-solid-light w-full text-text-dark px-1 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
                    />
                  </div>

                  <div
                    role="presentation"
                    className="h-px bg-interactive-light"
                  />

                  <div className="flex-1">
                    <label className="sr-only" htmlFor="bookmark-instruction">
                      Instruction
                    </label>
                    <textarea
                      id="bookmark-instruction"
                      placeholder="Enter your instructions here..."
                      value={instruction}
                      onChange={(event) => setInstruction(event.target.value)}
                      disabled={isLoading}
                      rows={6}
                      required
                      className="resize-none placeholder:text-sm placeholder:text-solid-light w-full text-text-dark px-1 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <Button
                      type="submit"
                      isDisabled={
                        isLoading ||
                        !instruction.trim() ||
                        !instructionTitle.trim()
                      }
                      className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark data-[disabled]:text-text-dark/60 hover:text-text-light"
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      onPress={() => {
                        setMode('idle')
                        setInstructionTitle('')
                      }}
                      className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark hover:text-text-light"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 rounded-sm bg-transparent border border-interactive-light has-focus:border-border-mid mt-1">
                <label className="sr-only" htmlFor="user-instruction">
                  Enter your instructions here...
                </label>
                <div className="group/textarea relative flex items-center pb-6">
                  <textarea
                    id="user-instruction"
                    placeholder="Enter your instructions here..."
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    disabled={isLoading}
                    rows={8}
                    className="resize-none placeholder:text-sm placeholder:text-solid-light w-full text-text-dark py-1.5 px-2 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60 "
                  />

                  <div className="absolute bottom-1.5 right-1.5 hidden group-hover/textarea:flex group-hover/textarea:items-center group-hover/textarea:gap-1.5 group-has-focus/textarea:flex group-has-focus/textarea:items-center group-has-focus/textarea:gap-1.5">
                    <Button
                      type="button"
                      onPress={() => {
                        setMode('saving')
                      }}
                      className="group/button text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                    >
                      <BookmarkIcon className="group-hover/button:hidden" />
                      <BookmarkFilledIcon className="hidden group-hover/button:block text-accent-solid-dark" />
                    </Button>
                    {/* @ts-expect-error */}
                    <CopyButton className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </PanelDisclosure>
  )
}
