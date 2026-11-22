import { SECTORES } from '../datos'

/**
 * Cinta de sectores: píldoras de vidrio que pasan despacio. El contenido va
 * duplicado y la pista recorre la mitad, así el bucle no se nota; la copia
 * queda oculta para el lector de pantalla.
 */
export function CintaSectores() {
  const lista = (oculta: boolean) => (
    <ul aria-hidden={oculta || undefined} className="anim-marquesina m-0 flex shrink-0 list-none gap-3 p-0 pr-3">
      {SECTORES.map((sector) => (
        <li
          key={sector}
          className="vidrio flex flex-none items-center gap-2.5 rounded-full border border-[var(--rvr-glass-borde)] px-4 py-2 text-[14px] font-semibold whitespace-nowrap text-fg-muted"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          {sector}
        </li>
      ))}
    </ul>
  )

  return (
    <section aria-label="Sectores que atendemos" className="relative py-6">
      <p className="m-0 mb-4 text-center text-[13.5px] font-semibold text-fg-subtle">Atendemos</p>
      <div className="cinta-velada flex overflow-hidden py-2">
        {lista(false)}
        {lista(true)}
      </div>
    </section>
  )
}
