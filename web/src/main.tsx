import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { Providers } from '@/app/Providers'
import { router } from '@/app/router'
import { startTelemetry } from '@/lib/telemetry'
import './styles/index.css'

void startTelemetry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </Providers>
    </ErrorBoundary>
  </StrictMode>
)
