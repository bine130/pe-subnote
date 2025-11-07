import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// PWA Service Worker 등록
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onRegistered(registration) {
    console.log('SW Registered:', registration)
  },
  onRegisterError(error) {
    console.log('SW registration error', error)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
