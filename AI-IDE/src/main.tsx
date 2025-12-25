import React from 'react'
import ReactDOM from 'react-dom/client'
import './webMocks' // Import mocks first for web environment
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge (only in Electron)
if (typeof window !== 'undefined' && (window as any).ipcRenderer) {
  (window as any).ipcRenderer.on('main-process-message', (_event: any, message: string) => {
    console.log(message)
  })
}
