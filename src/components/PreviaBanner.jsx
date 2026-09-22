import { useEffect, useState } from 'react'
import { supabase } from '../hooks/useAuth'
import './PreviaBanner.css'

const CANAL_HANDLE = 'elrinconzaragocista'
const CANAL_AVATAR = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/noticias-imagenes/canal-rincon-avatar.jpg'
const HORAS_ANTES_CIERRE = 3
const REFRESCO_MS = 60_000

// Aviso de la previa de El Rincón Zaragocista en la home — se muestra
// automáticamente desde que se publica un vídeo/directo con "previa"
// en el título (fetch-videos-canal, cada 15 min) hasta 3 horas antes
// del comienzo del partido al que corresponde (pedido expreso). El
// partido se identifica como el primero en porra_partidos cuya hora
// de inicio es posterior a la publicación del vídeo — así una previa
// vieja nunca se cuelga sola del siguiente partido de calendario.
async function cargarPrevia() {
  const { data: videos } = await supabase
    .from('videos_canal')
    .select('video_id, titulo, published_at, directo_activo')
    .eq('canal_handle', CANAL_HANDLE)
    .ilike('titulo', '%previa%')
    .order('published_at', { ascending: false })
    .limit(1)

  const video = videos?.[0]
  if (!video) return null

  const { data: partidos } = await supabase
    .from('porra_partidos')
    .select('kickoff, rival')
    .gt('kickoff', video.published_at)
    .order('kickoff', { ascending: true })
    .limit(1)

  const partido = partidos?.[0]
  if (!partido) return null

  return { ...video, kickoff: partido.kickoff, rival: partido.rival }
}

export default function PreviaBanner() {
  const [previa, setPrevia] = useState(null)

  useEffect(() => {
    let activo = true
    function refrescar() {
      cargarPrevia().then(p => { if (activo) setPrevia(p) })
    }
    refrescar()
    const id = setInterval(refrescar, REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [])

  if (!previa) return null

  const ahora = Date.now()
  const publicado = new Date(previa.published_at).getTime()
  const cierre = new Date(previa.kickoff).getTime() - HORAS_ANTES_CIERRE * 3600_000
  if (ahora < publicado || ahora >= cierre) return null

  const url = `https://www.youtube.com/watch?v=${previa.video_id}`

  return (
    <div className="previa-banner">
      <a href={url} target="_blank" rel="noopener noreferrer" className="previa-banner__item">
        <img src={CANAL_AVATAR} alt="" className="previa-banner__avatar" />
        <span className="previa-banner__text">
          <span className="previa-banner__full">
            <strong>El Rincón Zaragocista</strong> — {previa.titulo}
          </span>
          <span className="previa-banner__short">
            <strong>La previa</strong> vs {previa.rival}
          </span>
        </span>
        <span className={`previa-banner__pill${previa.directo_activo ? ' previa-banner__pill--directo' : ''}`}>
          {previa.directo_activo ? '🔴 En directo' : '▶ Ver previa'}
        </span>
      </a>
    </div>
  )
}
