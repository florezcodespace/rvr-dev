import type { ReactNode } from 'react'
import { AuthProvider } from '@features/auth'
import { ThemeProvider } from './ThemeProvider'
import { ToastProvider } from './ToastProvider'
import { TooltipGlobal } from '@shared/components/ui/Tooltip'

/** Único punto donde se componen los providers globales. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
          <TooltipGlobal />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
