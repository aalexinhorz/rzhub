import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Lineup from './pages/Lineup'
import Tierlist from './pages/Tierlist'
import Comunidad from './pages/Comunidad'
import Perfil from './pages/Perfil'
import Rumores from './pages/Rumores'
import Contenidos from './pages/Contenidos'
import OnTour from './pages/OnTour'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'sans-serif' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lineup" element={<Lineup />} />
        <Route path="/tierlist" element={<Tierlist />} />
        <Route path="/comunidad" element={<Comunidad />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/noticias" element={<Rumores />} />
        <Route path="/contenidos" element={<Contenidos />} />
        <Route path="/on-tour" element={<OnTour />} />
      </Routes>
    </div>
  )
}