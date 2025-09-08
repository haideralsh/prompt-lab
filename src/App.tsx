import { SidebarContent } from './components/Sidebar/SidebarContent'
import { LaunchScreen } from './components/BlankState'
import { useSidebarContext } from './components/Sidebar/SidebarContext'
import { Main } from './components/Main'
import { Layout } from './components/Layout'
import { Footer } from './components/Footer'

function App() {
  const { directory } = useSidebarContext()

  if (directory)
    return (
      <Layout
        sidebar={<SidebarContent />}
        main={<Main />}
        footer={<Footer />}
      />
    )

  return <LaunchScreen />
}

export default App
