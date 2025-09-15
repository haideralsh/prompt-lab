import { Sidebar } from './components/Sidebar/Sidebar'
import { LaunchScreen } from './components/BlankState'
import { useSidebarContext } from './components/Sidebar/SidebarContext'
import { Main } from './components/Main'
import { Layout } from './components/Layout'
import { Footer } from './components/Footer'
import { SubFooter } from './components/SubFooter'
import useAppExitListener from './hooks/useAppExitListener'

function App() {
  useAppExitListener()

  const { directory } = useSidebarContext()

  if (directory)
    return (
      <Layout
        sidebar={<Sidebar />}
        main={<Main />}
        footer={<Footer />}
        subfooter={<SubFooter />}
      />
    )

  return <LaunchScreen />
}

export default App
