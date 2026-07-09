import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Home2 from './pages/Home2'
import Home3 from './pages/Home3'
import Lineup from './pages/Lineup'
import Tierlist from './pages/Tierlist'
import Comunidad from './pages/Comunidad'
import Perfil from './pages/Perfil'
import Rumores from './pages/Rumores'
import Contenidos from './pages/Contenidos'
import OnTour from './pages/OnTour'
import Noticias from './pages/Noticias'
import NoticiaDetalle from './pages/NoticiaDetalle'
import Redaccion from './pages/Redaccion'
import Calendario from './pages/Calendario'
import Contacto from './pages/Contacto'
import Porra from './pages/Porra'
import Mercado from './pages/Mercado'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'sans-serif' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home2" element={<Home2 />} />
        <Route path="/home3" element={<Home3 />} />
        <Route path="/lineup" element={<Lineup />} />
        <Route path="/tierlist" element={<Tierlist />} />
        <Route path="/comunidad" element={<Comunidad />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/noticias/:slug" element={<NoticiaDetalle />} />
        <Route path="/redaccion" element={<Redaccion />} />
        <Route path="/contenidos" element={<Navigate to="/" replace />} />
        <Route path="/on-tour" element={<OnTour />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/rumores" element={<Rumores />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/porra" element={<Porra />} />
        <Route path="/mercado" element={<Mercado />} />
      </Routes>
    </div>
  )
}