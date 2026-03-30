import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from "react-i18next";
import App from '@/App.jsx'
import AppErrorBoundary from '@/components/app/AppErrorBoundary.jsx'
import i18n from "@/i18n";
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </AppErrorBoundary>
)
