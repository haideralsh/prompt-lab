import { Button, Checkbox } from 'react-aria-components'
import { CheckIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { SavedInstructionMetadata, Instruction } from './types'
import { CopyButton } from '../../common/CopyButton'
import { EditInstructionForm } from './forms/EditInstructionForm'

interface InstructionItemProps {
  instruction: SavedInstructionMetadata
  isEditing: boolean
  isEditDisabled: boolean
  isLoading: boolean
  onEdit: (instruction: SavedInstructionMetadata) => void | Promise<void>
  onSaveEdit: (id: string, data: Instruction) => void
  onCancelEdit: () => void
  onDelete: (id: string) => void
  onCopy: (id: string) => Promise<void>
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
    await onCopy(instruction.id)
  }

  function handleSave(data: Instruction) {
    onSaveEdit(instruction.id, data)
  }

  if (isEditing) {
    return (
      <li>
        <EditInstructionForm
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
        className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 group text-left w-full rounded-sm px-2 py-0.5
                              hover:bg-accent-interactive-dark
                              data-[hovered]:bg-accent-interactive-dark
                              data-[disabled]:opacity-75
                              data-[disabled]:hover:bg-transparent"
        slot="selection"
      >
        {({ isSelected }) => (
          <>
            <span className="flex items-center justify-center size-[15px] rounded-sm text-accent-text-light border border-border-light group-data-[selected]:border-accent-border-mid group-data-[indeterminate]:border-accent-border-mid bg-transparent group-data-[selected]:bg-accent-interactive-light group-data-[indeterminate]:bg-accent-interactive-light flex-shrink-0">
              {isSelected && <CheckIcon />}
            </span>
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="font-normal text-text-dark truncate min-w-0">
                {instruction.name}
              </span>
              <span className="hidden group-hover:block text-solid-light truncate flex-1 min-w-0">
                {instruction.content}
              </span>
            </span>
            <span>
              <span className="hidden group-hover:flex group-hover:items-center group-hover:gap-1.5">
                <Button
                  className="text-text-light/75 hover:text-text-light data-[disabled]:text-text-light/75"
                  onPress={handleEditClick}
                  isDisabled={isEditDisabled}
                >
                  <Pencil1Icon />
                </Button>
                <CopyButton onCopy={handleCopyClick} />
                <Button
                  className="text-red/75 hover:text-red data-[disabled]:text-red/75"
                  onPress={handleDeleteClick}
                >
                  <TrashIcon />
                </Button>
                <span className="text-solid-light text-xs border border-border-dark px-1 rounded-sm uppercase group-hover:text-text-dark group-hover:border-border-light">
                  {instruction.tokenCount?.toLocaleString() ?? '-'}
                </span>
              </span>
            </span>
          </>
        )}
      </Checkbox>
    </li>
  )
}
