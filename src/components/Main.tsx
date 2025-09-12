import { useMemo } from 'react'
import { useSidebarContext } from './Sidebar/SidebarContext'
import { invoke } from '@tauri-apps/api/core'
import { SelectionResult } from '../types/FileTree'
import {
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
} from 'react-aria-components'
import { ChevronRight } from 'lucide-react'

export function Main() {
  const {
    selectedFiles,
    directory,
    selectedNodes,
    setSelectedFiles,
    setSelectedNodes,
    setIndeterminateNodes,
  } = useSidebarContext()

  const sortedFiles = useMemo(() => {
    return selectedFiles.sort((a, b) => {
      if (a.tokenCount == null) return 1
      if (b.tokenCount == null) return -1

      return b.tokenCount - a.tokenCount
    })
  }, [selectedFiles])

  async function deselect(id: string | number) {
    const selection = await invoke<SelectionResult>('toggle_selection', {
      path: directory?.path,
      current: Array.from(selectedNodes),
      id: id,
    })
    setSelectedNodes(new Set(selection.selectedNodes))
    setSelectedFiles(selection.selectedFiles)
    setIndeterminateNodes(new Set(selection.indeterminate))
  }

  return (
    <section className="flex-1 p-4 bg-background-dark">
      <DisclosureGroup defaultExpandedKeys={['selected']}>
        <Disclosure id="selected">
          <Heading>
            <Button
              slot="trigger"
              className="flex items-center gap-2 text-sm text-text-dark"
            >
              <ChevronRight size={18} />
              Selected files
            </Button>
          </Heading>
          <DisclosurePanel>
            {sortedFiles.length > 0 && (
              <ul className="space-y-4 text-sm text-text-dark mt-2">
                {Array.from(sortedFiles).map((path) => (
                  <li key={path.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-2">
                        <span className="flex items-center gap-1">
                          <span className="font-normal">{path.title}</span>
                          <span className="text-text-dark">
                            {path.tokenCount == null
                              ? 'counting...'
                              : `${path.tokenCount} tokens${
                                  path.tokenPercentage == null
                                    ? ''
                                    : ` (${Math.ceil(path.tokenPercentage)}%)`
                                }`}
                          </span>
                        </span>
                        <span className="text-xs">{path.id}</span>
                      </div>
                      <button
                        className="text-xs bg-interactive-dark hover:bg-interactive-mid active:bg-interactive-light flex items-center col gap-1.5 rounded-xs cursor-pointer px-2 py-1 w-fit text-text-light"
                        onClick={() => deselect(path.id)}
                      >
                        Deselect
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>
    </section>
  )
}
