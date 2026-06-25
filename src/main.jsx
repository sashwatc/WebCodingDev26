import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from "react-i18next";
import App from '@/App.jsx'
import AppErrorBoundary from '@/components/app/AppErrorBoundary.jsx'
import { ModeProvider } from '@/lib/ModeContext'
import i18n from "@/i18n";
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <ModeProvider>
        <App />
      </ModeProvider>
    </I18nextProvider>
  </AppErrorBoundary>
)
