import { Sidebar } from './components/Sidebar/Sidebar'
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
        sidebar={<Sidebar />}
        main={<Main />}
        footer={<Footer />}
        subfooter={<>Subfooter</>}
      />
    )

  return <LaunchScreen />
}

export default App
