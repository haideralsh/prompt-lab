import { FormEvent, useState } from 'react'
import { Checkbox } from 'react-aria-components'
import { CheckIcon } from '@radix-ui/react-icons'
import { NewInstructionForm } from './new-instruction-form'
import { NewInstructionTextarea } from './new-instruction-textarea'
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
  const [textareaContent, setTextareaContent] = useState('')
  const [newFormName, setNewFormName] = useState('')
  const [newFormContent, setNewFormContent] = useState('')

  function resetNewForm() {
    setNewFormName('')
    setNewFormContent('')
  }

  function updateTextareaDraft(nextContent: string) {
    const hasContent = nextContent.trim().length > 0
    if (!hasContent) {
      onUnsavedInstructionChange(null)
      return
    }

    onUnsavedInstructionChange({ name: '', content: nextContent })
  }

  function handleTextareaContentChange(newContent: string) {
    setTextareaContent(newContent)
    const trimmedContent = newContent.trim()
    onUnsavedInstructionPresenceChange(trimmedContent.length > 0)
    updateTextareaDraft(newContent)
  }

  function handleNewFormNameChange(newName: string) {
    setNewFormName(newName)
  }

  function handleNewFormContentChange(newContent: string) {
    setNewFormContent(newContent)
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const trimmedContent = newFormContent.trim()
    const trimmedName = newFormName.trim()
    if (!trimmedContent || !trimmedName || isLoading) return

    await onSave({ name: trimmedName, content: trimmedContent })
    resetNewForm()
  }

  function handleCancel() {
    resetNewForm()
    onCancel()
  }

  function handleBookmarkClick() {
    setNewFormContent(textareaContent)
    onStartAdd()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mr-2 mt-0.5 mb-2">
        <div className="flex items-start">
          {isAddingNew ? (
            <NewInstructionForm
              name={newFormName}
              content={newFormContent}
              isLoading={isLoading}
              onNameChange={handleNewFormNameChange}
              onContentChange={handleNewFormContentChange}
              onCancel={handleCancel}
              onSubmit={() => handleSubmit()}
            />
          ) : (
            <>
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
              <NewInstructionTextarea
                content={textareaContent}
                isLoading={isLoading}
                onContentChange={handleTextareaContentChange}
                onCopy={onCopy}
                onBookmarkClick={handleBookmarkClick}
                tokenCount={draftTokenCount}
              />
            </>
          )}
        </div>
      </div>
    </form>
  )
}
