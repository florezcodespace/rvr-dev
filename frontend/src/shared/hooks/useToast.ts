import { useContext } from 'react'
import { ToastContext, type ToastContextValue } from '@app/providers/ToastProvider'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return context
}
