import { Sidebar } from './components/Sidebar/Sidebar'
import { LaunchScreen } from './components/BlankState'
import { useSidebarContext } from './components/Sidebar/SidebarContext'
import { Layout } from './components/layout/Layout'
import { Main } from './components/layout/Main'
import { Footer } from './components/layout/Footer'
import { SubFooter } from './components/layout/SubFooter'
import { Tabs } from './components/layout/Tabs'

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
        tabs={<Tabs />}
      />
    )

  return <LaunchScreen />
}

export default App
