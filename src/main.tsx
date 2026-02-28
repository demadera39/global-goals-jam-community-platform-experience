import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize auth before rendering
async function initializeApp() {
  try {
    // Load custom auth token into Blink SDK if it exists
    const { getAuthToken } = await import('./lib/auth')
    const { default: blink } = await import('./lib/blink')
    const token = await getAuthToken()
    if (token) {
      blink.auth.setToken(token, true)
      console.log('✅ Auth token loaded on app start')
    }
  } catch (error) {
    console.warn('Failed to initialize auth:', error)
  }
}

// Initialize and render
initializeApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
