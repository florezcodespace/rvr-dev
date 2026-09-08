import clsx, { type ClassValue } from 'clsx'

/** Une clases condicionales. Envuelto para poder cambiar a tailwind-merge sin tocar componentes. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
