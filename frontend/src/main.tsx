import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globalStyles.css'
import App from './App.tsx'
import './i18n' // Initialize i18n

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
