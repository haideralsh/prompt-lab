import { UnlistenFn } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useSetAtom } from 'jotai'
import {
  selectedFilesAtom,
  totalFilesTokenCountAtom,
  treeTokenCountAtom,
} from '../../state/atoms'

export function useTokenCountListener() {
  const setTotalFilesTokenCount = useSetAtom(totalFilesTokenCountAtom)
  const setTreeTokenCount = useSetAtom(treeTokenCountAtom)
  const setSelectedFiles = useSetAtom(selectedFilesAtom)

  useEffect(() => {
    let unlisten: UnlistenFn

    async function listenToTokenCounts() {
      unlisten = await listen<TokenCountsEvent>(
        'file-token-counts',
        (event) => {
          const { files, totalFilesTokenCount, totalTreeTokenCount } =
            event.payload
          setTotalFilesTokenCount(totalFilesTokenCount)
          setTreeTokenCount(totalTreeTokenCount ?? 0)

          if (files?.length) {
            setSelectedFiles((prev) => {
              const map = new Map(prev.map((f) => [f.path, f]))
              for (const { id, tokenCount, tokenPercentage } of files) {
                const node = map.get(id)
                if (node) {
                  map.set(id, { ...node, tokenCount, tokenPercentage })
                }
              }
              return Array.from(map.values())
            })
          }
        },
      )
    }

    function cleanup() {
      if (unlisten) unlisten()
    }

    listenToTokenCounts()
    return cleanup
  }, [])
}
