import { Sidebar } from './components/Sidebar/Sidebar'
import { LaunchScreen } from './components/BlankState'
import { useSidebarContext } from './components/Sidebar/SidebarContext'
import { Main } from './components/Main'

function App() {
  const { tree } = useSidebarContext()

  if (tree.length > 0)
    return (
      <main className="h-dvh flex text-[#D0D0D0] bg-black">
        <aside className="w-72 shrink-0 border-r border-gray-200 p-4 flex flex-col">
          <Sidebar />
        </aside>
        <Main />
      </main>
    )

  return <LaunchScreen />
}

export default App
