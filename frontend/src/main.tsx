import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@app/App'
import { precalentarDemo } from '@app/demo/estado'
import './styles/index.css'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el elemento #root')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * Retira el splash del HTML una vez que la aplicación ya pintó.
 *
 * Se espera un cuadro (no un temporizador fijo) para que el relevo ocurra
 * cuando el primer render está en pantalla: así no hay ni parpadeo blanco ni un
 * splash que se queda de más en equipos rápidos. Un mínimo de 420 ms evita el
 * destello de un splash que aparece y desaparece en el mismo instante.
 */
const splash = document.getElementById('splash')
const raiz = document.documentElement
const enLanding = raiz.classList.contains('splash-landing')

/** En la landing, el relevo espera a que «RVR» de la portada esté medida y en su sitio. */
const portadaLista = () =>
  new Promise<void>((listo) => {
    if (!enLanding) return listo()
    const limite = performance.now() + 3500
    const mirar = () =>
      document.querySelector('.portal-marca[data-gp-ready]') || performance.now() > limite
        ? listo()
        : requestAnimationFrame(mirar)
    mirar()
  })

if (splash) {
  const desde = performance.now()
  // En la landing el splash es la marca: se deja ver al menos un destello completo.
  const minimo = enLanding ? 1300 : 420
  requestAnimationFrame(async () => {
    await portadaLista()
    const restante = Math.max(minimo - (performance.now() - desde), 0)
    setTimeout(() => {
      // Al quitar esta clase arrancan las entradas de «TECNOLOGÍA», el menú y el botón.
      raiz.classList.remove('splash-activo')
      splash.classList.add('saliendo')
      splash.addEventListener('transitionend', () => splash.remove(), { once: true })
      // Red de seguridad por si la transición no llega a dispararse.
      setTimeout(() => splash.remove(), 900)
    }, restante)
  })
}

// Versión de demostración: la base de datos arranca mientras se ve el portal.
setTimeout(precalentarDemo, 600)
