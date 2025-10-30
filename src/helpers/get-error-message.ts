export interface ApplicationError {
  code: number
  message: string
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong.'
}
