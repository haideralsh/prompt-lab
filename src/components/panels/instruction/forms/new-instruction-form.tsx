import { InstructionFields } from './instruction-fields'

interface NewInstructionFormProps {
  name: string
  content: string
  isLoading: boolean
  onNameChange: (value: string) => void
  onContentChange: (value: string) => void
  onCancel: () => void
  onSubmit?: () => void
}

export function NewInstructionForm({
  name,
  content,
  isLoading,
  onNameChange,
  onContentChange,
  onCancel,
  onSubmit,
}: NewInstructionFormProps) {
  return (
    <InstructionFields
      id="new-instruction"
      title={name}
      content={content}
      isLoading={isLoading}
      onTitleChange={onNameChange}
      onContentChange={onContentChange}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  )
}
