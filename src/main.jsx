import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme } from './hooks/useTheme.js'

// Apply saved theme before anything renders
applyTheme(localStorage.getItem("pip-theme") || "violet");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)