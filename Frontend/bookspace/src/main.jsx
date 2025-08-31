import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ClerkProviderWithRouter from './auth/ClerkProviderWithRouter.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
    <ClerkProviderWithRouter afterSignOutUrl="/">
    <App />
    </ClerkProviderWithRouter>
    </BrowserRouter>
  </StrictMode>,
)
