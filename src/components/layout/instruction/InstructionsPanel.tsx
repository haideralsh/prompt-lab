import { useEffect, useState } from 'react'
import { CheckboxGroup } from 'react-aria-components'
import { PanelDisclosure } from '../PanelDisclosure'
import { InstructionItem } from './InstructionItem'
import { useSidebarContext } from '../../Sidebar/SidebarContext'
import { getErrorMessage } from '../../../helpers/getErrorMessage'
import { queue } from '../../ToastQueue'
import { preserveSelected } from '../../../helpers/preserveSelected'
import { InstructionForm } from './forms/InstructionForm'
import { CopyButton } from '../../common/CopyButton'
import type {
  SavedInstructionMetadata,
  Instruction,
  SavedInstructions,
} from './types'
import {
  copyInstructionsToClipboard,
  deleteInstructions,
  listInstructions,
  upsertInstruction,
} from './handlers'
import { useInstructionTokenCount } from './forms/useInstructionTokenCount'

export function InstructionsPanel() {
  const { directory } = useSidebarContext()
  const [instructions, setInstructions] = useState<SavedInstructions>([])
  const [selectedInstructionIds, setSelectedInstructionIds] = useState<
    Set<string>
  >(() => new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [editingInstructionId, setEditingInstructionId] = useState<
    string | null
  >(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isFormIncluded, setIsFormIncluded] = useState(true)
  const [hasUnsavedInstruction, setHasUnsavedInstruction] = useState(false)
  const [unsavedInstruction, setUnsavedInstruction] =
    useState<Instruction | null>(null)
  const { tokenCount: unsavedTokenCount } = useInstructionTokenCount(
    unsavedInstruction?.content ?? ''
  )

  const selectedTokenCount = instructions.reduce((accumulator, entry) => {
    if (selectedInstructionIds.has(entry.id)) {
      return accumulator + (entry.tokenCount ?? 0)
    }
    return accumulator
  }, 0)

  const hasFormCheckbox = editingInstructionId === null
  const draftTokenCount =
    hasFormCheckbox && isFormIncluded && hasUnsavedInstruction
      ? unsavedTokenCount
      : 0
  const totalTokenCount = selectedTokenCount + draftTokenCount

  const totalSelectableCount = instructions.length + Number(hasFormCheckbox)
  const selectedCount =
    selectedInstructionIds.size + Number(hasFormCheckbox && isFormIncluded)

  const isAllSelected =
    totalSelectableCount > 0 && selectedCount === totalSelectableCount
  const isIndeterminate =
    selectedCount > 0 && selectedCount < totalSelectableCount

  useEffect(() => {
    loadInstructions()
  }, [directory?.path])

  function clearUnsavedInstruction() {
    setUnsavedInstruction(null)
    setHasUnsavedInstruction(false)
  }

  async function loadInstructions() {
    try {
      const loadedInstructions = await listInstructions(directory.path)
      setInstructions(loadedInstructions)
      setSelectedInstructionIds(new Set())
      clearUnsavedInstruction()
    } catch (error) {
      queue.add({
        title: 'Failed to load saved instructions',
        description: getErrorMessage(error),
      })
    }
  }

  function handleSelectAll() {
    setSelectedInstructionIds(
      new Set(instructions.map((instruction) => instruction.id))
    )
    setIsFormIncluded(true)
  }

  function handleDeselectAll() {
    setSelectedInstructionIds(new Set())
    setIsFormIncluded(false)
  }

  function handleSelectionChange(values: string[]) {
    setSelectedInstructionIds(new Set(values))
  }

  function handleEdit(instruction: SavedInstructionMetadata) {
    if (!editingInstructionId && !isAddingNew) {
      clearUnsavedInstruction()
      setEditingInstructionId(instruction.id)
    }
  }

  function handleCancelEdit() {
    setEditingInstructionId(null)
  }

  async function handleCopySavedInstruction(id: string) {
    await copyInstructionsToClipboard(directory.path, [id], [])
  }

  async function handleCopyInstruction(instruction: Instruction) {
    await copyInstructionsToClipboard(directory.path, [], [instruction])
  }

  async function handleCopySelectedInstructions() {
    const instructionIds = Array.from(selectedInstructionIds)
    const shouldIncludeDraft =
      hasFormCheckbox &&
      isFormIncluded &&
      unsavedInstruction &&
      unsavedInstruction.content.trim().length > 0
    const draftInstructions =
      shouldIncludeDraft && unsavedInstruction
        ? [
            {
              name: unsavedInstruction.name.trim(),
              content: unsavedInstruction.content,
            },
          ]
        : []

    if (instructionIds.length === 0 && draftInstructions.length === 0) {
      return
    }

    await copyInstructionsToClipboard(
      directory.path,
      instructionIds,
      draftInstructions
    )
  }

  async function handleDelete(id: string) {
    try {
      const updatedInstructions = await deleteInstructions(directory.path, [id])
      setInstructions(updatedInstructions)
      setSelectedInstructionIds((selectedIds) =>
        preserveSelected(
          updatedInstructions,
          selectedIds,
          (instruction) => instruction.id
        )
      )

      if (editingInstructionId === id) {
        setEditingInstructionId(null)
      }
    } catch (error) {
      queue.add({
        title: 'Failed to delete saved instruction',
        description: getErrorMessage(error),
      })
    }
  }

  async function handleSaveEdit(instructionId: string, data: Instruction) {
    setIsLoading(true)
    try {
      const updatedInstructions = await upsertInstruction(
        directory.path,
        data.name,
        data.content,
        instructionId
      )
      setInstructions(updatedInstructions)
      setSelectedInstructionIds((selectedIds) =>
        preserveSelected(
          updatedInstructions,
          selectedIds,
          (instruction) => instruction.id
        )
      )
      setEditingInstructionId(null)
    } catch (error) {
      queue.add({
        title: 'Failed to update saved instruction',
        description: getErrorMessage(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveNew(data: Instruction) {
    setIsLoading(true)
    try {
      const updatedInstructions = await upsertInstruction(
        directory.path,
        data.name,
        data.content
      )
      setInstructions(updatedInstructions)
      setSelectedInstructionIds((selectedIds) =>
        preserveSelected(
          updatedInstructions,
          selectedIds,
          (instruction) => instruction.id
        )
      )
      setIsAddingNew(false)
    } catch (error) {
      queue.add({
        title: 'Failed to save saved instruction',
        description: getErrorMessage(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancelNew() {
    setIsAddingNew(false)
  }

  function handleStartAddNew() {
    if (!editingInstructionId) {
      setIsAddingNew(true)
    }
  }

  const hasCopyableUnsavedInstruction =
    hasFormCheckbox &&
    isFormIncluded &&
    Boolean(unsavedInstruction && unsavedInstruction.content.trim().length > 0)

  const canCopySelection =
    selectedInstructionIds.size > 0 || hasCopyableUnsavedInstruction

  return (
    <PanelDisclosure
      id="instructions"
      label="Instructions"
      count={instructions.length + Number(hasUnsavedInstruction)}
      panelClassName="p-2 flex flex-col"
      isGroupSelected={isAllSelected}
      isGroupIndeterminate={isIndeterminate}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleDeselectAll}
      tokenCount={totalTokenCount}
      actions={
        <CopyButton
          onCopy={handleCopySelectedInstructions}
          isDisabled={!canCopySelection}
          className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
        />
      }
    >
      {instructions.length > 0 && (
        <CheckboxGroup
          aria-label="Saved instructions"
          value={Array.from(selectedInstructionIds)}
          onChange={handleSelectionChange}
          className="text-text-dark"
        >
          <ul className="text-sm text-text-dark">
            {instructions.map((entry) => (
              <InstructionItem
                key={entry.id}
                instruction={entry}
                isEditing={editingInstructionId === entry.id}
                isEditDisabled={!!editingInstructionId || isAddingNew}
                isLoading={isLoading}
                onEdit={handleEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDelete}
                onCopy={handleCopySavedInstruction}
              />
            ))}
          </ul>
        </CheckboxGroup>
      )}

      {!editingInstructionId && (
        <InstructionForm
          editingInstruction={null}
          isLoading={isLoading}
          isAddingNew={isAddingNew}
          draftTokenCount={unsavedTokenCount}
          onSave={handleSaveNew}
          onCancel={handleCancelNew}
          onStartAdd={handleStartAddNew}
          onCopy={handleCopyInstruction}
          isIncluded={isFormIncluded}
          onIncludeChange={(selected) => setIsFormIncluded(selected)}
          onUnsavedInstructionPresenceChange={(exists) =>
            setHasUnsavedInstruction(exists)
          }
          onUnsavedInstructionChange={setUnsavedInstruction}
        />
      )}
    </PanelDisclosure>
  )
}
