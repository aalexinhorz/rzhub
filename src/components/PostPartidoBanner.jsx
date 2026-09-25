import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../hooks/useAuth'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './PostPartidoBanner.css'

const CANAL_HANDLE = 'alexinhorz'
const DIAS_VISIBLE = 7
const REFRESCO_MS = 60_000

// Aviso del post partido de Alexinho en la home — se muestra
// automáticamente en cuanto aparece su vídeo (fetch-videos-canal, cada
// 15 min) para el partido más reciente, sin buscar ninguna palabra
// clave en el título: ese canal solo sube vídeos de post partido, así
// que "el último vídeo suyo" ya identifica de qué partido se trata.
// El emparejamiento es al revés que en PreviaBanner: aquí se busca el
// partido más reciente cuya fecha sea ANTERIOR a la publicación del
// vídeo (el que ya se jugó), no el siguiente.
async function cargarPostPartido() {
  const { data: videos } = await supabase
    .from('videos_canal')
    .select('video_id, titulo, published_at')
    .eq('canal_handle', CANAL_HANDLE)
    .order('published_at', { ascending: false })
    .limit(1)

  const video = videos?.[0]
  if (!video) return null

  const { data: partidos } = await supabase
    .from('partidos')
    .select('partido_id, rival, fecha, local, goles_local, goles_visitante, votacion_cerrada')
    .lte('fecha', video.published_at)
    .order('fecha', { ascending: false })
    .limit(1)

  return { video, partido: partidos?.[0] || null }
}

export default function PostPartidoBanner() {
  const [datos, setDatos] = useState(null)
  const rivalCrest = useEscudo(datos?.partido?.rival)

  useEffect(() => {
    let activo = true
    function refrescar() {
      cargarPostPartido().then(d => { if (activo) setDatos(d) })
    }
    refrescar()
    const id = setInterval(refrescar, REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [])

  if (!datos) return null
  const { video, partido } = datos

  const publicado = new Date(video.published_at).getTime()
  const expira = publicado + DIAS_VISIBLE * 86400_000
  if (Date.now() >= expira) return null

  const videoUrl = `https://www.youtube.com/watch?v=${video.video_id}`
  const puedePuntuar = partido && !partido.votacion_cerrada

  const nombreLocal = partido ? (partido.local ? 'Real Zaragoza' : partido.rival) : null
  const nombreVisitante = partido ? (partido.local ? partido.rival : 'Real Zaragoza') : null
  const marcador = partido ? `${nombreLocal} ${partido.goles_local}-${partido.goles_visitante} ${nombreVisitante}` : null
  const marcadorCorto = marcador?.replace('Real Zaragoza', 'R. Zaragoza')

  const escudoLocal = partido?.local ? ESCUDO_ZARAGOZA : rivalCrest
  const escudoVisitante = partido?.local ? rivalCrest : ESCUDO_ZARAGOZA

  return (
    <div className="post-partido-banner">
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="post-partido-banner__item">
        {partido && (
          <span className="post-partido-banner__escudos">
            {escudoLocal && <img src={escudoLocal} alt="" />}
            <span className="post-partido-banner__vs">VS</span>
            {escudoVisitante && <img src={escudoVisitante} alt="" />}
          </span>
        )}
        <span className="post-partido-banner__text">
          <span className="post-partido-banner__full">
            <strong>Ya disponible</strong> el post partido{marcador ? `: ${marcador}` : ''}
          </span>
          <span className="post-partido-banner__short">
            <strong>Ya disponible:</strong> {marcadorCorto || 'post partido'}
          </span>
        </span>
        <span className="post-partido-banner__pill">▶ Ver en YouTube</span>
      </a>

      {puedePuntuar && (
        <>
          <span className="post-partido-banner__divider" aria-hidden="true" />
          <Link to={`/notas/${partido.partido_id}`} className="post-partido-banner__item">
            <span className="post-partido-banner__escudos">
              {escudoLocal && <img src={escudoLocal} alt="" />}
              <span className="post-partido-banner__vs">VS</span>
              {escudoVisitante && <img src={escudoVisitante} alt="" />}
            </span>
            <span className="post-partido-banner__text">
              <span className="post-partido-banner__full">
                <strong>Ya puedes poner tus notas</strong> del {nombreLocal}-{nombreVisitante}
              </span>
              <span className="post-partido-banner__short">
                <strong>Ya puedes votar:</strong> {nombreLocal?.replace('Real Zaragoza', 'R. Zaragoza')}-{nombreVisitante?.replace('Real Zaragoza', 'R. Zaragoza')}
              </span>
            </span>
            <span className="post-partido-banner__pill">Votar ahora →</span>
          </Link>
        </>
      )}
    </div>
  )
}
