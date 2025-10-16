import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import {
  directoryAtom,
  treeAtom,
  filteredTreeAtom,
  selectedNodesAtom,
  selectedFilesAtom,
  selectedPagesIdsAtom,
  selectedDiffIdsAtom,
  indeterminateNodesAtom,
  selectedInstructionIdsAtom,
  unsavedInstructionAtom,
  instructionsTokenCountAtom,
  totalFilesTokenCountAtom,
  totalPagesTokenCountAtom,
  totalGitDiffTokenCountAtom,
  treeTokenCountAtom,
  treeDisplayModeAtom,
} from '../../state/atoms'
import { NO_DIRECTORY } from '../../state/initial'

export const useResetState = () => {
  const setDirectory = useSetAtom(directoryAtom)
  const setTree = useSetAtom(treeAtom)
  const setFilteredTree = useSetAtom(filteredTreeAtom)
  const setSelectedNodes = useSetAtom(selectedNodesAtom)
  const setSelectedFiles = useSetAtom(selectedFilesAtom)
  const setSelectedPagesIds = useSetAtom(selectedPagesIdsAtom)
  const setSelectedDiffIds = useSetAtom(selectedDiffIdsAtom)
  const setIndeterminateNodes = useSetAtom(indeterminateNodesAtom)
  const setSelectedInstructionIds = useSetAtom(selectedInstructionIdsAtom)
  const setUnsavedInstruction = useSetAtom(unsavedInstructionAtom)
  const setInstructionsTokenCount = useSetAtom(instructionsTokenCountAtom)
  const setTotalFilesTokenCount = useSetAtom(totalFilesTokenCountAtom)
  const setTotalPagesTokenCount = useSetAtom(totalPagesTokenCountAtom)
  const setTotalGitDiffTokenCount = useSetAtom(totalGitDiffTokenCountAtom)
  const setTreeTokenCount = useSetAtom(treeTokenCountAtom)
  const setTreeDisplayMode = useSetAtom(treeDisplayModeAtom)

  const resetState = useCallback(() => {
    setDirectory(NO_DIRECTORY)
    setTree([])
    setFilteredTree([])
    setSelectedNodes(new Set())
    setSelectedFiles([])
    setSelectedPagesIds(new Set())
    setSelectedDiffIds(new Set())
    setIndeterminateNodes(new Set())
    setSelectedInstructionIds(new Set())
    setUnsavedInstruction(null)
    setInstructionsTokenCount(0)
    setTotalFilesTokenCount(0)
    setTotalPagesTokenCount(0)
    setTotalGitDiffTokenCount(0)
    setTreeTokenCount(0)
    setTreeDisplayMode('selected')
  }, [
    setDirectory,
    setTree,
    setFilteredTree,
    setSelectedNodes,
    setSelectedFiles,
    setSelectedPagesIds,
    setSelectedDiffIds,
    setIndeterminateNodes,
    setSelectedInstructionIds,
    setUnsavedInstruction,
    setInstructionsTokenCount,
    setTotalFilesTokenCount,
    setTotalPagesTokenCount,
    setTotalGitDiffTokenCount,
    setTreeTokenCount,
    setTreeDisplayMode,
  ])

  return resetState
}
