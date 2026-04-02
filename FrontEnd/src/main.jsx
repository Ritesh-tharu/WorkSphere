import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="4e2bd63118dd549720950838bc11ff0eb37bb11d">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
