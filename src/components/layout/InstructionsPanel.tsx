import { FormEvent, useState } from 'react'
import { Button, Checkbox } from 'react-aria-components'
import { BookmarkIcon, CheckIcon, DrawingPinIcon } from '@radix-ui/react-icons'
import { PanelDisclosure } from './PanelDisclosure'
import { useSidebarContext } from '../Sidebar/SidebarContext'
import { invoke } from '@tauri-apps/api/core'
import { getErrorMessage } from '../../helpers/getErrorMessage'
import { queue } from '../ToastQueue'
import { CopyButton } from '../common/CopyButton'
import { PinIcon } from 'lucide-react'

interface SavedInstructionMetadata {
  id: string
  name: string
  content: string
  token_count: number
}

type SavedInstructions = SavedInstructionMetadata[]

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
  const [instruction, setInstruction] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInstructionSelected, setIsInstructionSelected] = useState(true)
  const [mode, setMode] = useState<'saving' | 'idle'>('idle')
  const [instructionTitle, setInstructionTitle] = useState('')

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
        trimmedInstruction,
        trimmedInstruction
      )

      setInstructions(allInstructions)
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
    >
      <form
        onSubmit={(event) => {
          void handleAddNewInstruction(event)
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
              className="group mt-1 flex-shrink-0 px-2"
            >
              {({ isSelected }) => (
                <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light">
                  {isSelected && <CheckIcon />}
                </span>
              )}
            </Checkbox>
            {mode === 'saving' ? (
              <div className="flex-1 rounded-sm bg-transparent border border-interactive-light has-focus:border-border-mid px-1.5 py-1">
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
              <div className="flex-1 rounded-sm bg-transparent border border-interactive-light has-focus:border-border-mid">
                <label className="sr-only" htmlFor="user-instruction">
                  Enter your instructions here...
                </label>
                <div className="group relative flex items-center pb-6">
                  <textarea
                    id="user-instruction"
                    placeholder="Enter your instructions here..."
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    disabled={isLoading}
                    rows={8}
                    className="resize-none placeholder:text-sm placeholder:text-solid-light w-full text-text-dark py-1.5 px-2 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60 "
                  />

                  <div className="absolute bottom-1.5 right-1.5 hidden group-hover:flex group-hover:items-center group-hover:gap-1.5 group-has-focus:flex group-has-focus:items-center group-has-focus:gap-1.5">
                    <Button
                      type="button"
                      onPress={() => {
                        setMode('saving')
                      }}
                      className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                    >
                      <DrawingPinIcon />
                    </Button>
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
