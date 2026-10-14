import { useEffect, useState } from 'react'
import './SorteoPopup.css'

// Aviso del sorteo en X — tarjeta que entra deslizándose desde la
// derecha (no un modal con fondo oscuro: no bloquea nada de la
// página, se puede seguir navegando con ella abierta). Se enseña nada
// más entrar en la web, una sola vez por visitante (se marca en
// localStorage nada más decidir mostrarla, no solo al cerrarla).
// Quitar <SorteoPopup /> de App.jsx cuando acabe el sorteo (mismo
// criterio que el resto de banners puntuales del sitio).
const VISTO_KEY = 'rzhub_sorteo_popup_visto'
const TWEET_URL = 'https://x.com/rzhub_/status/2110324754318311612'
const DURACION_TRANSICION_MS = 420

export default function SorteoPopup() {
  // Se lee una sola vez al montar (el inicializador de useState, no un
  // efecto) para que el doble-montado de StrictMode en desarrollo no
  // se lea a sí mismo como "ya visto" — ver nota más abajo.
  const [debeMostrar] = useState(() => {
    try { return localStorage.getItem(VISTO_KEY) !== '1' } catch { return false }
  })
  const [mostrar, setMostrar] = useState(false)
  const [entrado, setEntrado] = useState(false)

  useEffect(() => {
    if (!debeMostrar) return
    try { localStorage.setItem(VISTO_KEY, '1') } catch { /* modo privado, etc. */ }

    const aparece = setTimeout(() => {
      setMostrar(true)
      requestAnimationFrame(() => setEntrado(true))
    }, 200)
    return () => clearTimeout(aparece)
  }, [debeMostrar])

  function cerrar() {
    setEntrado(false)
    setTimeout(() => setMostrar(false), DURACION_TRANSICION_MS)
  }

  if (!mostrar) return null

  return (
    <div
      className="sorteo-popup"
      style={{
        position: 'fixed',
        bottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
        right: '20px',
        left: '20px',
        marginLeft: 'auto',
        zIndex: 1500,
        background: '#0A1628',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '14px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        transform: entrado ? 'translateX(0)' : 'translateX(130%)',
        opacity: entrado ? 1 : 0,
        transition: `transform ${DURACION_TRANSICION_MS}ms cubic-bezier(.16,1,.3,1), opacity ${DURACION_TRANSICION_MS}ms ease`,
      }}
    >
      <div style={{ position: 'relative' }}>
        <img
          src="/images/sorteo-camiseta.webp"
          alt="Sorteo: camiseta de entrenamiento del Real Zaragoza a elegir, en colaboración con @RETRO_STYL3_"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        <button
          onClick={cerrar}
          aria-label="Cerrar"
          className="sorteo-popup__cerrar"
          style={{
            position: 'absolute', borderRadius: '50%',
            background: 'rgba(6,13,26,0.65)', border: 'none', color: '#fff',
            cursor: 'pointer', lineHeight: 1,
          }}
        >✕</button>
      </div>
      <div className="sorteo-popup__cta-wrap">
        <a
          href={TWEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={cerrar}
          className="sorteo-popup__cta"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', boxSizing: 'border-box',
            background: '#FFC800', color: '#060D1A', fontFamily: 'Archivo, sans-serif',
            fontWeight: '700', textDecoration: 'none',
          }}
        >
          𝕏 Ver el sorteo
        </a>
      </div>
    </div>
  )
}
