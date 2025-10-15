import { useEffect, useState } from 'react'
import { CheckboxGroup } from 'react-aria-components'
import { InstructionItem } from './InstructionItem'
import { preserveSelected } from '../../../helpers/preserveSelected'
import { InstructionForm } from './forms/InstructionForm'
import { CopyButton } from '../../common/CopyButton'
import { Panel } from '../Panel'
import type {
  SavedInstructionMetadata,
  Instruction,
  SavedInstructions,
} from './types'
import {
  copyInstructionsToClipboard,
  deleteInstructions,
  getInstruction,
  listInstructions,
  upsertInstruction,
} from './handlers'
import { useInstructionTokenCount } from './forms/useInstructionTokenCount'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  directoryAtom,
  instructionsTokenCountAtom,
  selectedInstructionIdsAtom,
  unsavedInstructionAtom,
} from '../../../state/atoms'

export function InstructionsPanel() {
  const directory = useAtomValue(directoryAtom)
  const [selectedInstructionIds, setSelectedInstructionIds] = useAtom(
    selectedInstructionIdsAtom,
  )
  const [unsavedInstruction, setUnsavedInstruction] = useAtom(
    unsavedInstructionAtom,
  )
  const [instructions, setInstructions] = useState<SavedInstructions>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingInstructionId, setEditingInstructionId] = useState<
    string | null
  >(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isFormIncluded, setIsFormIncluded] = useState(true)
  const [hasUnsavedInstruction, setHasUnsavedInstruction] = useState(false)
  const { tokenCount: unsavedTokenCount } = useInstructionTokenCount(
    unsavedInstruction?.content ?? '',
  )
  const setInstructionsTokenCountAtom = useSetAtom(instructionsTokenCountAtom)

  if (!directory) {
    return null
  }

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
  const totalInstructionTokenCount = selectedTokenCount + draftTokenCount

  const totalSelectableCount = instructions.length + Number(hasFormCheckbox)
  const selectedCount =
    selectedInstructionIds.size + Number(hasFormCheckbox && isFormIncluded)

  const isAllSelected =
    totalSelectableCount > 0 && selectedCount === totalSelectableCount
  const isIndeterminate =
    selectedCount > 0 && selectedCount < totalSelectableCount

  useEffect(() => {
    setInstructionsTokenCountAtom(totalInstructionTokenCount)
  }, [totalInstructionTokenCount, setInstructionsTokenCountAtom])

  useEffect(() => {
    loadInstructions()
  }, [directory.path])

  function clearUnsavedInstruction() {
    setUnsavedInstruction(null)
    setHasUnsavedInstruction(false)
  }

  async function loadInstructions() {
    const loadedInstructions = await listInstructions(directory.path)
    if (!loadedInstructions) {
      return
    }

    setInstructions(loadedInstructions)
    setSelectedInstructionIds(new Set())
    clearUnsavedInstruction()
  }

  function handleSelectAll() {
    setSelectedInstructionIds(
      new Set(instructions.map((instruction) => instruction.id)),
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

  async function handleEdit(instruction: SavedInstructionMetadata) {
    if (editingInstructionId || isAddingNew || isLoading) {
      return
    }

    clearUnsavedInstruction()
    setIsLoading(true)

    const fullInstruction = await getInstruction(directory.path, instruction.id)

    if (!fullInstruction) {
      setIsLoading(false)
      return
    }

    setInstructions((current) =>
      current.map((entry) =>
        entry.id === instruction.id ? { ...entry, ...fullInstruction } : entry,
      ),
    )
    setEditingInstructionId(instruction.id)
    setIsLoading(false)
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
      draftInstructions,
    )
  }

  async function handleDelete(id: string) {
    const updatedInstructions = await deleteInstructions(directory.path, [id])
    if (!updatedInstructions) {
      return
    }

    setInstructions(updatedInstructions)
    setSelectedInstructionIds((selectedIds) =>
      preserveSelected(
        updatedInstructions,
        selectedIds,
        (instruction) => instruction.id,
      ),
    )

    if (editingInstructionId === id) {
      setEditingInstructionId(null)
    }
  }

  async function handleSaveEdit(instructionId: string, data: Instruction) {
    setIsLoading(true)
    const updatedInstructions = await upsertInstruction(
      directory.path,
      data.name,
      data.content,
      instructionId,
    )

    if (!updatedInstructions) {
      setIsLoading(false)
      return
    }

    setInstructions(updatedInstructions)
    setSelectedInstructionIds((selectedIds) =>
      preserveSelected(
        updatedInstructions,
        selectedIds,
        (instruction) => instruction.id,
      ),
    )
    setEditingInstructionId(null)
    setIsLoading(false)
  }

  async function handleSaveNew(data: Instruction) {
    setIsLoading(true)
    const updatedInstructions = await upsertInstruction(
      directory.path,
      data.name,
      data.content,
    )

    if (!updatedInstructions) {
      setIsLoading(false)
      return
    }

    setInstructions(updatedInstructions)
    setSelectedInstructionIds((selectedIds) =>
      preserveSelected(
        updatedInstructions,
        selectedIds,
        (instruction) => instruction.id,
      ),
    )
    setIsAddingNew(false)
    setIsLoading(false)
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
    <Panel
      id="instructions"
      label="Instructions"
      count={instructions.length + Number(hasUnsavedInstruction)}
      panelClassName="p-2 flex flex-col"
      isGroupSelected={isAllSelected}
      isGroupIndeterminate={isIndeterminate}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleDeselectAll}
      tokenCount={totalInstructionTokenCount}
      endActions={
        <CopyButton
          onCopy={handleCopySelectedInstructions}
          isDisabled={!canCopySelection}
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
    </Panel>
  )
}
