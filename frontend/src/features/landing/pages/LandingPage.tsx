import { useEffect } from 'react'
import { CierreLanding } from '../components/CierreLanding'
import { CintaSectores } from '../components/CintaSectores'
import { Cotizador } from '../components/Cotizador'
import { NavegacionLanding } from '../components/NavegacionLanding'
import { PortalMarca } from '../components/PortalMarca'
import { PorQueElegirnos } from '../components/PorQueElegirnos'
import { PortalVivo } from '../components/PortalVivo'
import { ProcesoTrabajo } from '../components/ProcesoTrabajo'
import { Servicios } from '../components/Servicios'

/**
 * Landing pública · «Cristal»: vidrio translúcido sobre luces azules del logo,
 * navegación flotante y entradas animadas. Sin fotos ni degradados.
 */
export default function LandingPage() {
  // El portal interno no usa desplazamiento suave; aquí sí (anclas).
  useEffect(() => {
    const raiz = document.documentElement
    raiz.classList.add('scroll-suave')
    return () => raiz.classList.remove('scroll-suave')
  }, [])

  // Reflejo de luz: la tarjeta de vidrio bajo el cursor recibe su posición.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    let cuadro = 0
    const alMover = (e: PointerEvent) => {
      if (cuadro) return
      cuadro = requestAnimationFrame(() => {
        cuadro = 0
        const el = (e.target as Element | null)?.closest<HTMLElement>('.reflejo')
        if (!el) return
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - r.left}px`)
        el.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    }
    document.addEventListener('pointermove', alMover, { passive: true })
    return () => {
      document.removeEventListener('pointermove', alMover)
      cancelAnimationFrame(cuadro)
    }
  }, [])

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <NavegacionLanding />
      <main>
        <PortalMarca />
        <CintaSectores />
        <Servicios />
        <PortalVivo />
        <ProcesoTrabajo />
        <Cotizador />
        <PorQueElegirnos />
        <CierreLanding />
      </main>
    </div>
  )
}
