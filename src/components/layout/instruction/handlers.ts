import { invoke } from '@tauri-apps/api/core'
import type { Instruction, SavedInstructions } from './types'

export async function listInstructions(directoryPath: string) {
  return invoke<SavedInstructions>('list_instructions', {
    directoryPath,
  })
}

export async function upsertInstruction(
  directoryPath: string,
  name: string,
  content: string,
  instructionId?: string
) {
  await invoke<string>('upsert_instruction', {
    directoryPath,
    instructionId,
    name,
    content,
  })

  return listInstructions(directoryPath)
}

export async function deleteInstructions(
  directoryPath: string,
  instructionsIds: string[]
) {
  await invoke<string>('delete_instructions', {
    directoryPath,
    instructionsIds,
  })

  return listInstructions(directoryPath)
}

export async function copyInstructionsToClipboard(
  directoryPath: string,
  instructionIds: string[],
  instructions: Instruction[]
) {
  await invoke<string>('copy_instructions_to_clipboard', {
    directoryPath,
    instructionIds,
    instructions,
  })

  return listInstructions(directoryPath)
}
