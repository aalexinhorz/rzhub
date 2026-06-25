import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useLiveStream from '../hooks/useLiveStream'
import { supabase } from '../hooks/useAuth'

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

function formatFecha(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function SeccionNoticias({ noticias, onVerTodas, onAbrirNoticia }) {
  if (!noticias || noticias.length === 0) return null

  const hero = noticias[0]
  const secundarias = noticias.slice(1, 4)
  const masNoticias = noticias.slice(4, 7)

  return (
    <div style={{ width: '100%', background: '#f8f9fa', paddingTop: '48px', paddingBottom: '48px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '3px solid #0B4390', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontFamily: 'sans-serif', fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: '800', color: '#0B4390', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Últimas Noticias
          </h2>
          <button onClick={onVerTodas} style={{ background: 'none', border: 'none', color: '#0B4390', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', textDecoration: 'underline' }}>
            Ver todas →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>

          {/* Hero */}
          <div
            onClick={() => onAbrirNoticia(hero.slug)}
            style={{ gridColumn: 'span 2', cursor: 'pointer', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            {hero.imagen_url && (
              <div style={{ width: '100%', height: '260px', overflow: 'hidden' }}>
                <img src={hero.imagen_url} alt={hero.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ background: '#0B4390', color: 'white', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {hero.categoria || 'Noticias'}
                </span>
                <span style={{ color: '#999', fontFamily: 'sans-serif', fontSize: '12px' }}>{formatFecha(hero.created_at)}</span>
              </div>
              <h3 style={{ margin: '0 0 10px', fontFamily: 'sans-serif', fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '800', color: '#111', lineHeight: '1.25' }}>
                {hero.titulo}
              </h3>
              {hero.excerpt && (
                <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '14px', color: '#555', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {hero.excerpt}
                </p>
              )}
            </div>
          </div>

          {/* Secundarias */}
          {secundarias.map(post => (
            <div
              key={post.id}
              onClick={() => onAbrirNoticia(post.slug)}
              style={{ cursor: 'pointer', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
            >
              {post.imagen_url && (
                <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>
                  <img src={post.imagen_url} alt={post.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
              <div style={{ padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ background: '#f5c400', color: '#0B4390', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {post.categoria || 'Noticias'}
                  </span>
                  <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '11px' }}>{formatFecha(post.created_at)}</span>
                </div>
                <h4 style={{ margin: 0, fontFamily: 'sans-serif', fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: '700', color: '#111', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.titulo}
                </h4>
              </div>
            </div>
          ))}
        </div>

        {/* Fila inferior */}
        {masNoticias.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {masNoticias.map(post => (
              <div
                key={post.id}
                onClick={() => onAbrirNoticia(post.slug)}
                style={{ cursor: 'pointer', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.07)', transition: 'transform 0.2s', display: 'flex', gap: '12px', alignItems: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {post.imagen_url && (
                  <div style={{ width: '90px', minWidth: '90px', height: '70px', overflow: 'hidden' }}>
                    <img src={post.imagen_url} alt={post.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ padding: '10px 12px 10px 0', flex: 1 }}>
                  <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{formatFecha(post.created_at)}</span>
                  <h5 style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', color: '#111', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.titulo}
                  </h5>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const live = useLiveStream()
  const [noticias, setNoticias] = useState([])

  useEffect(() => {
    async function fetchNoticias() {
      const { data } = await supabase
        .from('noticias')
        .select('*')
        .eq('publicada', true)
        .order('created_at', { ascending: false })
        .limit(7)
      setNoticias(data || [])
    }
    fetchNoticias()
  }, [])

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>

      <div style={{
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

        <LiveBanner live={live} />
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

      <SeccionNoticias
        noticias={noticias}
        onVerTodas={() => navigate('/noticias')}
        onAbrirNoticia={(slug) => navigate(`/noticias/${slug}`)}
      />

    </div>
  )
}