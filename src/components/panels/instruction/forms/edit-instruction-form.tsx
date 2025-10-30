import { FormEvent, useState } from 'react'
import { SavedInstructionMetadata, Instruction } from '../types'
import { InstructionFields } from './instruction-fields'

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

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent || isLoading) return
    onSave({ name: trimmedTitle, content: trimmedContent })
  }

  return (
    <form onSubmit={handleSubmit} className="mr-2">
      <InstructionFields
        id={instruction.id}
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onCancel={onCancel}
        onSubmit={() => handleSubmit()}
        isLoading={isLoading}
      />
    </form>
  )
}
