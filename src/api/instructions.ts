import { invoke } from '@tauri-apps/api/core'
import type {
  SavedInstructionMetadata,
  SavedInstructions,
} from '@/components/panels/instruction/types'

export async function listInstructions(params: { directoryPath: string }) {
  return await invoke<SavedInstructions>('list_instructions', params)
}

export async function getInstruction(params: {
  directoryPath: string
  instructionId: string
}) {
  return await invoke<SavedInstructionMetadata>('get_instruction', params)
}

export async function upsertInstruction(params: {
  directoryPath: string
  instructionId?: string
  name: string
  content: string
}) {
  return await invoke<string>('upsert_instruction', params)
}

export async function deleteInstructions(params: {
  directoryPath: string
  instructionIds: string[]
}) {
  return await invoke<string>('delete_instructions', params)
}

export async function countInstructionTokens(params: { content: string }) {
  return await invoke<number>('count_instruction_tokens', params)
}
