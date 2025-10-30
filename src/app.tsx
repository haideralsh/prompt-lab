import { Sidebar } from './components/sidebar/sidebar'
import { LaunchScreen } from './components/launch-screen'
import { Layout } from './components/layout/layout'
import { Main } from './components/layout/main'
import { Footer } from './components/layout/footer'
import { useAtomValue } from 'jotai'
import { directoryAtom } from './state/atoms'

function App() {
  const directory = useAtomValue(directoryAtom)

  if (directory.path)
    return <Layout sidebar={<Sidebar />} main={<Main />} footer={<Footer />} />

  return <LaunchScreen />
}

export default App
