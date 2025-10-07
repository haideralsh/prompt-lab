/**
 * Helper function to preserve selected items after a list update
 * by keeping only the IDs that still exist in the new list
 */
export function preserveSelected<T>(
  allItems: readonly T[],
  selectedIds: Set<string>,
  idGetter: (item: T) => string
): Set<string> {
  const allIds = new Set(allItems.map(idGetter))
  const updatedSelected = new Set<string>()

  for (const id of selectedIds) {
    if (allIds.has(id)) {
      updatedSelected.add(id)
    }
  }

  return updatedSelected
}
