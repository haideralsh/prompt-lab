import { FormEvent, useState } from 'react'
import { Button } from 'react-aria-components'
import { CheckIcon } from '@radix-ui/react-icons'
import { SavedInstructionMetadata, Instruction } from './types'

interface InlineEditFormProps {
  instruction: SavedInstructionMetadata
  isLoading: boolean
  onSave: (data: Instruction) => void
  onCancel: () => void
}

export function InlineEditForm({
  instruction,
  isLoading,
  onSave,
  onCancel,
}: InlineEditFormProps) {
  const [title, setTitle] = useState(instruction.name)
  const [content, setContent] = useState(instruction.content)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedContent = content.trim()
    const trimmedTitle = title.trim()
    if (!trimmedContent || !trimmedTitle || isLoading) return
    onSave({ title: trimmedTitle, content: trimmedContent })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-[auto_1fr] gap-x-3 px-2 py-0.5 mb-1"
    >
      {/* Checkbox placeholder to maintain alignment */}
      <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-accent-border-mid bg-accent-interactive-light flex-shrink-0 mt-2">
        <CheckIcon />
      </span>

      <div className="flex-1 rounded-sm bg-transparent border border-border-mid px-1.5 py-1 mt-1">
        <div className="flex flex-col gap-2">
          <div>
            <label className="sr-only" htmlFor={`edit-title-${instruction.id}`}>
              Instruction title
            </label>
            <input
              id={`edit-title-${instruction.id}`}
              type="text"
              placeholder="Add a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              required
              autoFocus
              className="placeholder:text-sm placeholder:text-solid-light w-full text-text-dark px-1 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
            />
          </div>
          <div role="presentation" className="h-px bg-interactive-light" />
          <div className="flex-1">
            <label
              className="sr-only"
              htmlFor={`edit-content-${instruction.id}`}
            >
              Instruction content
            </label>
            <textarea
              id={`edit-content-${instruction.id}`}
              placeholder="Enter your instructions here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              rows={4}
              required
              className="resize-none placeholder:text-sm placeholder:text-solid-light w-full text-text-dark px-1 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <Button
              type="submit"
              isDisabled={isLoading || !content.trim() || !title.trim()}
              className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark data-[disabled]:text-text-dark/60 hover:text-text-light"
            >
              Save
            </Button>
            <Button
              type="button"
              onPress={onCancel}
              isDisabled={isLoading}
              className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark hover:text-text-light data-[disabled]:text-text-dark/60"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
