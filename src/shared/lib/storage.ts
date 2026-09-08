/** Acceso a localStorage tolerante a fallos (modo privado, storage bloqueado, SSR). */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  },

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* espacio lleno o storage deshabilitado: se ignora a propósito */
    }
  },

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* noop */
    }
  },
}

/** Claves de almacenamiento del portal, centralizadas para evitar colisiones. */
export const STORAGE_KEYS = {
  theme: 'rvr.theme',
  session: 'rvr.session',
  rememberedEmail: 'rvr.remembered-email',
} as const
