import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../hooks/useAuth'

const CANALES = [
  { handle: 'alexinhorz', nombre: 'Alexinho', descripcion: 'Post partidos y análisis', url: 'https://www.youtube.com/@AlexinhoRZ' },
  { handle: 'elrinconzaragocista', nombre: 'El Rincón Zaragocista', descripcion: 'Previas y directos', url: 'https://www.youtube.com/@ElRinc%C3%B3nZaragocista' },
]
const POR_CANAL = 8

const haceCuanto = iso => {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function Reproductor({ video, onCerrar }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onCerrar])

  return createPortal(
    <div className="h2-modal" onClick={onCerrar} role="dialog" aria-modal="true" aria-label={video.titulo}>
      <div className="h2-modal__caja" onClick={e => e.stopPropagation()}>
        <button type="button" className="h2-modal__cerrar" onClick={onCerrar} aria-label="Cerrar vídeo">✕</button>
        <div className="h2-modal__video">
          <iframe
            src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1&rel=0`}
            title={video.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="h2-modal__titulo">{video.titulo}</p>
      </div>
    </div>,
    document.body,
  )
}

// Últimos vídeos de Alexinho y El Rincón Zaragocista (videos_canal, que se
// actualiza solo cada 15 min). Se reproducen dentro de la web.
export default function VideosCanales() {
  const [canal, setCanal] = useState(CANALES[0].handle)
  const [videos, setVideos] = useState({})
  const [abierto, setAbierto] = useState(null)

  useEffect(() => {
    let activo = true
    Promise.all(CANALES.map(c =>
      supabase.from('videos_canal')
        .select('video_id, titulo, published_at, es_directo, directo_activo')
        .eq('canal_handle', c.handle)
        .eq('oculto_home', false)
        .order('published_at', { ascending: false })
        .limit(POR_CANAL)
        .then(({ data }) => [c.handle, data || []]),
    )).then(pares => { if (activo) setVideos(Object.fromEntries(pares)) })
    return () => { activo = false }
  }, [])

  const lista = videos[canal] || []
  const info = CANALES.find(c => c.handle === canal)

  return (
    <div className="h2-videos">
      <div className="h2-videos__pestanas" role="tablist">
        {CANALES.map(c => (
          <button
            key={c.handle}
            type="button"
            role="tab"
            aria-selected={canal === c.handle}
            className={`h2-videos__pestana${canal === c.handle ? ' is-active' : ''}`}
            onClick={() => setCanal(c.handle)}
          >
            {c.nombre}
          </button>
        ))}
        <a className="h2-videos__canal" href={info.url} target="_blank" rel="noopener noreferrer">
          {info.descripcion} · Ver canal ↗
        </a>
      </div>

      <div className="h2-videos__carrusel">
        {lista.length === 0 && <p className="h2-videos__vacio">Cargando vídeos…</p>}
        {lista.map(v => (
          <button key={v.video_id} type="button" className="h2-video" onClick={() => setAbierto(v)}>
            <span className="h2-video__miniatura">
              <img src={`https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`} alt="" loading="lazy" />
              <span className="h2-video__play" aria-hidden="true">▶</span>
              {v.directo_activo && <span className="h2-video__directo">🔴 En directo</span>}
            </span>
            <span className="h2-video__titulo">{v.titulo}</span>
            <span className="h2-video__fecha">{haceCuanto(v.published_at)}</span>
          </button>
        ))}
      </div>

      {abierto && <Reproductor video={abierto} onCerrar={() => setAbierto(null)} />}
    </div>
  )
}
