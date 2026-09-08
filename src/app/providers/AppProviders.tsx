import type { ReactNode } from 'react'
import { AuthProvider } from '@features/auth'
import { ThemeProvider } from './ThemeProvider'
import { ToastProvider } from './ToastProvider'

/** Único punto donde se componen los providers globales. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
