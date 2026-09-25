import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './Rival.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

function formatFecha(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function grupoPosicion(posicion) {
  const p = (posicion || '').toLowerCase()
  if (p.startsWith('portero')) return 'POR'
  if (p.startsWith('defensa') || p.startsWith('lateral')) return 'DEF'
  if (p.startsWith('mediocentro') || p.startsWith('centrocamp')) return 'MED'
  if (p.startsWith('extremo') || p.startsWith('delantero')) return 'DEL'
  return 'MED'
}

const ORDEN_GRUPO = { POR: 0, DEF: 1, MED: 2, DEL: 3 }
function porPosicion(a, b) {
  const diff = ORDEN_GRUPO[grupoPosicion(a.posicion)] - ORDEN_GRUPO[grupoPosicion(b.posicion)]
  return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre)
}

function FichaEnfrentamiento({ e, rivalNombre, rivalEscudo }) {
  const local = e.sede === 'local'
  const nombreLocal = local ? 'Real Zaragoza' : rivalNombre
  const nombreVisitante = local ? rivalNombre : 'Real Zaragoza'
  const golesLocal = local ? e.goles_zaragoza : e.goles_rival
  const golesVisitante = local ? e.goles_rival : e.goles_zaragoza
  const escudoLocal = local ? ESCUDO_ZARAGOZA : rivalEscudo
  const escudoVisitante = local ? rivalEscudo : ESCUDO_ZARAGOZA

  return (
    <div className="rival-h2h__card">
      <span className="rival-h2h__meta">{e.competicion} · {e.jornada}</span>
      <div className="rival-h2h__marcador">
        <span className="rival-h2h__equipo">
          {escudoLocal && <img src={escudoLocal} alt="" />}
          <span>{nombreLocal}</span>
        </span>
        <span className="rival-h2h__resultado">{golesLocal} - {golesVisitante}</span>
        <span className="rival-h2h__equipo rival-h2h__equipo--visitante">
          <span>{nombreVisitante}</span>
          {escudoVisitante && <img src={escudoVisitante} alt="" />}
        </span>
      </div>
      <span className="rival-h2h__fecha">{formatFecha(e.fecha)}</span>
      {(e.goleadores_zaragoza || e.goleadores_rival) && (
        <span className="rival-h2h__goleadores">
          {e.goleadores_zaragoza && <>⚽ RZ: {e.goleadores_zaragoza}</>}
          {e.goleadores_zaragoza && e.goleadores_rival && <br />}
          {e.goleadores_rival && <>⚽ {rivalNombre}: {e.goleadores_rival}</>}
        </span>
      )}
    </div>
  )
}

export default function Rival() {
  const { slug } = useParams()
  const [rival, setRival] = useState(null)
  const [plantilla, setPlantilla] = useState([])
  const [enfrentamientos, setEnfrentamientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODAS')
  const [verTodosH2H, setVerTodosH2H] = useState(false)
  const escudoLocal = useEscudo(rival?.nombre)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('rivales').select('*').eq('id', slug).maybeSingle(),
      supabase.from('rivales_plantilla').select('*').eq('rival_id', slug).order('nombre'),
      supabase.from('rivales_enfrentamientos').select('*').eq('rival_id', slug).order('fecha', { ascending: false }),
    ]).then(([{ data: rivalData }, { data: plantillaData }, { data: enfrentamientosData }]) => {
      setRival(rivalData || null)
      setPlantilla(plantillaData || [])
      setEnfrentamientos(enfrentamientosData || [])
      setLoading(false)
    })
  }, [slug])

  if (loading) return <div className="rival-page"><p className="rival-page__state">Cargando…</p></div>
  if (!rival) {
    return (
      <div className="rival-page">
        <p className="rival-page__state">No hay ficha para este rival todavía.</p>
      </div>
    )
  }

  const filas = plantilla
    .filter(p => filtro === 'TODAS' || grupoPosicion(p.posicion) === filtro)
    .sort(porPosicion)
  const enfrentamientosVisibles = verTodosH2H ? enfrentamientos : enfrentamientos.slice(0, 5)
  const victoriasZaragoza = enfrentamientos.filter(e => e.goles_zaragoza > e.goles_rival).length
  const empates = enfrentamientos.filter(e => e.goles_zaragoza === e.goles_rival).length
  const derrotasZaragoza = enfrentamientos.filter(e => e.goles_zaragoza < e.goles_rival).length

  return (
    <div className="rival-page">
      <SEO
        title={`${rival.nombre} | Ficha del rival | RZ Hub`}
        description={`Historia, plantilla completa y enfrentamientos del Real Zaragoza contra el ${rival.nombre}.`}
        path={`/rival/${slug}`}
      />

      <div className="rival-page__body">
        <div className="rival-page__container">
          <Link to="/calendario" className="rival-back">← Volver al calendario</Link>

          <div className="rival-header">
            {escudoLocal && <img src={escudoLocal} alt="" className="rival-header__escudo" />}
            <div>
              <h1 className="rival-header__nombre">{rival.nombre}</h1>
              {(rival.estadio || rival.fundacion) && (
                <p className="rival-header__datos">
                  {rival.fundacion && <>Fundado en {rival.fundacion}</>}
                  {rival.fundacion && rival.estadio && ' · '}
                  {rival.estadio}
                </p>
              )}
            </div>
          </div>

          {rival.historia && <p className="rival-historia">{rival.historia}</p>}

          {enfrentamientos.length > 0 && (
            <section className="rival-section">
              <h2 className="rival-section__titulo">Cara a cara</h2>
              <p className="rival-section__resumen">
                {enfrentamientos.length} enfrentamientos — {victoriasZaragoza} victorias del Real Zaragoza, {empates} empates, {derrotasZaragoza} victorias del {rival.nombre}
              </p>
              <div className="rival-h2h">
                {enfrentamientosVisibles.map(e => (
                  <FichaEnfrentamiento key={e.id} e={e} rivalNombre={rival.nombre} rivalEscudo={escudoLocal} />
                ))}
              </div>
              {enfrentamientos.length > 5 && (
                <button className="rival-h2h__toggle" onClick={() => setVerTodosH2H(v => !v)}>
                  {verTodosH2H ? 'Ver solo los últimos 5' : `Ver todos (${enfrentamientos.length})`}
                </button>
              )}
            </section>
          )}

          <section className="rival-section">
            <h2 className="rival-section__titulo">Plantilla completa</h2>
            <div className="rival-plantilla__filtros">
              {['TODAS', 'POR', 'DEF', 'MED', 'DEL'].map(g => (
                <button key={g} className={`rival-filtro${filtro === g ? ' rival-filtro--activo' : ''}`} onClick={() => setFiltro(g)}>{g}</button>
              ))}
            </div>
            <div className="rival-plantilla__grid">
              {filas.map(p => (
                <div key={p.id} className="rival-jugador">
                  <div className="rival-jugador__card">
                    <div className="rival-jugador__foto">
                      <img src={p.foto_url || DEFAULT_PHOTO} alt="" onError={e => { e.target.src = DEFAULT_PHOTO }} />
                      <span className="rival-jugador__grupo">{grupoPosicion(p.posicion)}</span>
                    </div>
                    <div className="rival-jugador__namebar">
                      <span>{p.nombre}</span>
                    </div>
                  </div>
                  <span className="rival-jugador__posicion">{p.posicion}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}
