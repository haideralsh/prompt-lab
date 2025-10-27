import { invoke } from '@tauri-apps/api/core'
import { queue } from '@/components/toasts/toast-queue'
import { getErrorMessage } from '../../../helpers/getErrorMessage'
import type { Instruction, SavedInstructionMetadata, SavedInstructions } from './types'

export async function listInstructions(
  directoryPath: string
): Promise<SavedInstructions | null> {
  try {
    return await invoke<SavedInstructions>('list_instructions', {
      directoryPath,
    })
  } catch (error) {
    queue.add({
      title: 'Failed to load saved instructions',
      description: getErrorMessage(error),
    })

    return null
  }
}

export async function getInstruction(
  directoryPath: string,
  instructionId: string
): Promise<SavedInstructionMetadata | null> {
  try {
    return await invoke<SavedInstructionMetadata>('get_instruction', {
      directoryPath,
      instructionId,
    })
  } catch (error) {
    queue.add({
      title: 'Failed to load instruction',
      description: getErrorMessage(error),
    })

    return null
  }
}

export async function upsertInstruction(
  directoryPath: string,
  name: string,
  content: string,
  instructionId?: string
): Promise<SavedInstructions | null> {
  try {
    await invoke<string>('upsert_instruction', {
      directoryPath,
      instructionId,
      name,
      content,
    })

    return await listInstructions(directoryPath)
  } catch (error) {
    queue.add({
      title: instructionId
        ? 'Failed to update saved instruction'
        : 'Failed to save saved instruction',
      description: getErrorMessage(error),
    })

    return null
  }
}

export async function deleteInstructions(
  directoryPath: string,
  instructionsIds: string[]
): Promise<SavedInstructions | null> {
  try {
    await invoke<string>('delete_instructions', {
      directoryPath,
      instructionsIds,
    })

    return await listInstructions(directoryPath)
  } catch (error) {
    queue.add({
      title: 'Failed to delete saved instruction',
      description: getErrorMessage(error),
    })

    return null
  }
}

export async function copyInstructionsToClipboard(
  directoryPath: string,
  instructionIds: string[],
  instructions: Instruction[]
): Promise<SavedInstructions | null> {
  try {
    await invoke<string>('copy_instructions_to_clipboard', {
      directoryPath,
      instructionIds,
      instructions,
    })

    return await listInstructions(directoryPath)
  } catch (error) {
    queue.add({
      title: 'Failed to copy instructions',
      description: getErrorMessage(error),
    })

    return null
  }
}
