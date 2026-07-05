import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import useLiveStream from '../hooks/useLiveStream'

const TEAM_ID = 2815
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const API_HOST = 'sportapi7.p.rapidapi.com'

const PARTIDOS = [
  { rival: 'Utebo', fecha: '29 Jul', sede: 'local', tipo: 'Amistoso', escudo: '/escudos/spain_utebo.football-logos.cc.svg' },
  { rival: 'Barbastro', fecha: '1 Ago', sede: 'visitante', tipo: 'Amistoso', escudo: '/escudos/ud-barbastro-seeklogo.png' },
  { rival: 'FC Andorra', fecha: '6 Ago', sede: 'local', tipo: 'Amistoso', escudo: '/escudos/Logo_FC_Andorra_-_2021 (1).svg' },
  { rival: 'Real Sociedad B', fecha: '8 Ago', sede: 'local', tipo: 'Amistoso', escudo: '/escudos/Real_Sociedad_logo.svg' },
  { rival: 'UD Logroñés', fecha: '14 Ago', sede: 'visitante', tipo: 'Amistoso', escudo: '/escudos/spain_ud-logrones.football-logos.cc.svg' },
  { rival: 'Villarreal B', fecha: '15 Ago', sede: 'visitante', tipo: 'Amistoso', escudo: '/escudos/Villarreal_CF_logo-en.svg' },
  { rival: 'Bilbao Athletic', fecha: '21 Ago', sede: 'local', tipo: 'Amistoso', escudo: '/escudos/Club_Athletic_Bilbao_logo (1).svg' },
]

const DUPLICADOS = [...PARTIDOS, ...PARTIDOS, ...PARTIDOS]

function useProximoPartido() {
  const [partido, setPartido] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPartidos() {
      try {
        const res = await fetch(
          `https://${API_HOST}/api/v1/team/${TEAM_ID}/events/next/0`,
          { headers: { 'x-rapidapi-host': API_HOST, 'x-rapidapi-key': API_KEY } }
        )
        const data = await res.json()
        const events = data?.events || []
        if (events.length > 0) setPartido(events[0])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchPartidos()
  }, [])

  return { partido, loading }
}

function usePartidoEnVivo() {
  const [partido, setPartido] = useState(null)

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch(
          `https://${API_HOST}/api/v1/team/${TEAM_ID}/events/live`,
          { headers: { 'x-rapidapi-host': API_HOST, 'x-rapidapi-key': API_KEY } }
        )
        if (!res.ok) return
        const data = await res.json()
        const events = data?.events || []
        if (events.length > 0) setPartido(events[0])
      } catch (e) {
        console.error(e)
      }
    }
    fetchLive()
    const interval = setInterval(fetchLive, 60000)
    return () => clearInterval(interval)
  }, [])

  return partido
}

function Countdown({ timestamp }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function calcular() {
      const diff = timestamp * 1000 - Date.now()
      if (diff <= 0) { setTimeLeft('¡Ahora!'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`)
      else if (h > 0) setTimeLeft(`${h}h ${m}m`)
      else setTimeLeft(`${m}m`)
    }
    calcular()
    const interval = setInterval(calcular, 60000)
    return () => clearInterval(interval)
  }, [timestamp])

  return <span>{timeLeft}</span>
}

function PartidoWidget() {
  const { partido: proximo, loading } = useProximoPartido()
  const enVivo = usePartidoEnVivo()
  const partido = enVivo || proximo

  if (loading) return (
    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center', maxWidth: '420px', width: '100%' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif', fontSize: '13px' }}>Cargando partido...</p>
    </div>
  )

  if (!partido) return null

  const esEnVivo = !!enVivo
  const home = partido.homeTeam
  const away = partido.awayTeam
  const fecha = new Date(partido.startTimestamp * 1000)
  const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '16px 20px',
      maxWidth: '420px',
      width: '100%',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {esEnVivo ? '🔴 En directo' : 'Próximo partido'}
        </span>
        {!esEnVivo && partido.startTimestamp && (
          <span style={{ color: '#f5c400', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '700' }}>
            <Countdown timestamp={partido.startTimestamp} />
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${home.id}_large.png`} alt={home.name}
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none' }} />
          <span style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>{home.shortName || home.name}</span>
        </div>

        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {esEnVivo ? (
            <div>
              <div style={{ color: 'white', fontFamily: 'Humane, sans-serif', fontSize: '36px', fontWeight: '700', lineHeight: 1 }}>
                {partido.homeScore?.current ?? 0} - {partido.awayScore?.current ?? 0}
              </div>
              <div style={{ color: '#f5c400', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>
                {partido.time?.played || ''}′
              </div>
            </div>
          ) : (
            <div>
              <div style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '700' }}>VS</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', fontSize: '11px', marginTop: '4px' }}>{fechaStr} · {horaStr}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${away.id}_large.png`} alt={away.name}
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none' }} />
          <span style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>{away.shortName || away.name}</span>
        </div>
      </div>

      {partido.tournament && (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif', fontSize: '11px' }}>
            {partido.tournament.name}
          </span>
        </div>
      )}
    </div>
  )
}

function LiveBanner({ live }) {
  if (!live) return null
  return (
    <a href={`https://www.youtube.com/watch?v=${live.id}`} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'rgba(255,0,0,0.12)', border: '1px solid rgba(255,0,0,0.4)',
        borderRadius: '12px', padding: '12px 18px', maxWidth: '420px', width: '100%',
        textDecoration: 'none', backdropFilter: 'blur(10px)',
      }}
    >
      <span style={{ fontSize: '20px', animation: 'pulse-live 2s infinite' }}>🔴</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: '#ff5555', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Palmadas al Viento en directo
        </div>
        <div style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {live.titulo}
        </div>
      </div>
      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </a>
  )
}

function CarruselPartidos() {
  const trackRef = useRef(null)
  const posRef = useRef(0)
  const rafRef = useRef(null)
  const CARD_W = 200
  const GAP = 10
  const STEP = 0.4
  const TOTAL_W = PARTIDOS.length * (CARD_W + GAP)

  useEffect(() => {
    const animate = () => {
      posRef.current += STEP
      if (posRef.current >= TOTAL_W) posRef.current -= TOTAL_W
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{
      width: '100%',
      paddingTop: '14px',
      paddingBottom: '12px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <p style={{
        fontFamily: 'Archivo, sans-serif',
        fontWeight: '300',
        fontSize: '12px',
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
        margin: '0 0 10px',
        paddingLeft: '20px',
      }}>
        Próximos partidos
      </p>

      <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', zIndex: 2,
          background: 'linear-gradient(to right, #0B4390, transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', zIndex: 2,
          background: 'linear-gradient(to left, #0B4390, transparent)',
          pointerEvents: 'none',
        }} />
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: `${GAP}px`,
            willChange: 'transform',
            width: 'max-content',
          }}
        >
          {DUPLICADOS.map((p, i) => (
            <div
              key={i}
              style={{
                width: `${CARD_W}px`,
                flexShrink: 0,
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <img
                src={p.escudo}
                alt={p.rival}
                style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Archivo, sans-serif',
                  fontWeight: '700',
                  fontSize: '13px',
                  color: 'white',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {p.rival}
                </div>
                <div style={{
                  fontFamily: 'Archivo, sans-serif',
                  fontWeight: '300',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  {p.fecha}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    backgroundColor: p.sede === 'local' ? '#f5c400' : 'rgba(255,255,255,0.2)',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '300',
                    color: 'rgba(255,255,255,0.35)',
                    fontFamily: 'Archivo, sans-serif',
                  }}>
                    {p.sede === 'local' ? 'Local' : 'Visitante'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const live = useLiveStream()

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: '#0B4390',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    }}>

      {/* CARRUSEL — justo debajo del navbar */}
      <CarruselPartidos />

      {/* CONTENIDO CENTRADO */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '40px 20px',
        flex: 1,
      }}>
        <img
          src="/PALMADAS_AL_VIENTO_HORIZONTAL 3.png"
          alt="Palmadas al Viento"
          style={{ width: '280px', maxWidth: '85vw' }}
        />

        <p style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 'clamp(14px, 4vw, 18px)',
          textAlign: 'center',
          maxWidth: '480px',
          margin: 0,
          fontFamily: 'sans-serif',
          lineHeight: '1.5',
        }}>
          La web para todos los zaragocistas. Crea tu alineación, valora jugadores y mucho más.
        </p>

        <LiveBanner live={live} />

        <PartidoWidget />

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '500px' }}>
          <button
            onClick={() => navigate('/lineup')}
            className="home-btn home-btn-primary"
            style={{
              background: '#f5c400', color: '#0B4390', border: 'none',
              borderRadius: '8px', padding: '14px 20px',
              fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '700',
              cursor: 'pointer', flex: 1, minWidth: '130px',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
            }}
          >
            Crear alineación
          </button>
          <button
            onClick={() => navigate('/tierlist')}
            className="home-btn home-btn-outline"
            style={{
              background: 'transparent', color: '#ffffff',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '8px', padding: '14px 20px',
              fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600',
              cursor: 'pointer', flex: 1, minWidth: '130px',
              transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease',
            }}
          >
            Tier List
          </button>
          <button
            onClick={() => navigate('/on-tour')}
            className="home-btn home-btn-outline"
            style={{
              background: 'transparent', color: '#ffffff',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '8px', padding: '14px 20px',
              fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600',
              cursor: 'pointer', flex: 1, minWidth: '130px',
              transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease',
            }}
          >
            On Tour
          </button>
          <button
            onClick={() => navigate('/calendario')}
            className="home-btn home-btn-outline"
            style={{
              background: 'transparent', color: '#ffffff',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '8px', padding: '14px 20px',
              fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600',
              cursor: 'pointer', flex: 1, minWidth: '130px',
              transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease',
            }}
          >
            Calendario
          </button>
        </div>

        <style>{`
          .home-btn-primary:hover {
            background: #ffd633;
            transform: scale(1.05);
          }
          .home-btn-primary:active {
            transform: scale(1.02);
          }
          .home-btn-outline:hover {
            background: rgba(255,255,255,0.12);
            border-color: rgba(255,255,255,0.7);
            transform: scale(1.05);
          }
          .home-btn-outline:active {
            transform: scale(1.02);
          }
        `}</style>
      </div>
    </div>
  )
}