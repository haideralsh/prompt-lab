import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import App from './App'
import { SidebarContextProvider } from './components/Sidebar/SidebarContext'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SidebarContextProvider>
      <App />
    </SidebarContextProvider>
  </React.StrictMode>,
)
