import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const TEAM_ID = 2815
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const API_HOST = 'sportapi7.p.rapidapi.com'

function useProximoPartido() {
  const [partido, setPartido] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPartidos() {
      try {
        const res = await fetch(
          `https://${API_HOST}/api/v1/team/${TEAM_ID}/events/next/0`,
          {
            headers: {
              'x-rapidapi-host': API_HOST,
              'x-rapidapi-key': API_KEY,
            }
          }
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
          {
            headers: {
              'x-rapidapi-host': API_HOST,
              'x-rapidapi-key': API_KEY,
            }
          }
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

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: '#0B4390',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '40px 20px',
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
        La web del Real Zaragoza. Crea tu alineación, valora jugadores y mucho más.
      </p>

      <PartidoWidget />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '500px' }}>
        <button onClick={() => navigate('/lineup')} style={{
          background: '#f5c400', color: '#0B4390', border: 'none',
          borderRadius: '8px', padding: '14px 20px',
          fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '700',
          cursor: 'pointer', flex: 1, minWidth: '130px',
        }}>
          Crear alineación
        </button>
        <button onClick={() => navigate('/tierlist')} style={{
          background: 'transparent', color: '#ffffff',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: '8px', padding: '14px 20px',
          fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600',
          cursor: 'pointer', flex: 1, minWidth: '130px',
        }}>
          Tier List
        </button>
        <button onClick={() => navigate('/noticias')} style={{
          background: 'transparent', color: '#ffffff',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: '8px', padding: '14px 20px',
          fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600',
          cursor: 'pointer', flex: 1, minWidth: '130px',
        }}>
          Últimas Noticias
        </button>
        <button onClick={() => navigate('/contenidos')} style={{
          background: 'transparent', color: '#ffffff',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: '8px', padding: '14px 20px',
          fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600',
          cursor: 'pointer', flex: 1, minWidth: '130px',
        }}>
          Contenidos
        </button>
      </div>
    </div>
  )
}