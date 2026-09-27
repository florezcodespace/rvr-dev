const SECTORES = [
  'Oficinas y coworkings',
  'Consultorios',
  'Bodegas y centros de acopio',
  'Comercios y locales',
  'Conjuntos residenciales',
  'Instituciones educativas',
  'Talleres y producción',
  'Hogares',
]

/**
 * Cinta de sectores atendidos.
 *
 * El contenido va duplicado y la pista recorre exactamente la mitad: al
 * reiniciarse cae sobre una copia idéntica y el bucle no se nota. La segunda
 * copia queda oculta para el lector de pantalla, que si no leería la lista dos
 * veces seguidas.
 */
export function CintaSectores() {
  return (
    <section
      aria-label="Sectores que atendemos"
      className="border-y border-border-base bg-surface py-5"
    >
      <div className="cinta-velada flex overflow-hidden">
        <ul className="anim-marquesina m-0 flex shrink-0 list-none gap-10 p-0 pr-10">
          {SECTORES.map((sector) => (
            <li
              key={sector}
              className="flex flex-none items-center gap-3 text-[13px] font-semibold tracking-[0.02em] whitespace-nowrap text-fg-subtle"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-[var(--rvr-primary)]/50"
              />
              {sector}
            </li>
          ))}
        </ul>
        <ul
          aria-hidden="true"
          className="anim-marquesina m-0 flex shrink-0 list-none gap-10 p-0 pr-10"
        >
          {SECTORES.map((sector) => (
            <li
              key={sector}
              className="flex flex-none items-center gap-3 text-[13px] font-semibold tracking-[0.02em] whitespace-nowrap text-fg-subtle"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-[var(--rvr-primary)]/50"
              />
              {sector}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
