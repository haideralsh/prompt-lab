import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useSidebarContext } from '../components/Sidebar/SidebarContext'
import { useEffect, useRef } from 'react'

export default function useAppExitListener() {
  const { selectedNodes, indeterminateNodes } = useSidebarContext()

  const selectedNodesRef = useRef(selectedNodes)
  const indeterminateNodesRef = useRef(indeterminateNodes)

  useEffect(() => {
    selectedNodesRef.current = selectedNodes
  }, [selectedNodes])

  useEffect(() => {
    indeterminateNodesRef.current = indeterminateNodes
  }, [indeterminateNodes])

  useEffect(() => {
    let unlisten: UnlistenFn

    async function listenForAppExit() {
      unlisten = await listen('application_exiting', async () => {
        console.log('Application exiting, persisting selection state...')

        await invoke('persist_selection', {
          selectedNodes: Array.from(selectedNodesRef.current).map(String),
          indeterminateNodes: Array.from(indeterminateNodesRef.current).map(
            String,
          ),
        })
      })
    }

    function cleanup() {
      if (unlisten) unlisten()
    }

    listenForAppExit()
    return cleanup
  }, [])
}
