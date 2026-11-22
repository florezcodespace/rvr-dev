import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { STORAGE_KEYS, storage } from '@shared/lib/storage'
import type { ResolvedTheme, ThemeMode } from '@shared/types/theme'

export interface ThemeContextValue {
  /** Preferencia elegida por el usuario. */
  mode: ThemeMode
  /** Tema realmente aplicado (resuelve 'system'). */
  theme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  /** Alterna entre light y dark, dejando de seguir al sistema. */
  toggle: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValue | null>(null)

const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

function resolve(mode: ThemeMode, system: ResolvedTheme): ResolvedTheme {
  return mode === 'system' ? system : mode
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
}: {
  children: ReactNode
  defaultMode?: ThemeMode
}) {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    storage.get<ThemeMode>(STORAGE_KEYS.theme, defaultMode),
  )
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  // Sigue los cambios de preferencia del SO mientras el modo sea 'system'.
  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const theme = resolve(mode, systemTheme)

  // Aplica la clase en <html>; el script de index.html hace lo mismo antes del primer paint.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    storage.set(STORAGE_KEYS.theme, next)
  }, [])

  const toggle = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode =
        resolve(current, getSystemTheme()) === 'dark' ? 'light' : 'dark'
      storage.set(STORAGE_KEYS.theme, next)
      return next
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, theme, setMode, toggle }),
    [mode, theme, setMode, toggle],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
