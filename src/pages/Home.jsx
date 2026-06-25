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

  if (loading || !partido) return null

  const esEnVivo = !!enVivo
  const home = partido.homeTeam
  const away = partido.awayTeam
  const fecha = new Date(partido.startTimestamp * 1000)
  const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      background: 'white',
      borderRadius: '10px',
      padding: '14px 20px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ color: '#0B4390', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {esEnVivo ? '🔴 En directo' : 'Próximo partido'}
        </span>
        {!esEnVivo && partido.startTimestamp && (
          <span style={{ color: '#f5c400', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '700', background: '#0B4390', padding: '2px 8px', borderRadius: '4px' }}>
            <Countdown timestamp={partido.startTimestamp} />
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${home.id}_large.png`} alt={home.name}
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none' }} />
          <span style={{ color: '#111', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>{home.shortName || home.name}</span>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {esEnVivo ? (
            <div>
              <div style={{ color: '#111', fontFamily: 'Humane, sans-serif', fontSize: '32px', fontWeight: '700', lineHeight: 1 }}>
                {partido.homeScore?.current ?? 0} - {partido.awayScore?.current ?? 0}
              </div>
              <div style={{ color: '#e65100', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>
                {partido.time?.played || ''}′
              </div>
            </div>
          ) : (
            <div>
              <div style={{ color: '#111', fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '700' }}>VS</div>
              <div style={{ color: '#999', fontFamily: 'sans-serif', fontSize: '11px', marginTop: '4px' }}>{fechaStr} · {horaStr}</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${away.id}_large.png`} alt={away.name}
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none' }} />
          <span style={{ color: '#111', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>{away.shortName || away.name}</span>
        </div>
      </div>

      {partido.tournament && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '11px' }}>{partido.tournament.name}</span>
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
        background: '#fff5f5', border: '1px solid rgba(255,0,0,0.3)',
        borderRadius: '8px', padding: '10px 16px',
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: '18px', animation: 'pulse-live 2s infinite' }}>🔴</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: '#ff5555', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Palmadas al Viento en directo
        </div>
        <div style={{ color: '#333', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
  if (!noticias || noticias.length === 0) return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#999', fontSize: '15px' }}>No hay noticias publicadas todavía.</p>
    </div>
  )

  const hero = noticias[0]
  const secundarias = noticias.slice(1, 5)
  const masNoticias = noticias.slice(5, 8)

  return (
    <div style={{ width: '100%', background: '#f8f9fa', padding: '32px 0 48px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '3px solid #0B4390', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontFamily: 'sans-serif', fontSize: 'clamp(16px, 2.5vw, 20px)', fontWeight: '900', color: '#0B4390', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Últimas Noticias
          </h2>
          <button onClick={onVerTodas} style={{ background: 'none', border: 'none', color: '#0B4390', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', textDecoration: 'underline' }}>
            Ver todas →
          </button>
        </div>

        {/* Hero izquierda + columna derecha */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>

          {/* Hero */}
          <div
            onClick={() => onAbrirNoticia(hero.slug)}
            style={{ flex: '0 0 calc(60% - 12px)', minWidth: '280px', cursor: 'pointer', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            {hero.imagen_url && (
              <div style={{ width: '100%', height: '340px', overflow: 'hidden', background: '#eee' }}>
                <img src={hero.imagen_url} alt={hero.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ padding: '18px 20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ background: '#0B4390', color: 'white', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '3px', textTransform: 'uppercase' }}>
                  {hero.categoria || 'Noticias'}
                </span>
                <span style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '12px' }}>{formatFecha(hero.created_at)}</span>
                {hero.autor && <span style={{ color: '#aaa', fontFamily: 'sans-serif', fontSize: '12px' }}>· {hero.autor}</span>}
              </div>
              <h3 style={{ margin: '0 0 10px', fontFamily: 'sans-serif', fontSize: 'clamp(18px, 2.2vw, 26px)', fontWeight: '900', color: '#111', lineHeight: '1.2' }}>
                {hero.titulo}
              </h3>
              {hero.excerpt && (
                <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '14px', color: '#666', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {hero.excerpt}
                </p>
              )}
            </div>
          </div>

          {/* Columna derecha */}
          <div style={{ flex: '1', minWidth: '240px', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            {secundarias.map((post, i) => (
              <div
                key={post.id}
                onClick={() => onAbrirNoticia(post.slug)}
                style={{ cursor: 'pointer', padding: '14px 16px', borderBottom: i < secundarias.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'background 0.15s', flex: 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
              >
                {post.imagen_url && (
                  <div style={{ width: '80px', minWidth: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', background: '#eee' }}>
                    <img src={post.imagen_url} alt={post.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <span style={{ background: '#f5c400', color: '#0B4390', fontFamily: 'sans-serif', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                      {post.categoria || 'Noticias'}
                    </span>
                    <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '11px' }}>{formatFecha(post.created_at)}</span>
                  </div>
                  <h4 style={{ margin: 0, fontFamily: 'sans-serif', fontSize: 'clamp(13px, 1.5vw, 15px)', fontWeight: '700', color: '#111', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.titulo}
                  </h4>
                </div>
              </div>
            ))}
          </div>

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
                  <div style={{ width: '90px', minWidth: '90px', height: '70px', overflow: 'hidden', background: '#eee' }}>
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
  const { partido: proximo } = useProximoPartido()
  const enVivo = usePartidoEnVivo()

  useEffect(() => {
    async function fetchNoticias() {
      const { data } = await supabase
        .from('noticias')
        .select('*')
        .eq('publicada', true)
        .order('created_at', { ascending: false })
        .limit(8)
      setNoticias(data || [])
    }
    fetchNoticias()
  }, [])

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>

      {/* Barra superior con partido y live */}
      <div style={{ background: '#0B4390', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <LiveBanner live={live} />
      </div>

      {/* Widget partido en franja azul compacta */}
      <div style={{ background: '#f0f4ff', borderBottom: '1px solid #dde4f5', padding: '12px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <PartidoWidget />
        </div>
      </div>

      {/* Noticias */}
      <SeccionNoticias
        noticias={noticias}
        onVerTodas={() => navigate('/noticias')}
        onAbrirNoticia={(slug) => navigate(`/noticias/${slug}`)}
      />

    </div>
  )
}