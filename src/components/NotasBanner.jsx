import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ESCUDO_ZARAGOZA, ESCUDOS_CLUBS } from '../lib/escudos'
import './NotasBanner.css'

// Aviso puntual de que ya se puede votar en Las Notas del Zaragoza-Antequera
// (J2). Se oculta solo cuando cierra la votación de ese partido (7 días
// tras el partido, o el día del siguiente si llega antes: ver
// calcularVentana en usePartidos.js). Fecha límite en hora española
// explícita (+02:00, CEST) para que no dependa de la zona horaria del
// navegador de quien lo visite.
const LIMITE = new Date('2026-09-12T23:59:00+02:00')
const NOTAS_URL = '/notas/2026-09-05-antequera'

export default function NotasBanner() {
  const [visible] = useState(() => new Date() < LIMITE)
  if (!visible) return null

  return (
    <Link
      to={NOTAS_URL}
      className="notas-banner"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
        gap: '12px', padding: '12px 20px', background: '#0B4390',
        borderBottom: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <img src={ESCUDO_ZARAGOZA} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontSize: '12px', fontWeight: '700' }}>VS</span>
        <img src={ESCUDOS_CLUBS['Antequera CF']} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
      </span>
      <span className="notas-banner__text" style={{ color: '#fff', fontFamily: 'Archivo, sans-serif', fontSize: '13px', textAlign: 'center' }}>
        <span className="notas-banner__full">
          <strong style={{ color: '#f5c400' }}>Ya puedes poner tus notas</strong> del partido VS Antequera
        </span>
        <span className="notas-banner__short">
          <strong style={{ color: '#f5c400' }}>Ya puedes votar:</strong> Real Zaragoza-Antequera
        </span>
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
        background: '#f5c400', color: '#060D1A', fontFamily: 'Archivo, sans-serif',
        fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px',
      }}>
        Votar ahora →
      </span>
    </Link>
  )
}
