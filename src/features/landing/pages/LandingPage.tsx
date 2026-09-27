import { useEffect } from 'react'
import { CarruselServicios } from '../components/CarruselServicios'
import { CintaSectores } from '../components/CintaSectores'
import { CierreLanding } from '../components/CierreLanding'
import { Hero } from '../components/Hero'
import { ModulosServicios } from '../components/ModulosServicios'
import { NavegacionLanding } from '../components/NavegacionLanding'
import { PorQueElegirnos } from '../components/PorQueElegirnos'
import { ProcesoTrabajo } from '../components/ProcesoTrabajo'

export default function LandingPage() {
  // El portal interno no usa desplazamiento suave; aquí sí, porque toda la
  // navegación de la landing son anclas dentro de la misma página.
  useEffect(() => {
    const raiz = document.documentElement
    raiz.classList.add('scroll-suave')
    return () => raiz.classList.remove('scroll-suave')
  }, [])

  return (
    <div className="min-h-dvh bg-surface">
      <NavegacionLanding />
      <main>
        <Hero />
        <CintaSectores />
        <CarruselServicios />
        <ModulosServicios />
        <ProcesoTrabajo />
        <PorQueElegirnos />
        <CierreLanding />
      </main>
    </div>
  )
}
