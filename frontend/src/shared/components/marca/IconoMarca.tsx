import { cn } from '@shared/lib/cn'

/** Se sirve el PNG más pequeño que cubre el tamaño pedido en pantallas 2x. */
function fuente(variante: 'light' | 'dark', tamano: number): string {
  const paso = tamano <= 64 ? 128 : tamano <= 128 ? 256 : 512
  return `/marca/rvr-icono-${variante}-${paso}.png`
}

/**
 * Icono de marca en PNG, en su variante clara u oscura.
 *
 * Las dos versiones se declaran siempre y se muestra una u otra por CSS en vez
 * de leer el tema en JavaScript: así no hay un parpadeo con el icono equivocado
 * en el primer pintado, que es justo donde más se nota (el splash).
 *
 * El aro de un píxel no es decorativo: el icono claro es una tarjeta casi blanca
 * y sin él desaparece sobre una superficie blanca.
 */
export function IconoMarca({
  tamano = 96,
  className,
  alt = '',
  radio = '24%',
}: {
  tamano?: number
  className?: string
  alt?: string
  /** El PNG ya trae sus esquinas redondeadas; esto recorta el aro a juego. */
  radio?: string
}) {
  const comun = 'block size-full object-contain'
  const estilo = { width: tamano, height: tamano, borderRadius: radio }

  return (
    <span
      className={cn(
        'relative inline-flex flex-none overflow-hidden',
        'ring-1 ring-black/[0.07] dark:ring-white/10',
        className,
      )}
      style={estilo}
    >
      <img
        src={fuente('light', tamano)}
        alt={alt}
        width={tamano}
        height={tamano}
        className={cn(comun, 'dark:hidden')}
        draggable={false}
      />
      <img
        src={fuente('dark', tamano)}
        alt={alt}
        width={tamano}
        height={tamano}
        className={cn(comun, 'hidden dark:block')}
        draggable={false}
      />
    </span>
  )
}
