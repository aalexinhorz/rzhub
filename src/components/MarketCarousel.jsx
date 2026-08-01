import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../hooks/useAuth'
import { useEscudo } from '../lib/escudos'
import './MarketCarousel.css'

const DEFAULT_PHOTO = 'https://www.fotmob.com/img/player-fallback-dark.png'

// Solo existen dos variantes visuales: fichaje (entrada) y salida.
// Los sub-tipos de Supabase se agrupan en una de las dos.
const MOVEMENT_CONFIG = {
  alta:          { type: 'signing' },
  cesion_vuelta: { type: 'signing' },
  baja:          { type: 'departure' },
  cesion_salida: { type: 'departure' },
}

function normalizar(str) {
  if (!str) return ''
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/**
 * MarketCard — único componente para las dos variantes del mercado.
 * type: 'signing' (fichaje) | 'departure' (salida)
 */
function MarketCard({ type, playerName, clubName, playerImage, clubLogo, onClick }) {
  const isSigning = type === 'signing'
  const movementText = isSigning ? 'FICHAJE' : 'SALIDA'
  const accessibleName = clubName
    ? `${playerName}, ${isSigning ? 'fichaje procedente del' : 'salida al'} ${clubName}`
    : `${playerName}, ${isSigning ? 'fichaje' : 'salida'}`

  return (
    <button
      type="button"
      className={`market-card market-card--${type}`}
      onClick={onClick}
      aria-label={accessibleName}
    >
      {/* .market-card (botón) es el hit-box estable: nunca se transforma,
          así el hover no "huye" del cursor cuando la card se eleva.
          Todo el movimiento visual vive en .market-card__inner. */}
      <span className="market-card__inner">
        <span className="market-card__media">
          <img
            className="market-card__player"
            src={playerImage || DEFAULT_PHOTO}
            alt=""
            onError={e => { e.target.src = DEFAULT_PHOTO }}
          />
          {clubName && (
            <span className="market-card__club">
              {clubLogo ? (
                <img src={clubLogo} alt="" aria-hidden="true" onError={e => { e.target.style.display = 'none' }} />
              ) : (
                <span className="market-card__club-fallback" aria-hidden="true">{clubName[0]}</span>
              )}
            </span>
          )}
        </span>

        <span className="market-card__accent" />

        <span className="market-card__content">
          <h4 className="market-card__name">{playerName}</h4>
          <span className="market-card__type">{movementText}</span>
          {clubName && <span className="market-card__team">{clubName}</span>}
        </span>
      </span>
    </button>
  )
}

// Adaptador: traduce un registro de Supabase (`mov`) a las props de MarketCard.
function MercadoCard({ mov, navigate }) {
  const config = MOVEMENT_CONFIG[mov.tipo] || MOVEMENT_CONFIG.alta
  const clubName = config.type === 'signing' ? mov.club_origen : mov.club_destino
  const clubLogo = useEscudo(clubName)

  return (
    <MarketCard
      type={config.type}
      playerName={mov.nombre}
      clubName={clubName}
      playerImage={mov.foto_url || DEFAULT_PHOTO}
      clubLogo={clubLogo}
      onClick={() => navigate('/mercado')}
    />
  )
}

export default function MarketCarousel() {
  const navigate = useNavigate()
  const [movimientos, setMovimientos] = useState([])
  const trackRef = useRef(null)
  const posRef = useRef(0)
  const rafRef = useRef(null)
  const pausadoRef = useRef(false)
  const totalWRef = useRef(0)
  const STEP = 0.6

  useEffect(() => {
    async function fetchMercado() {
      const { data: movData } = await supabase.from('mercado').select('*').order('fecha', { ascending: false })
      if (!movData) return
      const sinFoto = movData.filter(m => !m.foto_url)
      if (sinFoto.length > 0) {
        const { data: players } = await supabase.from('players').select('name, photo')
        if (players) {
          movData.forEach(mov => {
            if (!mov.foto_url) {
              const player = players.find(p => normalizar(p.name) === normalizar(mov.nombre))
              if (player) mov.foto_url = player.photo
            }
          })
        }
      }
      setMovimientos(movData)
    }
    fetchMercado()
  }, [])

  // Medimos el ancho real de un set de cards (en vez de calcularlo a mano)
  // para que el bucle del carrusel se adapte solo a los distintos anchos
  // de card por breakpoint (168 / 152 / 138px).
  useEffect(() => {
    function measure() {
      if (trackRef.current) totalWRef.current = trackRef.current.scrollWidth / 3
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [movimientos])

  useEffect(() => {
    if (movimientos.length === 0) return
    const animate = () => {
      if (!pausadoRef.current && totalWRef.current) {
        posRef.current += STEP
        if (posRef.current >= totalWRef.current) posRef.current -= totalWRef.current
        if (trackRef.current) trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [movimientos])

  if (movimientos.length === 0) return null

  const DUPLICADOS = [...movimientos, ...movimientos, ...movimientos]

  return (
    <section
      className="market-carousel"
      onMouseEnter={() => { pausadoRef.current = true }}
      onMouseLeave={() => { pausadoRef.current = false }}
    >
      <div className="market-carousel__head">
        <p className="market-carousel__eyebrow">Temporada 26/27</p>
        <h3 className="market-carousel__title">Mercado de fichajes</h3>
      </div>
      <div className="market-carousel__viewport">
        <div className="market-carousel__fade market-carousel__fade--left" />
        <div className="market-carousel__fade market-carousel__fade--right" />
        <div ref={trackRef} className="market-carousel__track">
          {DUPLICADOS.map((mov, i) => (
            <MercadoCard key={i} mov={mov} navigate={navigate} />
          ))}
        </div>
      </div>
    </section>
  )
}
