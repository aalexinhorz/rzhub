import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../hooks/useAuth'
import { useEscudo } from '../lib/escudos'
import './PreviaBanner.css'

const CANAL_HANDLE = 'elrinconzaragocista'
const CANAL_AVATAR = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/noticias-imagenes/canal-rincon-avatar.jpg'
const HORAS_ANTES_CIERRE = 3
const REFRESCO_MS = 60_000

// La previa de El Rincón Zaragocista se busca entre el saque inicial del
// partido anterior y el del próximo: una previa vieja nunca se cuelga sola
// del siguiente partido de calendario. Se oculta 3 horas antes del inicio
// (pedido expreso).
async function cargarPrevia(proximo, desde) {
  let query = supabase
    .from('videos_canal')
    .select('video_id, titulo, published_at, directo_activo')
    .eq('canal_handle', CANAL_HANDLE)
    .ilike('titulo', '%previa%')
    .lt('published_at', proximo.kickoff)
    .order('published_at', { ascending: false })
    .limit(1)
  if (desde) query = query.gt('published_at', desde)
  const { data } = await query
  return data?.[0] || null
}

export default function PreviaBanner({ proximo, desde, slugRival }) {
  const [previa, setPrevia] = useState(null)
  const rivalCrest = useEscudo(proximo.rival)

  useEffect(() => {
    let activo = true
    function refrescar() {
      cargarPrevia(proximo, desde).then(p => { if (activo) setPrevia(p) })
    }
    refrescar()
    const id = setInterval(refrescar, REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [proximo, desde])

  const cierrePrevia = new Date(proximo.kickoff).getTime() - HORAS_ANTES_CIERRE * 3600_000
  const previaVisible = previa && Date.now() < cierrePrevia
  if (!previaVisible && !slugRival) return null

  return (
    <div className="previa-banner">
      {previaVisible && (
        <a href={`https://www.youtube.com/watch?v=${previa.video_id}`} target="_blank" rel="noopener noreferrer" className="previa-banner__item">
          <img src={CANAL_AVATAR} alt="" className="previa-banner__avatar" />
          <span className="previa-banner__text">
            <span className="previa-banner__full">
              <strong>El Rincón Zaragocista</strong> — {previa.titulo}
            </span>
            <span className="previa-banner__short">
              <strong>La previa</strong> vs {proximo.rival}
            </span>
          </span>
          <span className={`previa-banner__pill${previa.directo_activo ? ' previa-banner__pill--directo' : ''}`}>
            {previa.directo_activo ? '🔴 En directo' : '▶ Ver previa'}
          </span>
        </a>
      )}

      {previaVisible && slugRival && <span className="previa-banner__divider" aria-hidden="true" />}

      {slugRival && (
        <Link to={`/rival/${slugRival}`} className="previa-banner__item">
          {rivalCrest && <img src={rivalCrest} alt="" className="previa-banner__escudo" />}
          <span className="previa-banner__text">
            <strong>Conoce al rival:</strong> {proximo.rival}
          </span>
          <span className="previa-banner__pill">Ver ficha →</span>
        </Link>
      )}
    </div>
  )
}
