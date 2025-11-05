import { useEffect, useState } from 'react'
import { CheckboxGroup, Button } from 'react-aria-components'
import { PlusIcon } from '@radix-ui/react-icons'
import { InstructionItem } from './instruction-item'
import { preserveSelected } from '../../../helpers/preserve-selected'
import { InstructionForm } from './forms/instruction-form'
import { CopyButton } from '../../common/copy-button'
import type {
  SavedInstructionMetadata,
  Instruction,
  SavedInstructions,
} from './types'
import {
  deleteInstructions,
  getInstruction,
  listInstructions,
  upsertInstruction,
} from '@/api/instructions'
import { copyInstructionsToClipboard } from '@/api/clipboard'
import { queue } from '@/components/toasts/toast-queue'
import { getErrorMessage } from '../../../helpers/get-error-message'
import { useInstructionTokenCount } from './forms/use-instruction-token-count'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  directoryAtom,
  instructionsTokenCountAtom,
  selectedInstructionIdsAtom,
  unsavedInstructionAtom,
} from '../../../state/atoms'
import { Panel } from '../panel/panel'

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

  const selectedTokenCount = instructions.reduce((total, instruction) => {
    if (selectedInstructionIds.has(instruction.id)) {
      return total + (instruction.tokenCount ?? 0)
    }
    return total
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
    try {
      const loadedInstructions = await listInstructions({
        directoryPath: directory.path,
      })
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

    try {
      const fullInstruction = await getInstruction({
        directoryPath: directory.path,
        instructionId: instruction.id,
      })
      setInstructions((current) =>
        current.map((entry) =>
          entry.id === instruction.id
            ? { ...entry, ...fullInstruction }
            : entry,
        ),
      )
      setEditingInstructionId(instruction.id)
    } catch (error) {
      queue.add({
        title: 'Failed to load instruction',
        description: getErrorMessage(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancelEdit() {
    setEditingInstructionId(null)
  }

  async function handleCopySavedInstruction(id: string) {
    try {
      await copyInstructionsToClipboard({
        directoryPath: directory.path,
        instructionIds: [id],
      })
    } catch (error) {
      queue.add({
        title: 'Failed to copy instructions',
        description: getErrorMessage(error),
      })
    }
  }

  async function handleCopyInstruction(instruction: Instruction) {
    try {
      await copyInstructionsToClipboard({
        directoryPath: directory.path,
        instructionIds: [],
        instructions: [
          { name: instruction.name, content: instruction.content },
        ],
      })
    } catch (error) {
      queue.add({
        title: 'Failed to copy instructions',
        description: getErrorMessage(error),
      })
    }
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

    try {
      await copyInstructionsToClipboard({
        directoryPath: directory.path,
        instructionIds,
        instructions: draftInstructions,
      })
    } catch (error) {
      queue.add({
        title: 'Failed to copy instructions',
        description: getErrorMessage(error),
      })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInstructions({
        directoryPath: directory.path,
        instructionIds: [id],
      })
      const updatedInstructions = await listInstructions({
        directoryPath: directory.path,
      })
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
      await upsertInstruction({
        directoryPath: directory.path,
        instructionId,
        name: data.name,
        content: data.content,
      })
      const updatedInstructions = await listInstructions({
        directoryPath: directory.path,
      })
      setInstructions(updatedInstructions)
      setSelectedInstructionIds((selectedIds) =>
        preserveSelected(
          updatedInstructions,
          selectedIds,
          (instruction) => instruction.id,
        ),
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
      await upsertInstruction({
        directoryPath: directory.path,
        name: data.name,
        content: data.content,
      })
      const updatedInstructions = await listInstructions({
        directoryPath: directory.path,
      })
      setInstructions(updatedInstructions)
      setSelectedInstructionIds((selectedIds) =>
        preserveSelected(
          updatedInstructions,
          selectedIds,
          (instruction) => instruction.id,
        ),
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
      actions={
        <>
          {!isAddingNew && (
            <Button
              type="button"
              onPress={handleStartAddNew}
              className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
            >
              <PlusIcon />
            </Button>
          )}
          <CopyButton
            onCopy={handleCopySelectedInstructions}
            isDisabled={!canCopySelection}
          />
        </>
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
          onIncludeChange={(selected: boolean) => setIsFormIncluded(selected)}
          onUnsavedInstructionPresenceChange={(exists: boolean) =>
            setHasUnsavedInstruction(exists)
          }
          onUnsavedInstructionChange={setUnsavedInstruction}
        />
      )}
    </Panel>
  )
}
