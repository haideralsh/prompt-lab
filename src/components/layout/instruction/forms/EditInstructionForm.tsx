import { FormEvent, useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { SavedInstructionMetadata, Instruction } from '../types'
import { InstructionFields } from './InstuctionFields'

interface EditInstructionFormProps {
  instruction: SavedInstructionMetadata
  isLoading: boolean
  onSave: (data: Instruction) => void
  onCancel: () => void
}

export function EditInstructionForm({
  instruction,
  isLoading,
  onSave,
  onCancel,
}: EditInstructionFormProps) {
  const [title, setTitle] = useState(instruction.name)
  const [content, setContent] = useState(instruction.content)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent || isLoading) return
    onSave({ name: trimmedTitle, content: trimmedContent })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-[auto_1fr] gap-x-3 px-2 mb-1"
    >
      <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-accent-border-mid bg-accent-interactive-light flex-shrink-0 mt-2">
        <CheckIcon />
      </span>

      <InstructionFields
        id={instruction.id}
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onCancel={onCancel}
        isLoading={isLoading}
      />
    </form>
  )
}
