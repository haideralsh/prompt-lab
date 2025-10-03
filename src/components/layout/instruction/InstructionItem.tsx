import { Button, Checkbox } from 'react-aria-components'
import { CheckIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { SavedInstructionMetadata, Instruction } from './types'
import { InlineEditForm } from './InlineEditForm'
import { CopyButton } from '../../common/CopyButton'

interface InstructionItemProps {
  instruction: SavedInstructionMetadata
  isEditing: boolean
  isEditDisabled: boolean
  isLoading: boolean
  onEdit: (instruction: SavedInstructionMetadata) => void
  onSaveEdit: (id: string, data: Instruction) => void
  onCancelEdit: () => void
  onDelete: (id: string) => void
  onCopy: (id: string) => void
}

export function InstructionItem({
  instruction,
  isEditing,
  isEditDisabled,
  isLoading,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onCopy,
}: InstructionItemProps) {
  function handleEditClick() {
    onEdit(instruction)
  }

  function handleDeleteClick() {
    onDelete(instruction.id)
  }

  async function handleCopyClick() {
    onCopy(instruction.id)
  }

  function handleSave(data: Instruction) {
    onSaveEdit(instruction.id, data)
  }

  if (isEditing) {
    return (
      <li>
        <InlineEditForm
          instruction={instruction}
          isLoading={isLoading}
          onSave={handleSave}
          onCancel={onCancelEdit}
        />
      </li>
    )
  }

  return (
    <li>
      <Checkbox
        value={instruction.id}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5 hover:bg-accent-interactive-dark data-[hovered]:bg-accent-interactive-dark"
        slot="selection"
      >
        {({ isSelected }) => (
          <>
            <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light flex-shrink-0">
              {isSelected && <CheckIcon />}
            </span>
            <span className="flex items-center gap-1.5 w-full min-w-0">
              <span
                className="font-normal text-text-dark break-words truncate"
                title={instruction.name}
              >
                {instruction.name}
              </span>
              <span
                className="hidden group-hover:inline text-solid-light truncate"
                title={instruction.content}
              >
                {instruction.content}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                <Button
                  className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/30 data-[disabled]:cursor-not-allowed"
                  onPress={handleEditClick}
                  isDisabled={isEditDisabled}
                >
                  <Pencil1Icon />
                </Button>
                <CopyButton
                  onCopy={handleCopyClick}
                  className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
                />
                <Button
                  className="text-red/75 hover:text-red"
                  onPress={handleDeleteClick}
                >
                  <TrashIcon />
                </Button>
              </span>
              <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm uppercase">
                {instruction.tokenCount?.toLocaleString() ?? '-'}
              </span>
            </span>
          </>
        )}
      </Checkbox>
    </li>
  )
}
