import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import OpinionAficion from '../components/OpinionAficion'
import CampoAlineacion from '../components/CampoAlineacion'
import useAuth, { supabase } from '../hooks/useAuth'
import { calcularVentana } from '../hooks/usePartidos'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import { formations } from '../lib/formations'
import { cargarOpinionAficion } from '../lib/porraStats'
import {
  ESTADIO_ZARAGOZA, slugPartido, nombresPartido, competicionCorta, marcadorPartido, seoPartido, seoProximoPartido, resumenPartido, temporadaDe,
} from '../lib/partidoSeo'
import './Partido.css'

const FOTO_DEFECTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'
const fechaLarga = iso => new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })
const horaMadrid = iso => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
const fechaTile = f => new Date(`${f}T12:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
const sinComillas = n => (n || '').replace(/[""]/g, '').trim()

// Cuentas cuyo once guardado en Comunidad (Lineup Builder) antes de un
// partido se publica como "Once probable" en la Previa de ese partido.
const AUTORES_ONCE_PROBABLE = {
  '20cca270-3dfa-4a7c-8cab-918eeffa5940': 'RZ Hub',
  '8c70d58c-bf4f-446e-8bbc-b91461647dac': 'Alexinho',
}

async function cargarPartido(slug) {
  const { data: todos } = await supabase.from('porra_partidos').select('*').order('kickoff', { ascending: true })
  const lista = todos || []
  const idx = lista.findIndex(p => slugPartido(p) === slug)
  if (idx < 0) return null
  const p = lista[idx]
  const anterior = lista[idx - 1] || null
  const siguiente = lista[idx + 1] || null
  const jugado = new Date(p.kickoff) < new Date()

  const [{ data: rival }, { data: notasPartido }, { data: videos }, opinion] = await Promise.all([
    supabase.from('rivales').select('id, nombre, estadio, historia, fundacion').eq('nombre', p.rival).maybeSingle(),
    jugado ? supabase.from('partidos').select('*').eq('fecha', p.fecha).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('videos_canal')
      .select('video_id, titulo, canal_handle, canal_nombre, published_at')
      .in('canal_handle', ['alexinhorz', 'elrinconzaragocista'])
      .gte('published_at', anterior?.kickoff || '2000-01-01')
      .lte('published_at', siguiente?.kickoff || '2100-01-01')
      .order('published_at', { ascending: true }),
    cargarOpinionAficion(p.id),
  ])

  // Cara a cara: histórico manual (rivales_enfrentamientos) + partidos de
  // la porra ya cerrados que no estén en el manual.
  let historial = []
  if (rival) {
    const { data } = await supabase.from('rivales_enfrentamientos').select('fecha, competicion, sede, goles_zaragoza, goles_rival').eq('rival_id', rival.id)
    historial = data || []
  }
  const fechasManuales = new Set(historial.map(h => h.fecha))
  for (const q of lista) {
    if (q.finalizado && sinComillas(q.rival) === sinComillas(p.rival) && !fechasManuales.has(q.fecha) && q.goles_zaragoza != null) {
      historial.push({ fecha: q.fecha, competicion: q.competicion ? 'Copa del Rey' : 'Primera Federación', sede: q.sede, goles_zaragoza: q.goles_zaragoza, goles_rival: q.goles_rival })
    }
  }
  historial.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  // Notas medias de la afición.
  let medias = []
  if (notasPartido) {
    const { data: votos } = await supabase.from('notas').select('player_id, puntuacion').eq('partido_id', notasPartido.partido_id)
    const acc = new Map()
    for (const v of votos || []) {
      const a = acc.get(v.player_id) || { suma: 0, n: 0 }
      a.suma += Number(v.puntuacion); a.n++
      acc.set(v.player_id, a)
    }
    medias = [...acc.entries()].map(([id, a]) => ({ id, media: a.suma / a.n, votos: a.n })).sort((x, y) => y.media - x.media)
  }

  // Jugadores necesarios (once, cambios y notas) en una sola consulta.
  const al = p.alineacion
  const ids = new Set([...(al?.titulares || []), ...(al?.cambios || []).flatMap(c => [c.entra, c.sale]), ...medias.map(m => m.id)])
  const { data: jugadoresData } = ids.size
    ? await supabase.from('players').select('id, name, short_name, photo, position').in('id', [...ids])
    : { data: [] }
  const jugadores = new Map((jugadoresData || []).map(j => [j.id, j]))

  // Ganadores de la jornada en la porra.
  let ganadores = []
  if (p.finalizado) {
    const { data: preds } = await supabase.from('porra_predicciones')
      .select('user_id, puntos')
      .eq('partido_id', p.id).gt('puntos', 0)
      .order('puntos', { ascending: false }).limit(5)
    if (preds?.length) {
      const { data: perfiles } = await supabase.from('profiles').select('id, name, username').in('id', preds.map(x => x.user_id))
      const porId = new Map((perfiles || []).map(x => [x.id, x]))
      ganadores = preds.map(x => ({ ...x, perfil: porId.get(x.user_id) }))
    }
  }

  // Once probable: el último once guardado en Comunidad por RZ Hub o
  // Alexinho entre el saque del partido anterior y el de este.
  let consultaOnce = supabase.from('lineups').select('user_id, team_name, formation, slots, subs, created_at')
    .in('user_id', Object.keys(AUTORES_ONCE_PROBABLE))
    .lt('created_at', p.kickoff)
    .order('created_at', { ascending: false }).limit(1)
  if (anterior?.kickoff) consultaOnce = consultaOnce.gt('created_at', anterior.kickoff)
  const { data: oncesProbables } = await consultaOnce
  const onceProbable = oncesProbables?.[0] || null

  const previa = (videos || []).filter(v => v.canal_handle === 'elrinconzaragocista' && /previa/i.test(v.titulo) && v.published_at < p.kickoff).pop() || null
  const postPartido = (videos || []).find(v => v.canal_handle === 'alexinhorz' && v.published_at >= p.kickoff) || null
  const notas = notasPartido ? { partido: notasPartido, abierta: calcularVentana(notasPartido, null).abierta, medias } : null

  return { p, anterior, siguiente, rival, historial, notas, jugadores, ganadores, previa, postPartido, opinion, onceProbable }
}

/* ------------------------------ piezas ------------------------------ */

const nombreCorto = j => j?.short_name || j?.name || '—'

function Chip({ etiqueta, valor, icono }) {
  if (!valor) return null
  return (
    <span className="mc-chip">
      <span className="mc-chip__icono" aria-hidden="true">{icono}</span>
      <span>
        <span className="mc-chip__etiqueta">{etiqueta}</span>
        <span className="mc-chip__valor">{valor}</span>
      </span>
    </span>
  )
}

function VideoCard({ video, etiqueta }) {
  return (
    <a className="mc-video" href={`https://www.youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer">
      <img src={`https://i.ytimg.com/vi/${video.video_id}/mqdefault.jpg`} alt="" loading="lazy" />
      <span className="mc-video__texto">
        <span className="mc-video__etiqueta">{etiqueta} · {video.canal_nombre}</span>
        <span className="mc-video__titulo">{video.titulo}</span>
      </span>
    </a>
  )
}

function campoDesdeAlineacion(al, jugadores, notasPorId) {
  const huecos = formations[al.formacion] || []
  const salidas = new Map((al.cambios || []).map(c => [c.sale, c.minuto]))
  return Object.fromEntries(huecos.map((h, i) => {
    const id = al.titulares[i]
    const j = jugadores.get(id)
    return [h.id, { nombre: nombreCorto(j), foto: j?.photo, esZaragoza: true, href: `/jugador/${id}`, nota: notasPorId.get(id), salida: salidas.get(id) }]
  }))
}

// Once guardado en el Lineup Builder (lineups.slots/subs) → cartas del campo.
function campoDesdeLineup(lineup) {
  const aCarta = j => {
    const idDb = typeof j.id === 'string' && j.id.startsWith('db_') ? j.id.slice(3) : null
    return { nombre: j.shortName || j.name, foto: j.photo, esZaragoza: j.isZaragoza !== false, href: idDb ? `/jugador/${idDb}` : undefined }
  }
  return Object.fromEntries(Object.entries(lineup.slots || {}).filter(([, j]) => j).map(([hueco, j]) => [
    hueco,
    { ...aCarta(j), suplentes: (lineup.subs?.[hueco] || []).filter(Boolean).map(aCarta) },
  ]))
}

function FilaJugador({ id, jugadores, nota, extra }) {
  const j = jugadores.get(id)
  return (
    <Link to={`/jugador/${id}`} className="mc-fila">
      <img src={j?.photo || FOTO_DEFECTO} alt="" onError={e => { e.target.src = FOTO_DEFECTO }} />
      <span className="mc-fila__nombre">{j?.name || '—'}</span>
      {extra && <span className="mc-fila__extra">{extra}</span>}
      {nota != null && <span className="mc-fila__nota">{nota.toFixed(1)}</span>}
      <span className="mc-fila__chevron" aria-hidden="true">›</span>
    </Link>
  )
}

function TabOnce({ p, jugadores, notas }) {
  const al = p.alineacion
  const notasPorId = new Map((notas?.medias || []).map(m => [m.id, m.media]))
  if (!al?.titulares?.length) {
    return <p className="mc-vacio">{new Date(p.kickoff) < new Date() ? 'Todavía no hemos cargado la alineación de este partido.' : 'La alineación se publicará cuando se juegue el partido.'}</p>
  }
  const cambios = [...(al.cambios || [])].sort((a, b) => a.minuto - b.minuto)
  return (
    <div className="mc-once">
      <div className="mc-once__arriba">
        <CampoAlineacion formacion={al.formacion} titulo="Once inicial" jugadores={campoDesdeAlineacion(al, jugadores, notasPorId)} />
        <div className="mc-cambios">
          <h3 className="mc-subtitulo">Cambios</h3>
          {cambios.length === 0 && <p className="mc-vacio">Sin cambios.</p>}
          {cambios.map((c, i) => (
            <div key={i} className="mc-cambio">
              <span className="mc-cambio__min">{c.minuto}'</span>
              <span className="mc-cambio__nombres">
                <Link to={`/jugador/${c.entra}`} className="mc-cambio__entra">↑ {jugadores.get(c.entra)?.name || '—'}</Link>
                <span className="mc-cambio__sale">↓ {jugadores.get(c.sale)?.name || '—'}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mc-listas">
        <div>
          <h3 className="mc-subtitulo">Titulares</h3>
          {al.titulares.map(id => <FilaJugador key={id} id={id} jugadores={jugadores} nota={notasPorId.get(id)} />)}
        </div>
        {cambios.length > 0 && (
          <div>
            <h3 className="mc-subtitulo">Entraron desde el banquillo</h3>
            {cambios.map(c => <FilaJugador key={c.entra} id={c.entra} jugadores={jugadores} nota={notasPorId.get(c.entra)} extra={`${c.minuto}'`} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function OnceProbable({ lineup }) {
  const fecha = new Date(lineup.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })
  return (
    <section className="mc-probable">
      <div className="mc-probable__cabecera">
        <h3 className="mc-subtitulo">Once probable</h3>
        <span className="mc-probable__autor">Por {AUTORES_ONCE_PROBABLE[lineup.user_id]} · {fecha}</span>
      </div>
      <div className="mc-probable__campo">
        <CampoAlineacion formacion={lineup.formation} titulo={lineup.team_name} jugadores={campoDesdeLineup(lineup)} />
      </div>
      <Link to="/lineup" className="mc-boton">¿Tú cuál sacarías? Crea tu once →</Link>
    </section>
  )
}

function TabPrevia({ p, previa, porraAbierta, onceProbable }) {
  return (
    <div className="mc-tab-stack">
      {porraAbierta && (
        <Link to="/porra" className="mc-cta">
          <img className="mc-cta__camiseta" src="/images/porra-camiseta-recorte.webp" alt="Camiseta oficial del Real Zaragoza, premio de la Porra" width="56" height="56" />
          <span>
            <strong>Gana una camiseta oficial del Real Zaragoza.</strong> La porra de este partido está abierta: pronostica gratis, suma puntos y, si terminas 1.º la temporada, la camiseta es tuya.
          </span>
          <span className="mc-cta__pill">Pronosticar →</span>
        </Link>
      )}
      {onceProbable && <OnceProbable lineup={onceProbable} />}
      <OpinionAficion partido={p} titulo={p.finalizado ? 'Qué pronosticó la afición' : 'Pronóstico de la afición'} minimo={1} />
      {previa && (
        <div>
          <h3 className="mc-subtitulo">La previa</h3>
          <VideoCard video={previa} etiqueta="Previa" />
        </div>
      )}
    </div>
  )
}

function TabNotas({ notas, jugadores }) {
  if (!notas) return <p className="mc-vacio">Las notas de la afición se abren al terminar el partido.</p>
  return (
    <div className="mc-tab-stack">
      {notas.medias.length > 0 ? (
        <div>
          {notas.medias.map((m, i) => (
            <FilaJugador key={m.id} id={m.id} jugadores={jugadores} nota={m.media} extra={`${i + 1}.º · ${m.votos} votos`} />
          ))}
        </div>
      ) : (
        <p className="mc-vacio">Todavía nadie ha puntuado este partido.</p>
      )}
      <Link to={`/notas/${notas.partido.partido_id}`} className="mc-boton">
        {notas.abierta ? 'Pon tus notas a los jugadores →' : 'Ver las notas completas →'}
      </Link>
    </div>
  )
}

function TileEnfrentamiento({ h, rivalNombre, escudoRival }) {
  const local = h.sede === 'local'
  const signo = Math.sign(h.goles_zaragoza - h.goles_rival)
  const golesLocal = local ? h.goles_zaragoza : h.goles_rival
  const golesVisitante = local ? h.goles_rival : h.goles_zaragoza
  const escudoL = local ? ESCUDO_ZARAGOZA : escudoRival
  const escudoV = local ? escudoRival : ESCUDO_ZARAGOZA
  return (
    <div className={`mc-tile mc-tile--${signo > 0 ? 'v' : signo < 0 ? 'd' : 'e'}`} title={`${local ? 'Real Zaragoza' : rivalNombre} ${golesLocal}-${golesVisitante} ${local ? rivalNombre : 'Real Zaragoza'}`}>
      <span className="mc-tile__comp">{h.competicion}</span>
      <span className="mc-tile__marcador">
        {escudoL && <img src={escudoL} alt="" />}
        {golesLocal}-{golesVisitante}
        {escudoV && <img src={escudoV} alt="" />}
      </span>
      <span className="mc-tile__fecha">{fechaTile(h.fecha)}</span>
    </div>
  )
}

function TabRival({ p, rival, historial, escudoRival }) {
  const v = historial.filter(h => h.goles_zaragoza > h.goles_rival).length
  const e = historial.filter(h => h.goles_zaragoza === h.goles_rival).length
  const d = historial.filter(h => h.goles_zaragoza < h.goles_rival).length
  return (
    <div className="mc-tab-stack">
      <div className="mc-rival">
        {escudoRival && <img src={escudoRival} alt="" className="mc-rival__escudo" />}
        <div>
          <h2 className="mc-rival__nombre">{p.rival}</h2>
          {rival && (rival.fundacion || rival.estadio) && (
            <p className="mc-rival__datos">{[rival.fundacion && `Fundado en ${rival.fundacion}`, rival.estadio].filter(Boolean).join(' · ')}</p>
          )}
          {rival?.historia && <p className="mc-rival__historia">{rival.historia}</p>}
        </div>
      </div>

      <section>
        <h3 className="mc-subtitulo">Cara a cara</h3>
        {historial.length > 0 ? (
          <>
            <p className="mc-texto">
              {historial.length} {historial.length === 1 ? 'partido oficial' : 'partidos oficiales'}: {v} {v === 1 ? 'victoria' : 'victorias'} del Real Zaragoza, {e} {e === 1 ? 'empate' : 'empates'} y {d} {d === 1 ? 'derrota' : 'derrotas'}.
            </p>
            <div className="mc-tiles">
              {historial.slice(0, 5).map((h, i) => <TileEnfrentamiento key={i} h={h} rivalNombre={p.rival} escudoRival={escudoRival} />)}
            </div>
          </>
        ) : (
          <p className="mc-texto">No tenemos registrado ningún enfrentamiento oficial anterior.</p>
        )}
      </section>

      {rival && <Link to={`/rival/${rival.id}`} className="mc-boton">Ficha completa y plantilla del {p.rival} →</Link>}
    </div>
  )
}

function TuPronostico({ p, user, signInWithGoogle }) {
  const [pred, setPred] = useState({ clave: null, valor: undefined })
  const clave = user ? `${p.id}:${user.id}` : null

  useEffect(() => {
    if (!user) return
    let activo = true
    supabase.from('porra_predicciones').select('goles_zaragoza, goles_rival, goleadores, puntos')
      .eq('partido_id', p.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (activo) setPred({ clave: `${p.id}:${user.id}`, valor: data || null }) })
    return () => { activo = false }
  }, [p.id, user])

  const miPred = pred.clave === clave ? pred.valor : undefined
  const { zaragozaLocal } = nombresPartido(p)
  const enOrden = (z, r) => (zaragozaLocal ? `${z}-${r}` : `${r}-${z}`)
  const real = p.finalizado ? enOrden(p.goles_zaragoza, p.goles_rival) : null
  const empezado = new Date(p.kickoff) < new Date()

  return (
    <div className="mc-card">
      <div className="mc-card__cabecera">
        <span className="mc-card__titulo">Tu porra</span>
        <span className="mc-pill">{p.finalizado ? 'Finalizado' : empezado ? 'En juego' : p.abierto ? 'Abierta' : 'Próximamente'}</span>
      </div>
      {!user ? (
        <div className="mc-card__cuerpo">
          <p className="mc-card__texto">Inicia sesión para hacer tu pronóstico y luchar por la <strong>camiseta oficial del Real Zaragoza</strong>.</p>
          <button type="button" className="mc-boton mc-boton--bloque" onClick={signInWithGoogle}>Iniciar sesión</button>
        </div>
      ) : miPred === undefined ? (
        <p className="mc-card__texto">Cargando…</p>
      ) : !miPred ? (
        <div className="mc-card__cuerpo">
          <p className="mc-card__texto">{empezado ? 'No hiciste pronóstico en este partido.' : 'Aún no has hecho tu pronóstico.'}</p>
          {!empezado && p.abierto && <Link to="/porra" className="mc-boton mc-boton--bloque">Pronosticar →</Link>}
        </div>
      ) : (
        <div className="mc-card__cuerpo">
          <div className="mc-vs">
            <span><span className="mc-vs__etiqueta">Tu pronóstico</span><strong>{enOrden(miPred.goles_zaragoza, miPred.goles_rival)}</strong></span>
            <span className="mc-vs__sep">vs</span>
            <span><span className="mc-vs__etiqueta">Realidad</span><strong>{real || '—'}</strong></span>
          </div>
          {miPred.goleadores?.length > 0 && <p className="mc-card__texto">⚽ {miPred.goleadores.join(', ')}</p>}
          {p.finalizado && <p className="mc-card__puntos">Puntos obtenidos: <strong>+{miPred.puntos ?? 0}</strong></p>}
        </div>
      )}
    </div>
  )
}

function Ganadores({ ganadores }) {
  if (!ganadores.length) return null
  return (
    <div className="mc-card">
      <div className="mc-card__cabecera"><span className="mc-card__titulo">Ganadores de la jornada</span></div>
      <ol className="mc-ganadores">
        {ganadores.map(g => (
          <li key={g.user_id}>
            <span className="mc-ganadores__nombre">{g.perfil?.name || g.perfil?.username || 'Usuario'}</span>
            <span className="mc-ganadores__pts">{g.puntos} pts</span>
          </li>
        ))}
      </ol>
      <Link to="/porra" className="mc-card__enlace">Ver la clasificación de la porra →</Link>
    </div>
  )
}

function EnlacePartido({ p, sentido }) {
  if (!p) return <span />
  const { local, visitante } = nombresPartido(p)
  const marcador = p.finalizado ? marcadorPartido(p) : null
  return (
    <Link to={`/partido/${slugPartido(p)}`} className={`mc-nav__link mc-nav__link--${sentido}`}>
      <span className="mc-nav__sentido">{sentido === 'anterior' ? '← Partido anterior' : 'Siguiente partido →'}</span>
      <span className="mc-nav__nombre">{local} {marcador || '-'} {visitante}</span>
    </Link>
  )
}

/* ------------------------------ página ------------------------------ */

// En /proximo-partido se monta con `slugForzado` y `modoProximo`: mismo
// contenido, pero con su propio título, H1 y canonical.
export default function Partido({ slugForzado, modoProximo = false }) {
  const { slug: slugParam } = useParams()
  const slug = slugForzado || slugParam
  const { user, signInWithGoogle } = useAuth()
  // Guardado junto a su slug: al navegar a otro partido, los datos (y la
  // pestaña elegida) del anterior dejan de valer sin vaciarlos a mano.
  const [cargado, setCargado] = useState({ slug: null, datos: undefined })
  const [pestanaElegida, setPestanaElegida] = useState({ slug: null, id: null })
  const datos = cargado.slug === slug ? cargado.datos : undefined
  const escudoRival = useEscudo(datos?.p?.rival)

  useEffect(() => {
    let activo = true
    cargarPartido(slug).then(d => { if (activo) setCargado({ slug, datos: d }) })
    return () => { activo = false }
  }, [slug])

  if (datos === undefined) return <div className="partido-page"><p className="partido-page__estado">Cargando partido…</p></div>
  if (datos === null) {
    return (
      <div className="partido-page">
        <SEO title="Partido no encontrado | RZ Hub" description="No hemos encontrado este partido." noindex />
        <p className="partido-page__estado">No hemos encontrado este partido. <Link to="/calendario">Ver el calendario</Link></p>
      </div>
    )
  }

  const { p, anterior, siguiente, rival, historial, notas, jugadores, ganadores, previa, postPartido, opinion, onceProbable } = datos
  const { local, visitante, zaragozaLocal } = nombresPartido(p)
  const estadio = zaragozaLocal ? ESTADIO_ZARAGOZA : rival?.estadio
  const marcador = p.finalizado ? marcadorPartido(p) : null
  const empezado = new Date(p.kickoff) < new Date()
  const porraAbierta = p.abierto && !p.finalizado && !empezado
  const seo = modoProximo ? seoProximoPartido(p) : seoPartido(p)
  const ruta = modoProximo ? '/proximo-partido' : `/partido/${slug}`
  const url = `${SITE_URL}${ruta}`
  const escudoLocal = zaragozaLocal ? ESCUDO_ZARAGOZA : escudoRival
  const escudoVisitante = zaragozaLocal ? escudoRival : ESCUDO_ZARAGOZA

  const pestanas = [
    { id: 'once', label: 'Once', visible: empezado || !!p.alineacion },
    { id: 'previa', label: 'Previa', visible: true },
    { id: 'notas', label: 'Notas', visible: !!notas },
    { id: 'rival', label: 'El Rival', visible: true },
  ].filter(t => t.visible)
  const porDefecto = p.alineacion ? 'once' : notas ? 'notas' : 'previa'
  const pestana = pestanaElegida.slug === slug && pestanas.some(t => t.id === pestanaElegida.id) ? pestanaElegida.id : porDefecto

  return (
    <div className="partido-page">
      <SEO
        title={seo.title}
        description={seo.description}
        path={ruta}
        image={p.finalizado ? undefined : 'https://www.rzhub.es/images/porra-og.jpg'}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: `${local} - ${visitante}`,
            sport: 'Fútbol',
            startDate: p.kickoff,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            location: { '@type': 'Place', name: estadio || 'Por confirmar' },
            homeTeam: { '@type': 'SportsTeam', name: local },
            awayTeam: { '@type': 'SportsTeam', name: visitante },
            competitor: [{ '@type': 'SportsTeam', name: local }, { '@type': 'SportsTeam', name: visitante }],
            url,
            description: seo.description,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Calendario', item: `${SITE_URL}/calendario` },
              { '@type': 'ListItem', position: 3, name: modoProximo ? 'Próximo partido' : `${local} - ${visitante}`, item: url },
            ],
          },
        ]}
      />

      <div className="mc-contenedor">
        <Link to="/calendario" className="mc-atras">‹ Calendario</Link>

        <header className="mc-cabecera">
          <p className="mc-cabecera__comp">
            <span className="mc-cabecera__marca">Vestuario Blanquillo</span>
            <span>{competicionCorta(p)} · {temporadaDe(p).replace('-', '/')}</span>
          </p>
          <div className="mc-marcador">
            <div className="mc-equipo">
              {escudoLocal && <img src={escudoLocal} alt="" />}
              <span>{local}</span>
            </div>
            <div className="mc-marcador__centro">
              {marcador
                ? <span className="mc-marcador__goles">{marcador.replace('-', ' - ')}</span>
                : <span className="mc-marcador__vs">{horaMadrid(p.kickoff)}</span>}
              <span className="mc-pill mc-pill--claro">{p.finalizado ? 'Final' : empezado ? 'En juego' : 'Próximamente'}</span>
            </div>
            <div className="mc-equipo">
              {escudoVisitante && <img src={escudoVisitante} alt="" />}
              <span>{visitante}</span>
            </div>
          </div>
          {p.finalizado && p.goleadores?.length > 0 && <p className="mc-cabecera__goles">⚽ {p.goleadores.join(', ')}</p>}
          <div className="mc-chips">
            <Chip etiqueta="Fecha" valor={fechaLarga(p.kickoff)} icono="📅" />
            <Chip etiqueta="Hora" valor={horaMadrid(p.kickoff)} icono="🕘" />
            <Chip etiqueta="Estadio" valor={estadio} icono="🏟" />
            <Chip etiqueta="Árbitro" valor={p.arbitro} icono="🟨" />
            <Chip etiqueta="TV" valor={p.tv} icono="📺" />
          </div>
        </header>

        <nav className="mc-tabs" aria-label="Secciones del partido">
          {pestanas.map(t => (
            <button key={t.id} type="button" className={`mc-tab${pestana === t.id ? ' is-active' : ''}`} onClick={() => setPestanaElegida({ slug, id: t.id })}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mc-grid">
          <div className="mc-principal">
            {pestana === 'once' && <TabOnce p={p} jugadores={jugadores} notas={notas} />}
            {pestana === 'previa' && <TabPrevia p={p} previa={previa} porraAbierta={porraAbierta} onceProbable={onceProbable} />}
            {pestana === 'notas' && <TabNotas notas={notas} jugadores={jugadores} />}
            {pestana === 'rival' && <TabRival p={p} rival={rival} historial={historial} escudoRival={escudoRival} />}
          </div>

          <aside className="mc-lateral">
            <TuPronostico p={p} user={user} signInWithGoogle={signInWithGoogle} />
            <Ganadores ganadores={ganadores} />
            {postPartido && (
              <div>
                <h3 className="mc-subtitulo">El post partido</h3>
                <VideoCard video={postPartido} etiqueta="Post partido" />
              </div>
            )}
            {!postPartido && previa && pestana !== 'previa' && (
              <div>
                <h3 className="mc-subtitulo">La previa</h3>
                <VideoCard video={previa} etiqueta="Previa" />
              </div>
            )}
          </aside>
        </div>

        <section className="mc-pie">
          <h1 className="mc-pie__titulo">{modoProximo ? seo.h1 : marcador ? `${local} ${marcador} ${visitante}` : `${local} vs ${visitante}`}</h1>
          <p className="mc-pie__resumen">{resumenPartido(p, { estadio, opinion })}</p>
          <nav className="mc-nav" aria-label="Otros partidos">
            <EnlacePartido p={anterior} sentido="anterior" />
            <EnlacePartido p={siguiente} sentido="siguiente" />
          </nav>
        </section>
      </div>

      <Footer />
    </div>
  )
}
