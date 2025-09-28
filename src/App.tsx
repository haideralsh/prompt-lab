import { Sidebar } from './components/Sidebar/Sidebar'
import { LaunchScreen } from './components/BlankState'
import { useSidebarContext } from './components/Sidebar/SidebarContext'
import { Layout } from './components/layout/Layout'
import { Main } from './components/layout/Main'
import { Footer } from './components/layout/Footer'

function App() {
  const { directory } = useSidebarContext()

  if (directory)
    return <Layout sidebar={<Sidebar />} main={<Main />} footer={<Footer />} />

  return <LaunchScreen />
}

export default App
