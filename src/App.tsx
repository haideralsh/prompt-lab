import { SidebarContent } from './components/Sidebar/SidebarContent'
import { LaunchScreen } from './components/BlankState'
import { useSidebarContext } from './components/Sidebar/SidebarContext'
import { Main } from './components/Main'
import { ResizableLayout } from './components/Sidebar/Sidebar'

function App() {
  const { directory } = useSidebarContext()

  if (directory)
    return <ResizableLayout sidebar={<SidebarContent />} main={<Main />} />

  return <LaunchScreen />
}

export default App
