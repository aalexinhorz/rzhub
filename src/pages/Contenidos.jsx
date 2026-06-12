import { useState, useEffect } from 'react'

const CANAL_ID = 'UC-UjWmvk0vM5A-ug1CgeykQ'
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

async function fetchVideos() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CANAL_ID}&part=snippet&order=date&maxResults=20&type=video`
    )
    const data = await res.json()
    return (data.items || []).map(item => ({
      id: item.id.videoId,
      titulo: item.snippet.title,
      miniatura: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      fecha: item.snippet.publishedAt,
      descripcion: item.snippet.description?.slice(0, 120),
      enVivo: item.snippet.liveBroadcastContent === 'live',
      proximoDirecto: item.snippet.liveBroadcastContent === 'upcoming',
    }))
  } catch (e) {
    console.error('Error YouTube:', e)
    return []
  }
}

function VideoCard({ video }) {
  const fecha = new Date(video.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: '8px', overflow: 'hidden',
        border: '1px solid #e0e0e0', marginBottom: '12px',
        transition: 'box-shadow 0.15s', cursor: 'pointer',
        display: 'flex', gap: '0',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{ position: 'relative', flexShrink: 0, width: '180px' }}>
          <img
            src={video.miniatura}
            alt={video.titulo}
            style={{ width: '180px', height: '101px', objectFit: 'cover', display: 'block' }}
          />
          {video.enVivo && (
            <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#ff0000', color: 'white', borderRadius: '4px', padding: '2px 6px', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '700' }}>
              🔴 EN DIRECTO
            </div>
          )}
          {video.proximoDirecto && (
            <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#ff6600', color: 'white', borderRadius: '4px', padding: '2px 6px', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '700' }}>
              🔔 PRÓXIMO
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '2px 6px' }}>
            <span style={{ color: 'white', fontSize: '16px' }}>▶</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px', minWidth: 0 }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#222', marginBottom: '4px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {video.titulo}
          </div>
          <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#999', marginBottom: '6px' }}>{fecha}</div>
          {video.descripcion && (
            <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#666', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {video.descripcion}
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

export default function Contenidos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos().then(v => {
      setVideos(v)
      setLoading(false)
    })
  }, [])

  const enVivo = videos.filter(v => v.enVivo)
  const proximos = videos.filter(v => v.proximoDirecto)
  const resto = videos.filter(v => !v.enVivo && !v.proximoDirecto)

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: '72px', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: '0 0 8px 0' }}>
          Contenidos
        </h1>
        <p style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#999', marginBottom: '24px' }}>
          Canal de YouTube · Palmadas al Viento
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999', fontFamily: 'sans-serif' }}>
            Cargando vídeos...
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999', fontFamily: 'sans-serif' }}>
            No se pudieron cargar los vídeos.
          </div>
        ) : (
          <div>
            {enVivo.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#ff0000', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>🔴 En directo ahora</h2>
                {enVivo.map(v => <VideoCard key={v.id} video={v} />)}
              </>
            )}
            {proximos.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#ff6600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: '20px' }}>🔔 Próximos directos</h2>
                {proximos.map(v => <VideoCard key={v.id} video={v} />)}
              </>
            )}
            {resto.length > 0 && (
              <>
                {(enVivo.length > 0 || proximos.length > 0) && (
                  <h2 style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: '20px' }}>Últimos vídeos</h2>
                )}
                {resto.map(v => <VideoCard key={v.id} video={v} />)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}