import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <GoogleReCaptchaProvider
        reCaptchaKey={RECAPTCHA_SITE_KEY}
        scriptProps={{
          async: true,
          defer: true,
          appendTo: 'head',
        }}
      >
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </GoogleReCaptchaProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
