import { ChangeEvent } from 'react'
import { Button } from 'react-aria-components'
import clsx from 'clsx'

export interface InstructionFieldsProps {
  id: string
  title: string
  content: string
  isLoading?: boolean
  submitLabel?: string
  rows?: number
  className?: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onCancel: () => void
}

export function InstructionFields({
  id,
  title,
  content,
  isLoading = false,
  onTitleChange,
  onContentChange,
  onCancel,
  submitLabel = 'Save',
  rows = 4,
  className,
}: InstructionFieldsProps) {
  const titleId = `${id}-title`
  const contentId = `${id}-content`

  const handleTitle = (e: ChangeEvent<HTMLInputElement>) =>
    onTitleChange(e.target.value)
  const handleContent = (e: ChangeEvent<HTMLTextAreaElement>) =>
    onContentChange(e.target.value)

  const saveDisabled = isLoading || !title.trim() || !content.trim()

  return (
    <div
      className={clsx(
        'flex-1 rounded-sm bg-transparent border border-interactive-light has-focus:border-border-mid px-1.5 py-1 mt-1',
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <div>
          <label className="sr-only" htmlFor={titleId}>
            Instruction title
          </label>
          <input
            id={titleId}
            type="text"
            placeholder="Add a title"
            value={title}
            onChange={handleTitle}
            disabled={isLoading}
            required
            autoFocus
            className="placeholder:text-sm placeholder:text-solid-light w-full text-text-dark px-1 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
          />
        </div>

        <div role="presentation" className="h-px bg-interactive-light" />

        <div className="flex-1">
          <label className="sr-only" htmlFor={contentId}>
            Instruction content
          </label>
          <textarea
            id={contentId}
            placeholder="Enter your instructions here..."
            value={content}
            onChange={handleContent}
            disabled={isLoading}
            rows={rows}
            required
            className="resize-none placeholder:text-sm placeholder:text-solid-light w-full text-text-dark px-1 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
          />
        </div>

        <div className="flex items-center justify-end gap-1.5 pt-1">
          <Button
            type="submit"
            isDisabled={saveDisabled}
            className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark data-[disabled]:text-text-dark/60 hover:text-text-light"
          >
            {submitLabel}
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
  )
}
