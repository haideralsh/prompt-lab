import { Sidebar } from './components/Sidebar/Sidebar'
import { LaunchScreen } from './components/LaunchScreen'
import { Layout } from './components/layout/Layout'
import { Main } from './components/layout/Main'
import { Footer } from './components/layout/Footer'
import { useAtomValue } from 'jotai'
import { directoryAtom } from './state/atoms'

function App() {
  const directory = useAtomValue(directoryAtom)

  if (directory)
    return <Layout sidebar={<Sidebar />} main={<Main />} footer={<Footer />} />

  return <LaunchScreen />
}

export default App
