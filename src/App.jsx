import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'

// Solo la Home se carga en el bundle inicial (es la puerta de entrada
// más común); el resto de páginas se cargan por rutas bajo demanda
// con React.lazy — reduce el JS que hay que descargar/ejecutar antes
// de pintar la primera página, que es justo lo que miden las Core Web
// Vitals (LCP/INP) que Google usa como factor de posicionamiento.
const Lineup = lazy(() => import('./pages/Lineup'))
const Tierlist = lazy(() => import('./pages/Tierlist'))
const Comunidad = lazy(() => import('./pages/Comunidad'))
const Perfil = lazy(() => import('./pages/Perfil'))
const OnTour = lazy(() => import('./pages/OnTour'))
const Noticias = lazy(() => import('./pages/Noticias'))
const NoticiaDetalle = lazy(() => import('./pages/NoticiaDetalle'))
const Redaccion = lazy(() => import('./pages/Redaccion'))
const RedaccionFotos = lazy(() => import('./pages/RedaccionFotos'))
const Calendario = lazy(() => import('./pages/Calendario'))
const Contacto = lazy(() => import('./pages/Contacto'))
const Porra = lazy(() => import('./pages/Porra'))
const Mercado = lazy(() => import('./pages/Mercado'))
const Tools = lazy(() => import('./pages/Tools'))
const Fotogaleria = lazy(() => import('./pages/Fotogaleria'))
const FotogaleriaPartido = lazy(() => import('./pages/FotogaleriaPartido'))
const Notas = lazy(() => import('./pages/Notas'))
const NotasPartido = lazy(() => import('./pages/NotasPartido'))
const TierlistPartido = lazy(() => import('./pages/TierlistPartido'))
const EnDirecto = lazy(() => import('./pages/EnDirecto'))
const AdivinaResultado = lazy(() => import('./pages/AdivinaResultado'))
const Estadisticas = lazy(() => import('./pages/Estadisticas'))
const Jugador = lazy(() => import('./pages/Jugador'))
const Videos = lazy(() => import('./pages/Videos'))
const Fantasy = lazy(() => import('./pages/Fantasy'))
const Rival = lazy(() => import('./pages/Rival'))
const Zaragozle = lazy(() => import('./pages/Zaragozle'))
const Sobre = lazy(() => import('./pages/Sobre'))
const Terminos = lazy(() => import('./pages/Terminos'))
const Privacidad = lazy(() => import('./pages/Privacidad'))
const Ayuda = lazy(() => import('./pages/Ayuda'))

function CargandoPagina() {
  return <div style={{ minHeight: '60vh' }} />
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<CargandoPagina />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lineup" element={<Lineup />} />
          <Route path="/tierlist" element={<Tierlist />} />
          <Route path="/comunidad" element={<Comunidad />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/noticias/:slug" element={<NoticiaDetalle />} />
          <Route path="/redaccion" element={<Redaccion />} />
          <Route path="/redaccion-fotos" element={<RedaccionFotos />} />
          <Route path="/contenidos" element={<Navigate to="/" replace />} />
          <Route path="/on-tour" element={<OnTour />} />
          <Route path="/calendario" element={<Calendario />} />
          {/* Los tweets ya se publican como noticias en /noticias (ver
              Edge Function fetch-tweets-rumores) — se mantiene este
              redirect por enlaces antiguos que ya apunten a /rumores. */}
          <Route path="/rumores" element={<Navigate to="/noticias" replace />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/porra" element={<Porra />} />
          <Route path="/mercado" element={<Mercado />} />
          <Route path="/herramientas" element={<Tools />} />
          <Route path="/fotogaleria" element={<Fotogaleria />} />
          <Route path="/fotogaleria/:partido" element={<FotogaleriaPartido />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/notas/:partido" element={<NotasPartido />} />
          <Route path="/tierlist-partido" element={<TierlistPartido />} />
          <Route path="/en-directo" element={<EnDirecto />} />
          <Route path="/adivina-resultado" element={<AdivinaResultado />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/jugador/:id" element={<Jugador />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/fantasy" element={<Fantasy />} />
          <Route path="/rival/:slug" element={<Rival />} />
          <Route path="/zaragozle" element={<Zaragozle />} />
          <Route path="/sobre-rz-hub" element={<Sobre />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/ayuda" element={<Ayuda />} />
        </Routes>
      </Suspense>
    </div>
  )
}
