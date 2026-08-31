import { useState } from 'react'
import { ESCUDO_ZARAGOZA, ESCUDOS_CLUBS } from '../lib/escudos'
import './PostPartidoBanner.css'

// Aviso puntual del post partido Gimnàstic-Zaragoza (J1). Fecha límite en
// hora española explícita (+02:00, CEST) para que no dependa de la zona
// horaria del navegador de quien lo visite.
const LIMITE = new Date('2026-09-02T23:59:00+02:00')
const VIDEO_URL = 'https://www.youtube.com/watch?v=uXQE6t5qqcA'

export default function PostPartidoBanner() {
  const [visible] = useState(() => new Date() < LIMITE)
  if (!visible) return null

  return (
    <a
      href={VIDEO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="post-partido-banner"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
        gap: '12px', padding: '12px 20px', background: '#0B4390',
        borderBottom: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <img src={ESCUDOS_CLUBS['Gimnàstic de Tarragona']} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontSize: '12px', fontWeight: '700' }}>VS</span>
        <img src={ESCUDO_ZARAGOZA} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
      </span>
      <span className="post-partido-banner__text" style={{ color: '#fff', fontFamily: 'Archivo, sans-serif', fontSize: '13px', textAlign: 'center' }}>
        <span className="post-partido-banner__full">
          <strong style={{ color: '#f5c400' }}>Ya disponible</strong> el post partido: Gimnàstic 2-0 Real Zaragoza
        </span>
        <span className="post-partido-banner__short">
          <strong style={{ color: '#f5c400' }}>Ya disponible:</strong> Gimnàstic 2-0 Zaragoza
        </span>
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
        background: '#f5c400', color: '#060D1A', fontFamily: 'Archivo, sans-serif',
        fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px',
      }}>
        ▶ Ver en YouTube
      </span>
    </a>
  )
}
