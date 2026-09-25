import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import { useEscudo } from '../lib/escudos'
import './Rivales.css'

function useRivales() {
  const [rivales, setRivales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('rivales').select('*').order('nombre'),
      supabase.from('rivales_plantilla').select('rival_id'),
      supabase.from('rivales_enfrentamientos').select('rival_id'),
    ]).then(([{ data: rivalesData }, { data: plantillaData }, { data: enfData }]) => {
      const conteoPlantilla = new Map()
      plantillaData?.forEach(p => conteoPlantilla.set(p.rival_id, (conteoPlantilla.get(p.rival_id) || 0) + 1))
      const conteoEnf = new Map()
      enfData?.forEach(e => conteoEnf.set(e.rival_id, (conteoEnf.get(e.rival_id) || 0) + 1))

      setRivales((rivalesData || []).map(r => ({
        ...r,
        numJugadores: conteoPlantilla.get(r.id) || 0,
        numEnfrentamientos: conteoEnf.get(r.id) || 0,
      })))
      setLoading(false)
    })
  }, [])

  return { rivales, loading }
}

function EscudoRival({ nombre, size = 56 }) {
  const src = useEscudo(nombre)
  if (!src) return <span className="rivales-escudo rivales-escudo--placeholder" style={{ width: size, height: size }}>{nombre?.[0]}</span>
  return <img src={src} alt="" className="rivales-escudo" style={{ width: size, height: size }} onError={e => { e.target.style.display = 'none' }} />
}

function TarjetaRival({ rival }) {
  const extracto = rival.historia ? rival.historia.slice(0, 130).trim() + (rival.historia.length > 130 ? '…' : '') : null

  return (
    <Link to={`/rival/${rival.id}`} className="rivales-tarjeta">
      <EscudoRival nombre={rival.nombre} />
      <div className="rivales-tarjeta__cuerpo">
        <h2 className="rivales-tarjeta__nombre">{rival.nombre}</h2>
        <p className="rivales-tarjeta__datos">
          {rival.fundacion && <>Fundado en {rival.fundacion}</>}
          {rival.fundacion && rival.estadio && ' · '}
          {rival.estadio}
        </p>
        {extracto && <p className="rivales-tarjeta__extracto">{extracto}</p>}
        <div className="rivales-tarjeta__meta">
          <span>{rival.numJugadores} jugadores</span>
          {rival.numEnfrentamientos > 0 && <span>{rival.numEnfrentamientos} enfrentamientos</span>}
        </div>
      </div>
      <svg className="rivales-tarjeta__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
    </Link>
  )
}

export default function Rivales() {
  const { rivales, loading } = useRivales()

  return (
    <div className="rivales-page">
      <SEO
        title="Rivales | Primera Federación Grupo 2 | RZ Hub"
        description="Historia, plantilla completa y enfrentamientos del Real Zaragoza contra todos los rivales de 1ª RFEF Grupo 2."
        path="/rivales"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Rivales del Real Zaragoza',
          url: `${SITE_URL}/rivales`,
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="rivales-hero">
        <p className="rivales-hero__eyebrow">Primera Federación · Grupo 2 · 2026/2027</p>
        <h1 className="rivales-hero__title">Rivales</h1>
        <p className="rivales-hero__subtitle">Historia, plantilla completa y cara a cara del Real Zaragoza contra todos los equipos del grupo.</p>
      </div>

      <div className="rivales-body">
        <div className="rivales-container">
          {loading ? (
            <p className="rivales-state">Cargando rivales…</p>
          ) : rivales.length === 0 ? (
            <p className="rivales-state">Todavía no hay fichas de rivales.</p>
          ) : (
            <div className="rivales-grid">
              {rivales.map(r => <TarjetaRival key={r.id} rival={r} />)}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
