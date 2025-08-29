import { useState } from 'react'
import { Sidebar } from './components/Sidebar/Sidebar'
import { LaunchScreen } from './components/BlankState'
import { SidebarContextProvider } from './components/Sidebar/SidebarContext'
import { Main } from './components/Main'
import { Tree } from './types/FileTree'

function App() {
  const [tree, setTree] = useState<Tree>([])

  return (
    <main>
      {tree.length > 0 ? (
        <SidebarContextProvider>
          <aside className="w-72 shrink-0 border-r border-gray-200 p-4 flex flex-col">
            <Sidebar tree={tree} />
          </aside>
          <Main />
        </SidebarContextProvider>
      ) : (
        <>
          <LaunchScreen onPick={setTree} />
        </>
      )}
    </main>
  )
}

export default App
