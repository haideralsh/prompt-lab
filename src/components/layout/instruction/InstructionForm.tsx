import { FormEvent, useState } from 'react'
import { Button, Checkbox } from 'react-aria-components'
import {
  BookmarkFilledIcon,
  BookmarkIcon,
  CheckIcon,
} from '@radix-ui/react-icons'
import { CopyButton } from '../../common/CopyButton'
import { Instruction } from './types'

interface InstructionFormProps {
  editingInstruction: null
  isLoading: boolean
  isAddingNew: boolean
  onSave: (data: Instruction) => Promise<void>
  onCancel: () => void
  onStartAdd: () => void
  onCopy: (instruction: Instruction) => Promise<void>
}

export function InstructionForm({
  isLoading,
  isAddingNew,
  onSave,
  onCancel,
  onStartAdd,
  onCopy,
}: InstructionFormProps) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [isIncluded, setIsIncluded] = useState(true)

  function reset() {
    setName('')
    setContent('')
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
    reset()
    onCancel()
  }

  function handleBookmarkClick() {
    onStartAdd()
  }

  function handleIncludeChange(selected: boolean) {
    setIsIncluded(selected)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mr-2 mt-0.5 mb-2">
        <div className="flex items-start gap-1">
          <Checkbox
            slot="selection"
            aria-label="Include instructions"
            isSelected={isIncluded}
            onChange={handleIncludeChange}
            className="group mt-1 flex-shrink-0 px-2"
          >
            {({ isSelected }) => (
              <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light">
                {isSelected && <CheckIcon />}
              </span>
            )}
          </Checkbox>
          {isAddingNew ? (
            <SaveModeForm
              name={name}
              content={content}
              isLoading={isLoading}
              onNameChange={setName}
              onContentChange={setContent}
              onCancel={handleCancel}
            />
          ) : (
            <IdleModeForm
              content={content}
              isLoading={isLoading}
              onContentChange={setContent}
              onCopy={onCopy}
              onBookmarkClick={handleBookmarkClick}
            />
          )}
        </div>
      </div>
    </form>
  )
}

interface SaveModeFormProps {
  name: string
  content: string
  isLoading: boolean
  onNameChange: (value: string) => void
  onContentChange: (value: string) => void
  onCancel: () => void
}

function SaveModeForm({
  name,
  content,
  isLoading,
  onNameChange,
  onContentChange,
  onCancel,
}: SaveModeFormProps) {
  return (
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
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={isLoading}
            required
            className="placeholder:text-sm placeholder:text-solid-light w-full text-text-dark px-1 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
          />
        </div>
        <div role="presentation" className="h-px bg-interactive-light" />
        <div className="flex-1">
          <label className="sr-only" htmlFor="bookmark-instruction">
            Instruction
          </label>
          <textarea
            id="bookmark-instruction"
            placeholder="Enter your instructions here..."
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            disabled={isLoading}
            rows={6}
            required
            className="resize-none placeholder:text-sm placeholder:text-solid-light w-full text-text-dark px-1 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
          />
        </div>
        <div className="flex items-center justify-end gap-1.5 pt-1">
          <Button
            type="submit"
            isDisabled={isLoading || !content.trim() || !name.trim()}
            className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark data-[disabled]:text-text-dark/60 hover:text-text-light"
          >
            Save
          </Button>
          <Button
            type="button"
            onPress={onCancel}
            className="text-xs tracking-wide p-1 flex items-center justify-center rounded-sm text-text-dark hover:text-text-light"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

interface IdleModeFormProps {
  content: string
  isLoading: boolean
  onContentChange: (value: string) => void
  onCopy: (instruction: Instruction) => Promise<void>
  onBookmarkClick: () => void
}

function IdleModeForm({
  content,
  isLoading,
  onContentChange,
  onCopy,
  onBookmarkClick,
}: IdleModeFormProps) {
  return (
    <div className="flex-1 rounded-sm bg-transparent border border-interactive-light has-focus:border-border-mid mt-1">
      <label className="sr-only" htmlFor="user-instruction">
        Enter your instructions here...
      </label>
      <div className="group/textarea relative flex items-center pb-6">
        <textarea
          id="user-instruction"
          placeholder="Enter your instructions here..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={isLoading}
          rows={4}
          className="resize-none placeholder:text-sm placeholder:text-solid-light w-full text-text-dark py-1.5 px-2 text-sm focus:outline-none bg-transparent disabled:text-text-dark/60"
        />
        <div className="absolute bottom-1.5 right-1.5 hidden group-hover/textarea:flex group-hover/textarea:items-center group-hover/textarea:gap-1.5 group-has-focus/textarea:flex group-has-focus/textarea:items-center group-has-focus/textarea:gap-1.5">
          <Button
            type="button"
            onPress={onBookmarkClick}
            className="group/button text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
          >
            <BookmarkIcon className="group-hover/button:hidden" />
            <BookmarkFilledIcon className="hidden group-hover/button:block text-accent-border-light" />
          </Button>
          <CopyButton
            onCopy={() => onCopy({ name: '', content })}
            className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
          />
        </div>
      </div>
    </div>
  )
}
