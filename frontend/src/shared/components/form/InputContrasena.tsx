import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { IconOjo, IconOjoTachado } from '@shared/components/icons'
import { Input, type InputProps } from '@shared/components/ui/Input'
import { cn } from '@shared/lib/cn'

/** Botón del ojito: alterna entre ver y ocultar lo que se escribió. */
function BotonOjo({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={visible}
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="grid h-8 w-8 cursor-pointer place-items-center rounded-[14px] border-0 bg-transparent text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
    >
      {visible ? <IconOjoTachado width={17} height={17} /> : <IconOjo width={17} height={17} />}
    </button>
  )
}

/** Campo de contraseña con ojito, sobre el `Input` del sistema (sirve con react-hook-form). */
export const InputContrasena = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'trailing'>>(
  function InputContrasena({ claseCampo, ...props }, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <Input
        ref={ref}
        {...props}
        type={visible ? 'text' : 'password'}
        claseCampo={cn('pr-12!', claseCampo)}
        trailing={<BotonOjo visible={visible} onClick={() => setVisible((v) => !v)} />}
      />
    )
  },
)

/** Variante para inputs nativos ya estilizados (p. ej. dentro de `FormularioModal`). */
export function CampoContrasena({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative flex items-center">
      <input {...props} type={visible ? 'text' : 'password'} className={cn(className, 'pr-12!')} />
      <div className="absolute right-2 flex items-center">
        <BotonOjo visible={visible} onClick={() => setVisible((v) => !v)} />
      </div>
    </div>
  )
}
