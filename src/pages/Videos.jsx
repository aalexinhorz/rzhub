import { useState, useEffect } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import './Videos.css'

// Re-hosteados en nuestro Storage: los avatares de YouTube
// (yt3.ggpht.com) los bloquea Chrome por ORB (Opaque Response
// Blocking) si se enlazan directamente en un <img>, aunque respondan
// 200 por curl.
const CANALES = [
  {
    handle: 'alexinhorz',
    nombre: 'Alexinho',
    descripcion: 'Solo habla del Real Zaragoza. Canal colaborador de RZ Hub.',
    avatar: 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/noticias-imagenes/canal-alexinho-avatar.jpg',
  },
  {
    handle: 'elrinconzaragocista',
    nombre: 'El Rincón Zaragocista',
    descripcion: 'Actualidad, previas y análisis del Real Zaragoza. Canal colaborador de RZ Hub.',
    avatar: 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/noticias-imagenes/canal-rincon-avatar.jpg',
  },
]

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function esPrevia(titulo) {
  return /previa/i.test(titulo)
}

export default function Videos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('videos_canal')
      .select('video_id, canal_handle, canal_nombre, titulo, thumbnail_url, published_at, es_directo')
      .order('published_at', { ascending: false })
      .then(({ data }) => { setVideos(data || []); setLoading(false) })
  }, [])

  return (
    <div className="videos-page">
      <SEO
        title="Vídeos del Real Zaragoza | RZ Hub"
        description="Previas, crónicas, directos y análisis en vídeo de cada partido del Real Zaragoza, de los canales de Alexinho y El Rincón Zaragocista, en colaboración con RZ Hub."
        keywords="vídeos Real Zaragoza, Alexinho Real Zaragoza, El Rincón Zaragocista, análisis Real Zaragoza, previa Real Zaragoza, directo Real Zaragoza, youtube Real Zaragoza"
        path="/videos"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Vídeos del Real Zaragoza',
          description: 'Vídeos sobre el Real Zaragoza de los canales de Alexinho y El Rincón Zaragocista, en colaboración con RZ Hub.',
          url: `${SITE_URL}/videos`,
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="videos-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow videos-page__eyebrow">Real Zaragoza · Contenido en vídeo</p>
        <h1 className="videos-page__title">Vídeos</h1>
        <p className="videos-page__subtitle">Previas, crónicas, directos y análisis de cada partido, con nuestros canales colaboradores.</p>
      </div>

      <div className="videos-page__body">
        <div className="videos-page__container">
          <div className="videos-canales">
            {CANALES.map(c => (
              <a key={c.handle} href={`https://www.youtube.com/@${c.handle}`} target="_blank" rel="noopener noreferrer" className="videos-canal-card">
                <img src={c.avatar} alt="" className="videos-canal-card__avatar" />
                <div className="videos-canal-card__info">
                  <span className="videos-canal-card__nombre">{c.nombre}</span>
                  <span className="videos-canal-card__desc">{c.descripcion}</span>
                </div>
                <span className="videos-canal-card__cta">Suscríbete →</span>
              </a>
            ))}
          </div>

          {loading ? (
            <p className="videos-page__state">Cargando vídeos…</p>
          ) : videos.length === 0 ? (
            <p className="videos-page__state">Todavía no hay vídeos disponibles.</p>
          ) : (
            <div className="videos-grid">
              {videos.map(v => (
                <a
                  key={v.video_id}
                  href={`https://www.youtube.com/watch?v=${v.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="videos-card"
                >
                  <div className="videos-card__thumb">
                    <img src={v.thumbnail_url} alt="" loading="lazy" />
                    <span className="videos-card__play" aria-hidden="true">▶</span>
                    {v.es_directo
                      ? <span className="videos-card__badge videos-card__badge--directo">Directo</span>
                      : esPrevia(v.titulo) && <span className="videos-card__badge">Previa</span>}
                  </div>
                  <span className="videos-card__titulo">{v.titulo}</span>
                  <span className="videos-card__meta">
                    <span className="videos-card__canal">{v.canal_nombre}</span>
                    <span>· {formatFecha(v.published_at)}</span>
                  </span>
                </a>
              ))}
            </div>
          )}

          <p className="videos-nota-final">
            Vídeos de los canales de YouTube de Alexinho (@alexinhorz) y El Rincón Zaragocista (@elrinconzaragocista), colaboradores de RZ Hub. Al pinchar en cualquier vídeo se abre directamente en YouTube.
          </p>
        </div>

        <Footer />
      </div>
    </div>
  )
}
