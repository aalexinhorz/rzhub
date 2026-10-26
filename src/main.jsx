import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

// Las etiquetas SEO escritas en el HTML (index.html y las páginas que genera
// scripts/prerender-seo.mjs) son para quien no ejecuta JavaScript (WhatsApp,
// X, Telegram…). En el navegador las pone cada página con <SEO>, así que se
// quitan para que no queden duplicadas.
document.querySelectorAll('[data-seo-static]').forEach(el => el.remove())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Analytics />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)