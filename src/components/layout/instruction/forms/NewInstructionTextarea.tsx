import { Button } from 'react-aria-components'
import { BookmarkIcon, BookmarkFilledIcon } from '@radix-ui/react-icons'
import { CopyButton } from '../../../common/CopyButton'
import { TokenCount } from '../../../common/TokenCount'
import { Instruction } from '../types'

interface NewInstructionTextareaProps {
  content: string
  isLoading: boolean
  onContentChange: (value: string) => void
  onCopy: (instruction: Instruction) => Promise<void>
  onBookmarkClick: () => void
  tokenCount: number
}

export function NewInstructionTextarea({
  content,
  isLoading,
  onContentChange,
  onCopy,
  onBookmarkClick,
  tokenCount,
}: NewInstructionTextareaProps) {
  return (
    <div className="flex-1 rounded-sm bg-transparent border border-interactive-light has-focus:border-border-mid mt-0.75">
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
          <TokenCount count={tokenCount} />
        </div>
      </div>
    </div>
  )
}
