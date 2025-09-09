import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import App from './App'
import { SidebarContextProvider } from './components/Sidebar/SidebarContext'
import { Toaster } from './components/ToastQueue'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SidebarContextProvider>
      <Toaster />
      <App />
    </SidebarContextProvider>
  </React.StrictMode>,
)
