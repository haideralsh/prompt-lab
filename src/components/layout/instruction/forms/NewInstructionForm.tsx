import { InstructionFields } from './InstuctionFields'

interface NewInstructionFormProps {
  name: string
  content: string
  isLoading: boolean
  onNameChange: (value: string) => void
  onContentChange: (value: string) => void
  onCancel: () => void
}

export function NewInstructionForm({
  name,
  content,
  isLoading,
  onNameChange,
  onContentChange,
  onCancel,
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
    />
  )
}
