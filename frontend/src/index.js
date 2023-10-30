import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { loadWAFEnv } from './aws-waf-captcha/util'

// Load WAF environment variables first
await loadWAFEnv()

const root = createRoot(document.getElementById('root'))

root.render(
  <>
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  </>
)
