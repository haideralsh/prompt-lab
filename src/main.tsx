import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import App from './App'
import { Toaster } from './components/toasts/toast-queue'
import { Provider } from 'jotai'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider>
      <Toaster />
      <App />
    </Provider>
  </React.StrictMode>,
)
