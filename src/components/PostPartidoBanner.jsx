import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ESCUDO_ZARAGOZA, ESCUDOS_CLUBS } from '../lib/escudos'
import './PostPartidoBanner.css'

// Aviso puntual del post partido + Las Notas de Real Zaragoza-Cartagena (J4).
// Fecha límite en hora española explícita (+02:00, CEST) para que no
// dependa de la zona horaria del navegador de quien lo visite.
const LIMITE = new Date('2026-09-23T23:59:00+02:00')
const VIDEO_URL = 'https://www.youtube.com/watch?v=n0_o54csavw'
const NOTAS_URL = '/notas/2026-09-20-cartagena'

function Escudos() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      <img src={ESCUDO_ZARAGOZA} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
      <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '700' }}>VS</span>
      <img src={ESCUDOS_CLUBS['FC Cartagena']} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
    </span>
  )
}

function Pill({ children }) {
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
      background: '#f5c400', color: '#060D1A', fontFamily: 'Archivo, sans-serif',
      fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px',
    }}>
      {children}
    </span>
  )
}

export default function PostPartidoBanner() {
  const [visible] = useState(() => new Date() < LIMITE)
  if (!visible) return null

  return (
    <div className="post-partido-banner" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
      gap: '10px 24px', padding: '12px 20px', background: '#0B4390',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <a href={VIDEO_URL} target="_blank" rel="noopener noreferrer" className="post-partido-banner__item" style={{ textDecoration: 'none' }}>
        <Escudos />
        <span className="post-partido-banner__text" style={{ color: '#fff', fontFamily: 'Archivo, sans-serif', fontSize: '13px', textAlign: 'center' }}>
          <span className="post-partido-banner__full">
            <strong style={{ color: '#f5c400' }}>Ya disponible</strong> el post partido: Real Zaragoza 1-0 Cartagena
          </span>
          <span className="post-partido-banner__short">
            <strong style={{ color: '#f5c400' }}>Ya disponible:</strong> R. Zaragoza 1-0 Cartagena
          </span>
        </span>
        <Pill>▶ Ver en YouTube</Pill>
      </a>

      <span className="post-partido-banner__divider" aria-hidden="true" />

      <Link to={NOTAS_URL} className="post-partido-banner__item" style={{ textDecoration: 'none' }}>
        <Escudos />
        <span className="post-partido-banner__text" style={{ color: '#fff', fontFamily: 'Archivo, sans-serif', fontSize: '13px', textAlign: 'center' }}>
          <span className="post-partido-banner__full">
            <strong style={{ color: '#f5c400' }}>Ya puedes poner tus notas</strong> del Real Zaragoza-Cartagena
          </span>
          <span className="post-partido-banner__short">
            <strong style={{ color: '#f5c400' }}>Ya puedes votar:</strong> R. Zaragoza-Cartagena
          </span>
        </span>
        <Pill>Votar ahora →</Pill>
      </Link>
    </div>
  )
}
