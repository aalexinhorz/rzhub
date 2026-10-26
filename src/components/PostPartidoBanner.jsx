import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../hooks/useAuth'
import { calcularVentana } from '../hooks/usePartidos'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './PostPartidoBanner.css'

const CANAL_HANDLE = 'alexinhorz'
const DIAS_VISIBLE = 4
const REFRESCO_MS = 60_000

// `ultimo` es el último partido ya jugado (porra_partidos). El vídeo solo
// cuenta si Alexinho lo subió después de ese saque inicial: así nunca se
// cuela el post partido del encuentro anterior mientras se espera el nuevo.
async function cargarPostPartido(ultimo) {
  const [{ data: videos }, { data: notas }] = await Promise.all([
    supabase
      .from('videos_canal')
      .select('video_id, published_at')
      .eq('canal_handle', CANAL_HANDLE)
      .eq('oculto_home', false)
      .gte('published_at', ultimo.kickoff)
      .order('published_at', { ascending: false })
      .limit(1),
    supabase
      .from('partidos')
      .select('partido_id, fecha, created_at, local, goles_local, goles_visitante, votacion_cerrada')
      .eq('fecha', ultimo.fecha)
      .maybeSingle(),
  ])
  return { video: videos?.[0] || null, notas: notas || null }
}

export default function PostPartidoBanner({ ultimo }) {
  const [datos, setDatos] = useState(null)
  const rivalCrest = useEscudo(ultimo.rival)

  useEffect(() => {
    let activo = true
    function refrescar() {
      cargarPostPartido(ultimo).then(d => { if (activo) setDatos(d) })
    }
    refrescar()
    const id = setInterval(refrescar, REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [ultimo])

  if (!datos) return null
  const { video, notas } = datos

  const videoVisible = video && Date.now() < new Date(video.published_at).getTime() + DIAS_VISIBLE * 86400_000
  const notasAbiertas = notas && calcularVentana(notas, null).abierta
  if (!videoVisible && !notasAbiertas) return null

  const local = ultimo.sede === 'local'
  const nombreLocal = local ? 'Real Zaragoza' : ultimo.rival
  const nombreVisitante = local ? ultimo.rival : 'Real Zaragoza'
  const golesLocal = notas ? notas.goles_local : (local ? ultimo.goles_zaragoza : ultimo.goles_rival)
  const golesVisitante = notas ? notas.goles_visitante : (local ? ultimo.goles_rival : ultimo.goles_zaragoza)
  const hayMarcador = golesLocal != null && golesVisitante != null
  const marcador = hayMarcador ? `${nombreLocal} ${golesLocal}-${golesVisitante} ${nombreVisitante}` : null
  const corto = n => n.replace('Real Zaragoza', 'R. Zaragoza')

  const escudoLocal = local ? ESCUDO_ZARAGOZA : rivalCrest
  const escudoVisitante = local ? rivalCrest : ESCUDO_ZARAGOZA
  const escudos = (
    <span className="post-partido-banner__escudos">
      {escudoLocal && <img src={escudoLocal} alt="" />}
      <span className="post-partido-banner__vs">VS</span>
      {escudoVisitante && <img src={escudoVisitante} alt="" />}
    </span>
  )

  return (
    <div className="post-partido-banner">
      {videoVisible && (
        <a href={`https://www.youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer" className="post-partido-banner__item">
          {escudos}
          <span className="post-partido-banner__text">
            <span className="post-partido-banner__full">
              <strong>Ya disponible</strong> el post partido{marcador ? `: ${marcador}` : ''}
            </span>
            <span className="post-partido-banner__short">
              <strong>Ya disponible:</strong> {marcador ? corto(marcador) : 'post partido'}
            </span>
          </span>
          <span className="post-partido-banner__pill">▶ Ver en YouTube</span>
        </a>
      )}

      {videoVisible && notasAbiertas && <span className="post-partido-banner__divider" aria-hidden="true" />}

      {notasAbiertas && (
        <Link to={`/notas/${notas.partido_id}`} className="post-partido-banner__item">
          {escudos}
          <span className="post-partido-banner__text">
            <span className="post-partido-banner__full">
              <strong>Ya puedes poner tus notas</strong> del {nombreLocal}-{nombreVisitante}
            </span>
            <span className="post-partido-banner__short">
              <strong>Ya puedes votar:</strong> {corto(nombreLocal)}-{corto(nombreVisitante)}
            </span>
          </span>
          <span className="post-partido-banner__pill">Votar ahora →</span>
        </Link>
      )}
    </div>
  )
}
