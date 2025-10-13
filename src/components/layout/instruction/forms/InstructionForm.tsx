import { FormEvent, useState } from 'react'
import { Checkbox } from 'react-aria-components'
import { CheckIcon } from '@radix-ui/react-icons'
import { NewInstructionForm } from './NewInstructionForm'
import { NewInstructionTextarea } from './NewInstructionTextarea'
import { Instruction } from '../types'

interface InstructionFormProps {
  editingInstruction: null
  isLoading: boolean
  isAddingNew: boolean
  onSave: (data: Instruction) => Promise<void>
  onCancel: () => void
  onStartAdd: () => void
  onCopy: (instruction: Instruction) => Promise<void>
  isIncluded: boolean
  onIncludeChange: (selected: boolean) => void
  onUnsavedInstructionPresenceChange: (hasUnsavedInstruction: boolean) => void
  onUnsavedInstructionChange: (instruction: Instruction | null) => void
  draftTokenCount: number
}

export function InstructionForm({
  isLoading,
  isAddingNew,
  draftTokenCount,
  onSave,
  onCancel,
  onStartAdd,
  onCopy,
  isIncluded,
  onIncludeChange,
  onUnsavedInstructionPresenceChange,
  onUnsavedInstructionChange,
}: InstructionFormProps) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')

  function reset() {
    setName('')
    setContent('')
    onUnsavedInstructionChange(null)
    onUnsavedInstructionPresenceChange(false)
  }

  function updateDraft(nextName: string, nextContent: string) {
    const hasContent = nextContent.trim().length > 0
    if (!hasContent) {
      onUnsavedInstructionChange(null)
      return
    }

    onUnsavedInstructionChange({ name: nextName, content: nextContent })
  }

  function handleContentChange(newContent: string) {
    setContent(newContent)
    const trimmedContent = newContent.trim()
    onUnsavedInstructionPresenceChange(trimmedContent.length > 0)
    updateDraft(name, newContent)
  }

  function handleNameChange(newName: string) {
    setName(newName)
    updateDraft(newName, content)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedContent = content.trim()
    const trimmedName = name.trim()
    if (!trimmedContent || !trimmedName || isLoading) return

    await onSave({ name: trimmedName, content: trimmedContent })
    reset()
  }

  function handleCancel() {
    onCancel()
  }

  function handleBookmarkClick() {
    onStartAdd()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mr-2 mt-0.5 mb-2">
        <div className="flex items-start">
          <Checkbox
            slot="selection"
            aria-label="Include instructions"
            isSelected={isIncluded}
            onChange={onIncludeChange}
            className="relative group mt-1 flex-shrink-0 px-2"
          >
            {({ isSelected }) => (
              <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light">
                {isSelected && <CheckIcon />}
              </span>
            )}
          </Checkbox>
          {isAddingNew ? (
            <NewInstructionForm
              name={name}
              content={content}
              isLoading={isLoading}
              onNameChange={handleNameChange}
              onContentChange={handleContentChange}
              onCancel={handleCancel}
            />
          ) : (
            <NewInstructionTextarea
              content={content}
              isLoading={isLoading}
              onContentChange={handleContentChange}
              onCopy={onCopy}
              onBookmarkClick={handleBookmarkClick}
              tokenCount={draftTokenCount}
            />
          )}
        </div>
      </div>
    </form>
  )
}
