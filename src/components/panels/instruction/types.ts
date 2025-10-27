export interface SavedInstructionMetadata {
  id: string
  name: string
  content: string
  tokenCount: number
  addedAt: number | null
  updatedAt: number | null
}

export type SavedInstructions = SavedInstructionMetadata[]

export interface Instruction {
  name: string
  content: string
}
