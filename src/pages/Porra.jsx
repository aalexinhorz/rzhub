import { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import SEO, { SITE_URL } from '../components/SEO'
import { supabase } from '../hooks/useAuth'
import useAuth from '../hooks/useAuth'
import Footer from '../components/Footer'
import './Porra.css'

const ESCUDOS = {
  'Gimnàstic de Tarragona': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Antequera CF': '/escudos/spain_antequera.football-logos.cc.svg',
  'Juventud de Torremolinos CF': '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'FC Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'UD Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'CD Teruel': '/escudos/CD_Teruel_logo.svg',
  'Atlético Madrileño': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Real Murcia CF': '/escudos/Real_Murcia_CF_logo.svg',
  'CE Europa': '/escudos/Club_Esportiu_Europa.svg',
  'Villarreal CF B': '/escudos/Villarreal_CF_logo-en.svg',
  'SD Huesca': '/escudos/Logo_of_SD_Huesca.svg',
  'Real Jaén CF': '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'CF Rayo Majadahonda': '/escudos/Rayo_Majadahonda_(logo).svg',
  'AD Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Águilas FC': '/escudos/logo.svg',
  'Real Madrid Castilla': '/escudos/Real_Madrid_CF.svg',
  'Hércules de Alicante CF': '/escudos/Hercules_CF_crest.svg',
  'Algeciras CF': '/escudos/spain_algeciras.football-logos.cc.svg',
  'UE Sant Andreu': '/escudos/ue-sant-andreu-vector-logo.png',
}

const ESCUDO_ZARAGOZA = '/escudos/Real_Zaragoza_logo (3).svg'
const HORA_PLACEHOLDER = '18:30'
// Debe coincidir con el min-height de .porra-ranking__row en desktop
// (Porra.css) — se usa para calcular cuántas filas completas caben en el
// espacio que el panel lateral gana al igualar la altura de la tarjeta.
const RANKING_ROW_HEIGHT = 50

// "Dom. 27 septiembre" — si la hora del kickoff está a medianoche UTC es
// que aún no se ha fijado de verdad (mismo criterio que CalendarSection),
// así que mostramos la hora placeholder en vez de un "00:00" engañoso.
function formatFechaHora(kickoff) {
  const d = new Date(kickoff)
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  const diaCap = dia.charAt(0).toUpperCase() + dia.slice(1)
  const fecha = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  const horaConocida = !(d.getUTCHours() === 0 && d.getUTCMinutes() === 0)
  const hora = horaConocida ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : HORA_PLACEHOLDER
  return `${diaCap}. ${fecha} · ${hora} h`
}

function haEmpezado(kickoff) {
  return new Date() >= new Date(kickoff)
}

function isCerrada(partido) {
  return !partido.abierto || haEmpezado(partido.kickoff)
}

function getPartidoActivo(partidos) {
  const abierto = partidos.find(p => p.abierto)
  if (abierto) return abierto
  const ahora = new Date()
  const proximos = partidos.filter(p => new Date(p.kickoff) > ahora)
  if (proximos.length > 0) return proximos[0]
  const pasados = [...partidos].reverse()
  return pasados[0] || null
}

const inicialesDe = nombre => (nombre || 'U').trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

// Iconos SVG (misma familia que el resto de la interfaz: trazo simple,
// currentColor para heredar el color del texto/botón, incluido en hover)
// que sustituyen a la flecha diagonal "↗" en mobile — ahí una flecha de
// texto queda desproporcionada; un icono vectorial encaja mejor.
function IconHelpCircle({ className }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 0 1 5.4.9c0 1.9-2.8 1.9-2.8 3.6" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IconChevronRight({ className }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}
// Glifo genérico de cámara-en-marco-redondeado (el mismo lenguaje visual
// simplificado que el resto de iconos de Porra), no el logo de marca
// exacto de Instagram, igual que "𝕏" tampoco es el logotipo oficial de X.
function IconInstagram({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
// "−"/"+" como trazo SVG en vez de carácter de texto: en la tarjeta de
// exportación (ver PorraExportCard), html2canvas centra estos glifos de
// texto según sus propias métricas de fuente, que no coinciden con las
// del navegador y los deja desplazados hacia abajo. Un trazo geométrico
// no depende de esa métrica y queda centrado de verdad en su caja.
function IconMinus({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function IconPlus({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// Tarjetas de jornada — extraídas para que la lista de la página y la
// modal de "Ver todo" (jornadas) rendericen exactamente el mismo diseño
// y los mismos datos, en vez de mantener dos copias del markup.
function JornadaFinalCard({ p, pred }) {
  const esLocalP = p.sede === 'local'
  const final = esLocalP ? [p.goles_zaragoza, p.goles_rival] : [p.goles_rival, p.goles_zaragoza]
  const prono = pred ? (esLocalP ? [pred.goles_zaragoza, pred.goles_rival] : [pred.goles_rival, pred.goles_zaragoza]) : null
  const escudoRivalP = ESCUDOS[p.rival]
  return (
    <div className="porra-jornada-card">
      <div className="porra-jornada-card__top">
        <span className="porra-jornada-card__meta">J{p.jornada} · {p.rival}</span>
        <span className="porra-badge porra-badge--closed">Final</span>
      </div>
      <div className="porra-jornada-card__score">
        <img className="porra-jornada-card__crest" src={esLocalP ? ESCUDO_ZARAGOZA : (escudoRivalP || ESCUDO_ZARAGOZA)} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
        <span className="porra-jornada-card__result">{final[0]} - {final[1]}</span>
        <img className="porra-jornada-card__crest" src={esLocalP ? (escudoRivalP || ESCUDO_ZARAGOZA) : ESCUDO_ZARAGOZA} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
      </div>
      <div className="porra-jornada-card__divider" />
      <div className="porra-jornada-card__bottom">
        <div>
          <div className="porra-jornada-card__label">Tu pronóstico</div>
          <div className="porra-jornada-card__value">{prono ? `${prono[0]} - ${prono[1]}` : '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="porra-jornada-card__label">Puntos</div>
          <div className={`porra-jornada-card__value${pred?.puntos > 0 ? ' porra-jornada-card__value--pts' : ''}`}>
            {pred?.puntos > 0 ? `+${pred.puntos} pts` : '0 pts'}
          </div>
        </div>
      </div>
    </div>
  )
}

function JornadaProximaCard({ p }) {
  const esLocalP = p.sede === 'local'
  const escudoRivalP = ESCUDOS[p.rival]
  const abiertaP = p.abierto && !haEmpezado(p.kickoff)
  return (
    <div className="porra-jornada-card">
      <div className="porra-jornada-card__top">
        <span className="porra-jornada-card__meta">J{p.jornada} · {p.rival}</span>
        <span className={`porra-badge ${abiertaP ? 'porra-badge--open' : 'porra-badge--closed'}`}>
          {abiertaP ? 'Abierta' : 'Próximamente'}
        </span>
      </div>
      <div className="porra-jornada-card__score">
        <img className="porra-jornada-card__crest" src={esLocalP ? ESCUDO_ZARAGOZA : (escudoRivalP || ESCUDO_ZARAGOZA)} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
        <span className="porra-jornada-card__result">VS</span>
        <img className="porra-jornada-card__crest" src={esLocalP ? (escudoRivalP || ESCUDO_ZARAGOZA) : ESCUDO_ZARAGOZA} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
      </div>
      <div className="porra-jornada-card__divider" />
      <div className="porra-jornada-card__bottom">
        <div>
          <div className="porra-jornada-card__label">Fecha</div>
          <div className="porra-jornada-card__value">{new Date(p.kickoff).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="porra-jornada-card__label">Estadio</div>
          <div className="porra-jornada-card__value">{esLocalP ? 'Ibercaja Estadio' : 'Fuera de casa'}</div>
        </div>
      </div>
    </div>
  )
}

// Rasteriza una imagen (escudo o avatar) a PNG dibujándola con drawImage
// nativo del navegador, en su propio <canvas>. Dos motivos para no
// pasarle la URL original a html2canvas tal cual:
//  - Escudos: html2canvas reimplementa su propio parseo de SVG y
//    renderiza mal algunos de los nuestros (comprobado con uno cuyo
//    viewBox no empieza en 0,0 — sale como una mancha negra). El
//    drawImage real del navegador siempre los pinta bien.
//  - Avatares: son URLs externas (Google/Supabase). Activar `useCORS`
//    en html2canvas no basta si el servidor de origen no manda
//    Access-Control-Allow-Origin — el canvas queda "contaminado" y
//    toDataURL/toBlob lanzan. Aquí se intenta de verdad y, si falla
//    (red o CORS real), se devuelve null para que el llamante recurra
//    a un fallback (iniciales), en vez de dejar un hueco o una imagen
//    rota en la exportación.
function intentarRasterizarImagen(url, size) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        // "Contain", no "estirar": dibujar con drawImage(img, 0, 0, size,
        // size) fuerza el ancho y el alto al mismo valor, deformando
        // cualquier escudo que no sea cuadrado (el del Real Zaragoza es
        // más alto que ancho: 125.65 x 213.79 en el SVG original — de ahí
        // que saliera ensanchado). Se escala conservando su proporción
        // real y se centra en el lienzo cuadrado.
        const w = img.naturalWidth || size
        const h = img.naturalHeight || size
        const scale = Math.min(size / w, size / h)
        const dw = w * scale
        const dh = h * scale
        const dx = (size - dw) / 2
        const dy = (size - dh) / 2
        canvas.getContext('2d').drawImage(img, dx, dy, dw, dh)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null) // canvas contaminado: el origen no permite CORS de verdad
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// Tarjeta de exportación: NO es un clon del DOM en vivo, es una
// composición dedicada que se monta fuera de pantalla solo para
// capturarla. Reutiliza las mismas clases que la tarjeta real (mismos
// colores/tipografía/posiciones, "no una segunda card con identidad
// visual distinta"), pero:
//  - Sin <input>: el marcador y los goleadores son texto estático, leído
//    del estado actual (no del DOM).
//  - Sin recorte de nombres: .porra-export-card desactiva el
//    -webkit-line-clamp de los nombres de equipo (ver Porra.css).
//  - Fondo autocontenido: no depende de .porra-atmosphere (un ancestro
//    que quedaría fuera de esta captura aislada); trae su propia foto +
//    degradado en una sola capa (.porra-export-card en Porra.css).
//  - Altura libre: sin alto fijo, se adapta al contenido real.
function PorraExportCard({
  width, jornada, badgeAbierta, badgeTexto, fecha, venue,
  nombreLocal, nombreVisitante, crestLocalSrc, crestVisitanteSrc, inicialLocal, inicialVisitante,
  cerrada, marcadorLocal, marcadorVisitante, mostrarGoleadores, goleadoresTexto,
  ctaTexto, ctaGuardado, bloqueado, avatares, participantesTexto,
}) {
  return (
    <div className="porra-match-card porra-export-card" style={{ width: `${width}px`, height: 'auto' }}>
      <div className="porra-match-card__top">
        <div className="porra-match-card__comp">
          Primera Federación · Jornada {jornada}
          <span className={`porra-badge ${badgeAbierta ? 'porra-badge--open' : 'porra-badge--closed'}`}><span className="porra-badge__text">{badgeTexto}</span></span>
        </div>
        <div className="porra-match-card__when">
          <div className="porra-match-card__date">{fecha}</div>
          <div className="porra-match-card__venue">{venue}</div>
        </div>
      </div>

      <div className="porra-teams">
        <div className="porra-team__crest-box porra-team--left">
          {crestLocalSrc ? <img className="porra-team__crest" src={crestLocalSrc} alt="" /> : <span className="porra-team__crest-fallback">{inicialLocal}</span>}
        </div>
        <span className="porra-teams__sep">–</span>
        <div className="porra-team__crest-box porra-team--right">
          {crestVisitanteSrc ? <img className="porra-team__crest" src={crestVisitanteSrc} alt="" /> : <span className="porra-team__crest-fallback">{inicialVisitante}</span>}
        </div>

        <span className="porra-team__name porra-team--left">{nombreLocal}</span>
        <span className="porra-team__name porra-team--right">{nombreVisitante}</span>

        {!cerrada && (
          <>
            <div className="porra-team__selector porra-team--left">
              <span className="porra-stepper-btn"><IconMinus /></span>
              <span className="porra-score-value"><span className="porra-score-value__text">{marcadorLocal}</span></span>
              <span className="porra-stepper-btn"><IconPlus /></span>
            </div>
            <div className="porra-team__selector porra-team--right">
              <span className="porra-stepper-btn"><IconMinus /></span>
              <span className="porra-score-value"><span className="porra-score-value__text">{marcadorVisitante}</span></span>
              <span className="porra-stepper-btn"><IconPlus /></span>
            </div>
          </>
        )}
      </div>

      {!cerrada ? (
        <>
          <p className="porra-tu-pronostico-label">Tu pronóstico</p>
          {mostrarGoleadores && (
            <>
              <div className="porra-goleadores">
                <span className="porra-goleadores__label"><span className="porra-export-goleadores-label">Goleadores</span></span>
                <span className="porra-goleadores__pts">+3 pts · Opcional</span>
              </div>
              <div className="porra-goleadores-input"><span className="porra-export-goleadores-nombre">{goleadoresTexto || 'Sin goleadores'}</span></div>
            </>
          )}
          <div className={`porra-cta${ctaGuardado ? ' porra-cta--saved' : ''}`}><span className="porra-export-cta-texto">{ctaTexto}</span></div>
          <div className="porra-cta-meta">
            <span>5 pts por el resultado exacto</span>
            <span className="porra-cta-meta__dot">·</span>
            <span>Puedes editarlo hasta el inicio del partido</span>
          </div>
        </>
      ) : (
        <div className="porra-locked">
          <p className="porra-locked__label">{bloqueado.label}</p>
          {bloqueado.score != null && <div className="porra-locked__score">{bloqueado.score}</div>}
          {bloqueado.goleadores && (
            <p style={{ fontSize: '12px', color: '#a9bcdc', marginTop: '8px', fontFamily: 'Archivo, sans-serif' }}>⚽ {bloqueado.goleadores}</p>
          )}
          {bloqueado.resultadoFinal && (
            <p style={{ fontSize: '12px', color: '#a9bcdc', marginTop: '8px', fontFamily: 'Archivo, sans-serif' }}>{bloqueado.resultadoFinal}</p>
          )}
          {!bloqueado.score && !bloqueado.resultadoFinal && bloqueado.mensaje && (
            <p style={{ color: '#a9bcdc', fontFamily: 'Archivo, sans-serif', fontSize: '13px', margin: 0 }}>{bloqueado.mensaje}</p>
          )}
          {bloqueado.puntos > 0 && <div className="porra-locked__pts">+{bloqueado.puntos} puntos</div>}
        </div>
      )}

      <div className="porra-participants">
        <div className="porra-participants__avatars">
          {avatares.map((a, i) => a.src ? (
            <img key={i} className="porra-avatar-mini" src={a.src} alt="" />
          ) : (
            <span key={i} className="porra-avatar-mini">{a.iniciales}</span>
          ))}
        </div>
        {participantesTexto && <span className="porra-participants__text">{participantesTexto}</span>}
      </div>
    </div>
  )
}

// Comportamiento de accesibilidad compartido por las modales de Porra
// (clasificación completa, cómo se juega): bloquea el scroll de la
// página, mueve el foco al diálogo al abrir, lo atrapa dentro mientras
// está abierto y lo devuelve al botón que lo abrió al cerrar.
function useModalA11y(abierta, dialogRef, triggerRef, onClose) {
  useEffect(() => {
    if (!abierta) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = dialogRef.current
    dialog?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && dialog) {
        const focusables = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [abierta])
}

export default function Porra() {
  const { user, signInWithGoogle } = useAuth()
  const [partidos, setPartidos] = useState([])
  const [predicciones, setPredicciones] = useState({})
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [form, setForm] = useState({ goles_zaragoza: 0, goles_rival: 0, goleadores: '' })
  const [partidoActivo, setPartidoActivo] = useState(null)
  const [participantes, setParticipantes] = useState(null)
  const [mostrarGoleadores, setMostrarGoleadores] = useState(false)
  const [vistaJornadas, setVistaJornadas] = useState('ultimas')
  const [rowsToShow, setRowsToShow] = useState(5)
  const [modalRankingAbierto, setModalRankingAbierto] = useState(false)
  const [modalComoSeJuegaAbierto, setModalComoSeJuegaAbierto] = useState(false)
  const [modalJornadasAbierto, setModalJornadasAbierto] = useState(false)
  const [enlaceTwitterFallback, setEnlaceTwitterFallback] = useState(null)
  const participantesReq = useRef(0)
  const matchCardRef = useRef(null)
  const sidebarRef = useRef(null)
  const seasonRef = useRef(null)
  const rankingHeaderRef = useRef(null)
  const rankingFooterRef = useRef(null)
  const modalRankingRef = useRef(null)
  const modalRankingTriggerRef = useRef(null)
  const modalComoSeJuegaRef = useRef(null)
  const modalComoSeJuegaTriggerRef = useRef(null)
  const modalJornadasRef = useRef(null)
  const modalJornadasTriggerRef = useRef(null)
  // PNG de "compartir" pregenerado: exportBlobRef guarda el último listo
  // para usar de inmediato al pulsar un botón; exportGenRef es un
  // contador de generación para descartar una captura en curso si el
  // marcador/goleadores cambian antes de que termine (evita pisar un
  // blob más nuevo con uno obsoleto que tarda más en resolver).
  const exportBlobRef = useRef(null)
  const exportGenRef = useRef(0)
  const exportPrimeraGenRef = useRef(false)

  useEffect(() => {
    fetchPartidos()
    fetchRanking()
  }, [])

  useEffect(() => {
    if (user) fetchPredicciones()
  }, [user])

  useEffect(() => {
    if (partidos.length > 0 && !partidoActivo) {
      setPartidoActivo(getPartidoActivo(partidos))
    }
  }, [partidos])

  useEffect(() => {
    if (partidoActivo && predicciones[partidoActivo.id]) {
      const pred = predicciones[partidoActivo.id]
      setForm({
        goles_zaragoza: pred.goles_zaragoza,
        goles_rival: pred.goles_rival,
        goleadores: pred.goleadores?.join(', ') || '',
      })
      if (pred.goleadores?.length > 0) setMostrarGoleadores(true)
    } else {
      setForm({ goles_zaragoza: 0, goles_rival: 0, goleadores: '' })
      setMostrarGoleadores(false)
    }
  }, [partidoActivo, predicciones])

  // Nº real de zaragocistas que ya han pronosticado este partido.
  useEffect(() => {
    if (!partidoActivo) return
    const miReq = ++participantesReq.current
    supabase
      .from('porra_predicciones')
      .select('*', { count: 'exact', head: true })
      .eq('partido_id', partidoActivo.id)
      .then(({ count }) => {
        if (miReq === participantesReq.current) setParticipantes(count || 0)
      })
  }, [partidoActivo])

  // Nº de filas del ranking que caben en el panel lateral. Solo tiene
  // sentido en el layout de dos columnas (desktop). OJO: la altura de
  // referencia se mide en .porra-match-card, que en desktop lleva
  // align-self:start y por tanto NUNCA se estira — su clientHeight
  // depende solo de su propio contenido, nunca del nº de filas del
  // ranking. Si en cambio midiéramos el propio panel de ranking (que sí
  // se estira para igualar la tarjeta), cada fila añadida agrandaría el
  // panel, lo que agrandaría la fila del grid, lo que volvería a agrandar
  // el panel... un bucle real que llegó a "colar" ~70 filas y a inflar la
  // tarjeta con hueco vacío. Al medir la tarjeta (independiente) y fijar
  // la altura del panel lateral por CSS var en vez de por stretch de
  // grid, se rompe ese ciclo.
  useEffect(() => {
    const card = matchCardRef.current
    if (!card) return
    const mq = window.matchMedia('(min-width: 1101px)')

    function recompute() {
      const cardH = card.clientHeight
      if (sidebarRef.current) sidebarRef.current.style.setProperty('--porra-card-h', `${cardH}px`)

      if (!mq.matches) {
        setRowsToShow(prev => (prev === 5 ? prev : 5))
        return
      }
      const season = seasonRef.current?.clientHeight || 0
      const header = rankingHeaderRef.current?.clientHeight || 0
      const footer = rankingFooterRef.current?.clientHeight || 0
      const disponible = Math.max(0, cardH - season - header - footer)
      const filas = Math.max(3, Math.floor(disponible / RANKING_ROW_HEIGHT))
      setRowsToShow(prev => (prev === filas ? prev : filas))
    }

    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(card)
    if (seasonRef.current) ro.observe(seasonRef.current)
    if (rankingHeaderRef.current) ro.observe(rankingHeaderRef.current)
    if (rankingFooterRef.current) ro.observe(rankingFooterRef.current)
    mq.addEventListener('change', recompute)
    return () => {
      ro.disconnect()
      mq.removeEventListener('change', recompute)
    }
  }, [loading, partidoActivo])

  useModalA11y(modalRankingAbierto, modalRankingRef, modalRankingTriggerRef, () => setModalRankingAbierto(false))
  useModalA11y(modalComoSeJuegaAbierto, modalComoSeJuegaRef, modalComoSeJuegaTriggerRef, () => setModalComoSeJuegaAbierto(false))
  useModalA11y(modalJornadasAbierto, modalJornadasRef, modalJornadasTriggerRef, () => setModalJornadasAbierto(false))

  async function fetchPartidos() {
    const { data } = await supabase
      .from('porra_partidos')
      .select('*')
      .order('kickoff', { ascending: true })
    setPartidos(data || [])
    setLoading(false)
  }

  async function fetchPredicciones() {
    const { data } = await supabase.from('porra_predicciones').select('*').eq('user_id', user.id)
    const map = {}
    data?.forEach(p => { map[p.partido_id] = p })
    setPredicciones(map)
  }

  async function fetchRanking() {
    const { data: puntos } = await supabase
      .from('porra_puntos')
      .select('*')
      .order('puntos_total', { ascending: false })
    if (!puntos || puntos.length === 0) { setRanking([]); return }

    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', puntos.map(p => p.user_id))
    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })

    setRanking(puntos.map(p => ({ ...p, profiles: perfilesMap[p.user_id] || null })))
  }

  async function guardarPrediccion() {
    if (!user) return signInWithGoogle()
    if (!partidoActivo) return
    setGuardando(true)
    const payload = {
      user_id: user.id,
      partido_id: partidoActivo.id,
      goles_zaragoza: form.goles_zaragoza,
      goles_rival: form.goles_rival,
      goleadores: form.goleadores ? form.goleadores.split(',').map(g => g.trim()).filter(Boolean) : [],
    }
    const existing = predicciones[partidoActivo.id]
    if (existing) {
      await supabase.from('porra_predicciones').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('porra_predicciones').insert(payload)
    }
    await fetchPredicciones()
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  const cerrada = partidoActivo ? isCerrada(partidoActivo) : false
  const empezado = partidoActivo ? haEmpezado(partidoActivo.kickoff) : false
  const abiertaDeVerdad = partidoActivo ? (partidoActivo.abierto && !empezado) : false
  const pred = partidoActivo ? predicciones[partidoActivo.id] : null
  const esLocal = partidoActivo?.sede === 'local'
  const venue = partidoActivo ? (esLocal ? 'Ibercaja Estadio' : 'Fuera de casa') : ''
  const escudoRival = partidoActivo ? (ESCUDOS[partidoActivo.rival] || null) : null

  const marcadorFinal = partidoActivo?.finalizado
    ? (esLocal ? [partidoActivo.goles_zaragoza, partidoActivo.goles_rival] : [partidoActivo.goles_rival, partidoActivo.goles_zaragoza])
    : null
  const marcadorPred = pred
    ? (esLocal ? [pred.goles_zaragoza, pred.goles_rival] : [pred.goles_rival, pred.goles_zaragoza])
    : null

  const miEntrada = user ? ranking.find(entry => entry.user_id === user.id) : null
  const miPosicion = user ? ranking.findIndex(entry => entry.user_id === user.id) : -1

  // Racha real: jornadas ya empezadas, contadas hacia atrás desde la más
  // reciente, mientras haya una predicción guardada para cada una — no
  // inventamos una tendencia de posición porque no guardamos histórico
  // de clasificación, pero esto sí es 100% derivable de los datos reales.
  let racha = 0
  if (user) {
    const jugadas = [...partidos].filter(p => haEmpezado(p.kickoff)).sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))
    for (const p of jugadas) {
      if (predicciones[p.id]) racha++
      else break
    }
  }

  let rankingVisible = ranking.slice(0, rowsToShow)
  if (miPosicion > rowsToShow - 1) {
    let inicio = Math.max(0, miPosicion - Math.floor(rowsToShow / 2))
    inicio = Math.min(inicio, Math.max(0, ranking.length - rowsToShow))
    rankingVisible = ranking.slice(inicio, inicio + rowsToShow)
  }
  const offsetVisible = miPosicion > rowsToShow - 1
    ? Math.min(Math.max(0, miPosicion - Math.floor(rowsToShow / 2)), Math.max(0, ranking.length - rowsToShow))
    : 0

  function abrirModalRanking(e) {
    modalRankingTriggerRef.current = e.currentTarget
    setModalRankingAbierto(true)
  }

  function abrirModalComoSeJuega(e) {
    modalComoSeJuegaTriggerRef.current = e.currentTarget
    setModalComoSeJuegaAbierto(true)
  }

  function abrirModalJornadas(e) {
    modalJornadasTriggerRef.current = e.currentTarget
    setModalJornadasAbierto(true)
  }

  // Siempre visibles, también sin sesión: si no hay predicción propia para
  // esa jornada (invitado, o logueado sin haber pronosticado) se muestran
  // 0 puntos por defecto en vez de ocultar la tarjeta. Las versiones
  // "Todas" (sin slice) alimentan la modal de "Ver todo"; no hay selector
  // de temporada en el producto, así que ambas listas son "la temporada
  // actual" (todos los partidos que ya tenemos en porra_partidos).
  const ultimasJornadasTodas = partidos
    .filter(p => p.finalizado)
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))
  const ultimasJornadas = ultimasJornadasTodas.slice(0, 3)

  const proximasJornadasTodas = partidos
    .filter(p => !p.finalizado)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
  const proximasJornadas = proximasJornadasTodas.slice(0, 3)

  function ajustarMarcador(campo, delta) {
    setForm(f => ({ ...f, [campo]: Math.max(0, Math.min(20, f[campo] + delta)) }))
  }

  // Texto de compartir: usa el marcador que el usuario tiene puesto en
  // el selector ahora mismo (guardado o no — la visibilidad de estos
  // botones no depende de haber guardado el pronóstico).
  function textoCompartirPorra() {
    if (!partidoActivo) return ''
    const nombreLocal = esLocal ? 'Real Zaragoza' : partidoActivo.rival
    const nombreVisitante = esLocal ? partidoActivo.rival : 'Real Zaragoza'
    const marcador = esLocal ? [form.goles_zaragoza, form.goles_rival] : [form.goles_rival, form.goles_zaragoza]
    return `Mi pronóstico para el ${nombreLocal} - ${nombreVisitante}: ${marcador[0]}-${marcador[1]} ⚽💙\n¡Únete a la Porra de RZ Hub! #RealZaragoza #RZHub\n${SITE_URL}/porra`
  }

  // Genera el PNG a compartir montando <PorraExportCard> fuera de
  // pantalla (position:fixed; left:-9999px — nunca display:none ni
  // visibility:hidden: esas sí impiden el layout/pintado que
  // html2canvas necesita leer) y capturándola con html2canvas. Se monta
  // y desmonta en cada llamada porque los datos (marcador, goleadores,
  // avatares) cambian; el desmontaje ocurre siempre en el finally,
  // incluso si algo falla a mitad de camino.
  async function generarExportBlob() {
    if (!partidoActivo || !matchCardRef.current) return null
    const miToken = ++exportGenRef.current

    const nombreLocal = esLocal ? 'Real Zaragoza' : partidoActivo.rival
    const nombreVisitante = esLocal ? partidoActivo.rival : 'Real Zaragoza'
    const crestLocalUrl = esLocal ? ESCUDO_ZARAGOZA : escudoRival
    const crestVisitanteUrl = esLocal ? escudoRival : ESCUDO_ZARAGOZA

    const [crestLocalSrc, crestVisitanteSrc] = await Promise.all([
      crestLocalUrl ? intentarRasterizarImagen(crestLocalUrl, 220) : Promise.resolve(null),
      crestVisitanteUrl ? intentarRasterizarImagen(crestVisitanteUrl, 220) : Promise.resolve(null),
    ])

    // Avatares: si un avatar externo no se puede rasterizar (red o CORS
    // real del origen), se cae a las iniciales — nunca un círculo vacío
    // ni una imagen rota en la exportación.
    const avatares = await Promise.all(avataresParticipantes.map(async entry => {
      const nombre = entry.profiles?.name || entry.profiles?.username
      const url = entry.profiles?.avatar_url
      const src = url ? await intentarRasterizarImagen(url, 80) : null
      return { src, iniciales: inicialesDe(nombre) }
    }))

    let bloqueado = null
    if (cerrada) {
      bloqueado = pred
        ? {
            label: 'Tu predicción',
            score: `${marcadorPred[0]} - ${marcadorPred[1]}`,
            goleadores: pred.goleadores?.length > 0 ? pred.goleadores.join(', ') : null,
            resultadoFinal: partidoActivo.finalizado ? `Resultado final: ${marcadorFinal[0]} - ${marcadorFinal[1]}` : null,
            puntos: pred.puntos || 0,
          }
        : {
            label: 'Porra cerrada',
            score: null,
            mensaje: partidoActivo.finalizado ? `Resultado final: ${marcadorFinal[0]} - ${marcadorFinal[1]}` : 'No hiciste tu pronóstico a tiempo.',
          }
    }

    const props = {
      width: matchCardRef.current.offsetWidth || 360,
      jornada: partidoActivo.jornada,
      badgeAbierta: abiertaDeVerdad,
      badgeTexto: abiertaDeVerdad ? 'Porra abierta' : 'Porra cerrada',
      fecha: formatFechaHora(partidoActivo.kickoff),
      venue,
      nombreLocal,
      nombreVisitante,
      crestLocalSrc,
      crestVisitanteSrc,
      inicialLocal: nombreLocal[0],
      inicialVisitante: nombreVisitante[0],
      cerrada,
      marcadorLocal: esLocal ? form.goles_zaragoza : form.goles_rival,
      marcadorVisitante: esLocal ? form.goles_rival : form.goles_zaragoza,
      mostrarGoleadores: true,
      goleadoresTexto: form.goleadores,
      // La imagen es una invitación para quien la vea, no una
      // confirmación personal de que YA guardaste tu pronóstico — por
      // eso el CTA exportado siempre es el mismo texto/estilo,
      // independientemente de "guardado". El botón real de la página
      // conserva su texto y su acción de guardar sin cambios.
      ctaTexto: 'Haz tu porra en rzhub.es',
      ctaGuardado: false,
      bloqueado,
      avatares,
      participantesTexto: participantes !== null ? `${participantes.toLocaleString('es-ES')} zaragocistas ya participan` : null,
    }

    const host = document.createElement('div')
    host.style.position = 'fixed'
    host.style.left = '-9999px'
    host.style.top = '0'
    host.style.pointerEvents = 'none'
    document.body.appendChild(host)
    const root = createRoot(host)

    try {
      root.render(<PorraExportCard {...props} />)

      // Fuentes e imágenes (ya resueltas arriba) listas antes de medir:
      // si se captura antes de que 'Archivo'/'Humane' terminen de
      // cargar, el navegador usa una fuente de sistema con métricas
      // distintas — de ahí el marcador desplazado que se veía antes.
      await document.fonts.ready
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

      if (miToken !== exportGenRef.current) return null // hay una generación más nueva en marcha

      const nodo = host.querySelector('.porra-export-card')
      if (!nodo) return null

      // Escala 2x limitada: evita imágenes desproporcionadas en tarjetas
      // muy anchas (desktop).
      const anchoReal = nodo.offsetWidth || props.width
      const scale = anchoReal * 2 > 2000 ? 2000 / anchoReal : 2

      const canvas = await html2canvas(nodo, { backgroundColor: null, useCORS: true, scale })
      if (miToken !== exportGenRef.current) return null

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      if (import.meta.env.DEV) {
        console.info('[Porra] PNG de exportación generado', { width: canvas.width, height: canvas.height, bytes: blob?.size })
      }
      return blob
    } finally {
      root.unmount()
      host.remove()
    }
  }

  // El PNG se prepara con antelación (mientras el usuario sigue
  // ajustando el marcador o los goleadores) para que, al pulsar
  // compartir, copiarlo al portapapeles sea una operación ya resuelta
  // en vez de un proceso largo — eso es lo que de verdad evita que la
  // activación del usuario "caduque" antes de poder copiar.
  async function obtenerBlobParaCompartir() {
    if (exportBlobRef.current) return exportBlobRef.current
    const blob = await generarExportBlob()
    exportBlobRef.current = blob
    return blob
  }

  function descargarBlob(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = nombreArchivo
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Mismo patrón que el botón "Compartir" del Lineup Builder (Field.jsx):
  // en móvil se intenta abrir la app nativa de X vía su esquema propio y,
  // si la pestaña sigue visible pasado un margen (no se abrió la app), se
  // cae a la versión web; en desktop se abre directamente el compositor
  // web.
  function abrirCompositorMobileX(texto, urlWeb) {
    const urlApp = `twitter://post?message=${texto}`
    let volvioAlNavegador = false
    const marcarVuelta = () => { if (document.hidden) volvioAlNavegador = true }
    document.addEventListener('visibilitychange', marcarVuelta)
    window.location.href = urlApp
    setTimeout(() => {
      document.removeEventListener('visibilitychange', marcarVuelta)
      if (!volvioAlNavegador) window.location.href = urlWeb
    }, 1500)
  }

  // Orden fijo: 1) preparar PNG, 2) copiarlo, 3) confirmar la copia,
  // 4) abrir el compositor, 5) avisar de que hay que pegar — nunca se
  // abre X antes de saber si la copia terminó bien, y el texto solo
  // dice "captura copiada" cuando de verdad lo está.
  async function handleCompartirX() {
    setEnlaceTwitterFallback(null)
    const blob = await obtenerBlobParaCompartir()
    if (!blob) {
      alert('No se pudo preparar la imagen de tu pronóstico. Inténtalo de nuevo.')
      return
    }

    let copiado = false
    if (navigator.clipboard?.write && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        copiado = true
      } catch (e) {
        console.error('No se pudo copiar la captura al portapapeles:', e)
      }
    }
    if (!copiado) {
      // El navegador no permite copiar imágenes: se ofrece la descarga
      // para adjuntarla a mano en vez de dejar al usuario sin nada.
      descargarBlob(blob, 'mi-pronostico-porra.png')
      alert('No se pudo copiar la imagen al portapapeles. La hemos descargado — adjúntala tú mismo al tuit.')
    }

    const esMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
    const sufijo = copiado ? '\n(Captura copiada 📋) Pégala aquí 👇' : ''
    const texto = encodeURIComponent(`${textoCompartirPorra()}${sufijo}`)
    const urlWeb = `https://twitter.com/intent/tweet?text=${texto}`

    if (esMobile) {
      abrirCompositorMobileX(texto, urlWeb)
    } else {
      const ventana = window.open(urlWeb, '_blank')
      if (!ventana) setEnlaceTwitterFallback(urlWeb) // bloqueado por el navegador: se ofrece un enlace manual
    }
  }

  // Instagram no tiene una "web intent" para publicar con texto o
  // imagen precargados (a diferencia de X), así que la captura se copia
  // siempre al portapapeles para pegarla a mano en la publicación o
  // historia. Mismo patrón mobile-app-vs-web que abrirCompositorMobileX:
  // en móvil se intenta abrir la app nativa vía su esquema propio y, si
  // la pestaña sigue visible pasado un margen (no se abrió la app), se
  // cae a instagram.com; en desktop se abre directamente la web.
  function abrirInstagramMobile(urlWeb) {
    const urlApp = 'instagram://app'
    let volvioAlNavegador = false
    const marcarVuelta = () => { if (document.hidden) volvioAlNavegador = true }
    document.addEventListener('visibilitychange', marcarVuelta)
    window.location.href = urlApp
    setTimeout(() => {
      document.removeEventListener('visibilitychange', marcarVuelta)
      if (!volvioAlNavegador) window.location.href = urlWeb
    }, 1500)
  }

  async function handleCompartirInstagram() {
    const blob = await obtenerBlobParaCompartir()
    if (!blob) {
      alert('No se pudo preparar la imagen de tu pronóstico. Inténtalo de nuevo.')
      return
    }

    let copiado = false
    if (navigator.clipboard?.write && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        copiado = true
      } catch (e) {
        console.error('No se pudo copiar la captura al portapapeles:', e)
      }
    }

    if (copiado) {
      alert('Hemos copiado la captura de tu pronóstico al portapapeles. Pégala en tu publicación o historia de Instagram.')
    } else {
      descargarBlob(blob, 'mi-pronostico-porra.png')
      alert('No se pudo copiar la captura al portapapeles. La hemos descargado — adjúntala tú mismo en Instagram.')
    }

    const esMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
    const urlWeb = 'https://www.instagram.com'
    if (esMobile) {
      abrirInstagramMobile(urlWeb)
    } else {
      window.open(urlWeb, '_blank')
    }
  }

  const avataresParticipantes = ranking.slice(0, 3)

  // Mantiene el PNG de "compartir" siempre fresco: la primera vez que
  // hay partido activo y sesión se genera sin esperar (para que el
  // primer clic ya encuentre algo listo), y las regeneraciones
  // posteriores (marcador, goleadores, guardado...) se debouncean para
  // no relanzar html2canvas en cada pulsación de +/-.
  useEffect(() => {
    if (!user || !partidoActivo) {
      exportBlobRef.current = null
      return
    }
    let cancelado = false
    const delay = exportPrimeraGenRef.current ? 500 : 0
    const id = setTimeout(async () => {
      exportPrimeraGenRef.current = true
      const blob = await generarExportBlob()
      if (!cancelado) exportBlobRef.current = blob
    }, delay)
    return () => { cancelado = true; clearTimeout(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, partidoActivo, cerrada, pred, form.goles_zaragoza, form.goles_rival, form.goleadores, participantes, ranking, guardado])

  return (
    <div className="porra-page">
      <SEO
        title="La Porra del Real Zaragoza | Pronósticos y Ranking | RZ Hub"
        description="Predice los resultados del Real Zaragoza, suma puntos por acertar el marcador y los goleadores, y compite en el ranking de la comunidad zaragocista."
        keywords="porra Real Zaragoza, quiniela Real Zaragoza, pronósticos Real Zaragoza, predicciones Real Zaragoza, ranking porra Real Zaragoza"
        path="/porra"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'La Porra del Real Zaragoza | RZ Hub',
          url: `${SITE_URL}/porra`,
          applicationCategory: 'GameApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          description: 'Juego de pronósticos de los partidos del Real Zaragoza con ranking de la comunidad.',
        }}
      />

      {/* Envuelve cabecera + tarjeta del partido: el fondo fotográfico
          compartido (desktop) vive en este contenedor, así que termina
          exactamente donde termina su contenido real — no en una altura
          fija — y nunca se prolonga bajo el historial. */}
      <div className="porra-atmosphere">
      {/* CABECERA */}
      <div className="porra-hero">
        <div className="porra-hero__inner">
          <h1 className="porra-hero__title">La Porra</h1>
          <div className="porra-hero__row">
            <p className="porra-hero__subtitle">Participa cada jornada y gana premios a final de temporada.</p>
            <button className="porra-hero__howto" onClick={abrirModalComoSeJuega}>
              Cómo se juega
              <span className="porra-icon-arrow" aria-hidden="true">↗</span>
              <IconHelpCircle className="porra-icon-mobile" />
            </button>
          </div>
        </div>
      </div>

      <div className="porra-container">
        {loading && <p style={{ color: '#a9bcdc', fontFamily: 'Archivo, sans-serif' }}>Cargando...</p>}

        {!loading && !partidoActivo && (
          <div className="porra-match-card" style={{ padding: '48px 28px', textAlign: 'center' }}>
            <p style={{ color: '#a9bcdc', fontFamily: 'Archivo, sans-serif', margin: 0 }}>No hay jornadas disponibles en este momento.</p>
          </div>
        )}

        {!loading && partidoActivo && (
          <div className="porra-grid">
            {/* IZQUIERDA — partido y pronóstico */}
            <div className="porra-match-card" ref={matchCardRef}>
              <div className="porra-match-card__top">
                <div className="porra-match-card__comp">
                  Primera Federación · Jornada {partidoActivo.jornada}
                  <span className={`porra-badge ${abiertaDeVerdad ? 'porra-badge--open' : 'porra-badge--closed'}`}>
                    {abiertaDeVerdad ? 'Porra abierta' : 'Porra cerrada'}
                  </span>
                </div>
                <div className="porra-match-card__when">
                  <div className="porra-match-card__date">{formatFechaHora(partidoActivo.kickoff)}</div>
                  <div className="porra-match-card__venue">{venue}</div>
                </div>
              </div>

              {/* Escudos + separador viven en su propia fila del grid
                  (altura fija, alineados al centro): el guion se centra
                  respecto a esa fila exclusivamente. Nombres y selectores
                  van en filas inferiores independientes, así que un
                  nombre a dos líneas nunca desplaza el guion. */}
              <div className="porra-teams">
                <div className="porra-team__crest-box porra-team--left">
                  {(esLocal ? ESCUDO_ZARAGOZA : escudoRival) ? (
                    <img className="porra-team__crest" src={esLocal ? ESCUDO_ZARAGOZA : escudoRival} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                  ) : (
                    <span className="porra-team__crest-fallback">{(esLocal ? 'Real Zaragoza' : partidoActivo.rival)[0]}</span>
                  )}
                </div>
                <span className="porra-teams__sep">–</span>
                <div className="porra-team__crest-box porra-team--right">
                  {(esLocal ? escudoRival : ESCUDO_ZARAGOZA) ? (
                    <img className="porra-team__crest" src={esLocal ? escudoRival : ESCUDO_ZARAGOZA} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                  ) : (
                    <span className="porra-team__crest-fallback">{(esLocal ? partidoActivo.rival : 'Real Zaragoza')[0]}</span>
                  )}
                </div>

                <span className="porra-team__name porra-team--left">{esLocal ? 'Real Zaragoza' : partidoActivo.rival}</span>
                <span className="porra-team__name porra-team--right">{esLocal ? partidoActivo.rival : 'Real Zaragoza'}</span>

                {!cerrada && (
                  <div className="porra-team__selector porra-team--left">
                    <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_zaragoza' : 'goles_rival', -1)} disabled={(esLocal ? form.goles_zaragoza : form.goles_rival) <= 0}>−</button>
                    <span className="porra-score-value">{esLocal ? form.goles_zaragoza : form.goles_rival}</span>
                    <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_zaragoza' : 'goles_rival', 1)}>+</button>
                  </div>
                )}
                {!cerrada && (
                  <div className="porra-team__selector porra-team--right">
                    <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_rival' : 'goles_zaragoza', -1)} disabled={(esLocal ? form.goles_rival : form.goles_zaragoza) <= 0}>−</button>
                    <span className="porra-score-value">{esLocal ? form.goles_rival : form.goles_zaragoza}</span>
                    <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_rival' : 'goles_zaragoza', 1)}>+</button>
                  </div>
                )}
              </div>

              {!user && !cerrada && (
                <>
                  <p className="porra-tu-pronostico-label">Tu pronóstico</p>
                  <button className="porra-cta" onClick={signInWithGoogle}>Inicia sesión para participar →</button>
                </>
              )}

              {user && !cerrada && (
                <>
                  <p className="porra-tu-pronostico-label">Tu pronóstico</p>

                  <div className="porra-goleadores" onClick={() => setMostrarGoleadores(v => !v)}>
                    <span className="porra-goleadores__label">{mostrarGoleadores ? '− Goleadores' : '+ Añadir goleadores'}</span>
                    <span className="porra-goleadores__pts">+3 pts · Opcional</span>
                  </div>
                  {mostrarGoleadores && (
                    <input
                      className="porra-goleadores-input"
                      type="text"
                      value={form.goleadores}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setForm(f => ({ ...f, goleadores: e.target.value }))}
                      placeholder="Ej: Escobar, Gabilondo"
                    />
                  )}

                  <button
                    className={`porra-cta${guardado ? ' porra-cta--saved' : ''}`}
                    onClick={guardarPrediccion}
                    disabled={guardando}
                  >
                    {guardado ? '✓ ¡Guardado!' : guardando ? 'Guardando...' : 'Guardar pronóstico →'}
                  </button>
                  <div className="porra-cta-meta">
                    <span>5 pts por el resultado exacto</span>
                    <span className="porra-cta-meta__dot">·</span>
                    <span>Puedes editarlo hasta el inicio del partido</span>
                  </div>
                </>
              )}

              {cerrada && (
                pred ? (
                  <div className="porra-locked">
                    <p className="porra-locked__label">Tu predicción</p>
                    <div className="porra-locked__score">{marcadorPred[0]} - {marcadorPred[1]}</div>
                    {pred.goleadores?.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#a9bcdc', marginTop: '8px', fontFamily: 'Archivo, sans-serif' }}>⚽ {pred.goleadores.join(', ')}</p>
                    )}
                    {partidoActivo.finalizado && (
                      <p style={{ fontSize: '12px', color: '#a9bcdc', marginTop: '8px', fontFamily: 'Archivo, sans-serif' }}>
                        Resultado final: {marcadorFinal[0]} - {marcadorFinal[1]}
                      </p>
                    )}
                    {pred.puntos > 0 && <div className="porra-locked__pts">+{pred.puntos} puntos</div>}
                  </div>
                ) : (
                  <div className="porra-locked">
                    <p className="porra-locked__label">Porra cerrada</p>
                    <p style={{ color: '#a9bcdc', fontFamily: 'Archivo, sans-serif', fontSize: '13px', margin: 0 }}>
                      {partidoActivo.finalizado ? `Resultado final: ${marcadorFinal[0]} - ${marcadorFinal[1]}` : 'No hiciste tu pronóstico a tiempo.'}
                    </p>
                  </div>
                )
              )}

              {/* Solo depende de tener sesión iniciada, no de haber
                  guardado un pronóstico — igual que el resto de la
                  tarjeta es visible sin haber pronosticado todavía. */}
              {user && (
                <>
                  <div className="porra-share">
                    <button className="porra-share__btn porra-share__btn--x" onClick={handleCompartirX}>
                      𝕏 Compartir
                    </button>
                    <button className="porra-share__btn porra-share__btn--instagram" onClick={handleCompartirInstagram}>
                      <IconInstagram className="porra-share__icon" />
                      Compartir
                    </button>
                  </div>
                  {enlaceTwitterFallback && (
                    <p className="porra-share__fallback">
                      ¿No se abrió la ventana?{' '}
                      <a href={enlaceTwitterFallback} target="_blank" rel="noopener noreferrer">Abrir Twitter</a>
                    </p>
                  )}
                </>
              )}

              <div className="porra-participants">
                <div className="porra-participants__avatars">
                  {avataresParticipantes.map((entry, i) => (
                    entry.profiles?.avatar_url ? (
                      <img key={i} className="porra-avatar-mini" src={entry.profiles.avatar_url} alt="" />
                    ) : (
                      <span key={i} className="porra-avatar-mini">{inicialesDe(entry.profiles?.name || entry.profiles?.username)}</span>
                    )
                  ))}
                </div>
                {participantes !== null && (
                  <span className="porra-participants__text">{participantes.toLocaleString('es-ES')} zaragocistas ya participan</span>
                )}
              </div>
            </div>

            {/* DERECHA — temporada y clasificación */}
            <div className="porra-sidebar" ref={sidebarRef}>
              <div className="porra-season" ref={seasonRef}>
                <p className="porra-season__title">Tu temporada</p>
                {user && miEntrada ? (
                  <>
                    <div className="porra-season__stats">
                      <div className="porra-season__stat">
                        <span className="porra-season__value">{miEntrada.puntos_total}</span>
                        <span className="porra-season__stat-label">Puntos</span>
                      </div>
                      {miPosicion !== -1 && (
                        <div className="porra-season__stat">
                          <span className="porra-season__value">{miPosicion + 1}.º</span>
                          <span className="porra-season__stat-label">Posición</span>
                        </div>
                      )}
                    </div>
                    {racha > 0 && (
                      <p className="porra-season__streak">{racha} {racha === 1 ? 'jornada seguida participando' : 'jornadas seguidas participando'}</p>
                    )}
                  </>
                ) : user ? (
                  <p className="porra-season__empty">Aún no tienes puntos — haz tu primer pronóstico.</p>
                ) : (
                  <div className="porra-season__guest">
                    <p className="porra-season__headline">Cada jornada cuenta</p>
                    <p className="porra-season__empty">Inicia sesión para guardar tus pronósticos y seguir tus puntos y tu posición en la clasificación.</p>
                    <button className="porra-season__login" onClick={signInWithGoogle}>Iniciar sesión</button>
                  </div>
                )}
              </div>

              <div className="porra-ranking">
                <div className="porra-ranking__header" ref={rankingHeaderRef}>
                  <p className="porra-ranking__title">Clasificación</p>
                </div>

                <div className="porra-ranking__rows">
                  {ranking.length === 0 && <p className="porra-ranking__empty">Aún no hay puntuaciones.</p>}

                  {rankingVisible.map((entry, i) => {
                    const pos = offsetVisible + i
                    const nombre = entry.profiles?.name || entry.profiles?.username || 'Usuario'
                    const esYo = user?.id === entry.user_id
                    return (
                      <div key={entry.user_id} className={`porra-ranking__row${esYo ? ' is-me' : ''}`}>
                        <span className={`porra-ranking__pos${pos === 0 ? ' porra-ranking__pos--1' : pos === 1 ? ' porra-ranking__pos--2' : pos === 2 ? ' porra-ranking__pos--3' : ''}`}>
                          {pos + 1}
                        </span>
                        <div className="porra-ranking__user">
                          {entry.profiles?.avatar_url ? (
                            <img className="porra-ranking__avatar" src={entry.profiles.avatar_url} alt="" />
                          ) : (
                            <span className="porra-ranking__avatar">{inicialesDe(nombre)}</span>
                          )}
                          <span className="porra-ranking__name">{esYo ? `${nombre} · Tú` : nombre}</span>
                        </div>
                        <span className="porra-ranking__pts">{entry.puntos_total} pts</span>
                      </div>
                    )
                  })}
                </div>

                {ranking.length > 0 && (
                  <div className="porra-ranking__footer" ref={rankingFooterRef}>
                    <button onClick={abrirModalRanking}>
                      Ver clasificación completa
                      <span className="porra-icon-arrow" aria-hidden="true">↗</span>
                      <IconChevronRight className="porra-icon-mobile" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      <div className="porra-container">
        {/* ÚLTIMAS / PRÓXIMAS JORNADAS */}
        {!loading && partidos.length > 0 && (
          <div className="porra-jornadas">
            <div className="porra-jornadas__header">
              <div className="porra-jornadas__tabs">
                <button
                  className={`porra-jornadas__tab${vistaJornadas === 'ultimas' ? ' is-active' : ''}`}
                  onClick={() => setVistaJornadas('ultimas')}
                >
                  Últimas jornadas
                </button>
                <button
                  className={`porra-jornadas__tab${vistaJornadas === 'proximas' ? ' is-active' : ''}`}
                  onClick={() => setVistaJornadas('proximas')}
                >
                  Próximas jornadas
                </button>
              </div>
              <button className="porra-jornadas__see-all" onClick={abrirModalJornadas}>
                Ver todo
                <span className="porra-icon-arrow" aria-hidden="true">↗</span>
                <IconChevronRight className="porra-icon-mobile" />
              </button>
            </div>

            {vistaJornadas === 'ultimas' ? (
              ultimasJornadas.length === 0 ? (
                <p className="porra-jornadas__empty">Aún no se ha disputado ninguna jornada.</p>
              ) : (
                <div className="porra-jornadas__list">
                  {ultimasJornadas.map(p => <JornadaFinalCard key={p.id} p={p} pred={predicciones[p.id]} />)}
                </div>
              )
            ) : (
              proximasJornadas.length === 0 ? (
                <p className="porra-jornadas__empty">No hay más jornadas programadas.</p>
              ) : (
                <div className="porra-jornadas__list">
                  {proximasJornadas.map(p => <JornadaProximaCard key={p.id} p={p} />)}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {modalRankingAbierto && (
        <div className="porra-modal-overlay" onClick={() => setModalRankingAbierto(false)}>
          <div
            className="porra-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="porra-modal-ranking-title"
            tabIndex={-1}
            ref={modalRankingRef}
            onClick={e => e.stopPropagation()}
          >
            <div className="porra-modal__header">
              <h2 id="porra-modal-ranking-title" className="porra-modal__title">Clasificación completa</h2>
              <button className="porra-modal__close" onClick={() => setModalRankingAbierto(false)} aria-label="Cerrar clasificación">✕</button>
            </div>
            <div className="porra-modal__body">
              {ranking.length === 0 ? (
                <p className="porra-ranking__empty">Aún no hay puntuaciones.</p>
              ) : (
                ranking.map((entry, i) => {
                  const nombre = entry.profiles?.name || entry.profiles?.username || 'Usuario'
                  const esYo = user?.id === entry.user_id
                  return (
                    <div key={entry.user_id} className={`porra-ranking__row${esYo ? ' is-me' : ''}`}>
                      <span className={`porra-ranking__pos${i === 0 ? ' porra-ranking__pos--1' : i === 1 ? ' porra-ranking__pos--2' : i === 2 ? ' porra-ranking__pos--3' : ''}`}>
                        {i + 1}
                      </span>
                      <div className="porra-ranking__user">
                        {entry.profiles?.avatar_url ? (
                          <img className="porra-ranking__avatar" src={entry.profiles.avatar_url} alt="" />
                        ) : (
                          <span className="porra-ranking__avatar">{inicialesDe(nombre)}</span>
                        )}
                        <span className="porra-ranking__name">{esYo ? `${nombre} · Tú` : nombre}</span>
                      </div>
                      <span className="porra-ranking__pts">{entry.puntos_total} pts</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {modalComoSeJuegaAbierto && (
        <div className="porra-modal-overlay" onClick={() => setModalComoSeJuegaAbierto(false)}>
          <div
            className="porra-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="porra-modal-howto-title"
            tabIndex={-1}
            ref={modalComoSeJuegaRef}
            onClick={e => e.stopPropagation()}
          >
            <div className="porra-modal__header">
              <h2 id="porra-modal-howto-title" className="porra-modal__title">Cómo se juega</h2>
              <button className="porra-modal__close" onClick={() => setModalComoSeJuegaAbierto(false)} aria-label="Cerrar cómo se juega">✕</button>
            </div>
            <div className="porra-modal__body porra-modal__body--howto">
              <div className="porra-howto-box__item">
                <span className="porra-howto-box__pts">5 PTS</span>
                <span className="porra-howto-box__label">Resultado exacto</span>
              </div>
              <div className="porra-howto-box__item">
                <span className="porra-howto-box__pts">3 PTS</span>
                <span className="porra-howto-box__label">Todos los goleadores</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalJornadasAbierto && (
        <div className="porra-modal-overlay" onClick={() => setModalJornadasAbierto(false)}>
          <div
            className="porra-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="porra-modal-jornadas-title"
            tabIndex={-1}
            ref={modalJornadasRef}
            onClick={e => e.stopPropagation()}
          >
            <div className="porra-modal__header">
              <h2 id="porra-modal-jornadas-title" className="porra-modal__title">
                {vistaJornadas === 'ultimas' ? 'Últimas jornadas' : 'Próximas jornadas'}
              </h2>
              <button className="porra-modal__close" onClick={() => setModalJornadasAbierto(false)} aria-label="Cerrar jornadas">✕</button>
            </div>
            <div className="porra-modal__body porra-modal__body--jornadas">
              {vistaJornadas === 'ultimas' ? (
                ultimasJornadasTodas.length === 0 ? (
                  <p className="porra-jornadas__empty">Aún no se ha disputado ninguna jornada.</p>
                ) : (
                  ultimasJornadasTodas.map(p => <JornadaFinalCard key={p.id} p={p} pred={predicciones[p.id]} />)
                )
              ) : (
                proximasJornadasTodas.length === 0 ? (
                  <p className="porra-jornadas__empty">No hay más jornadas programadas.</p>
                ) : (
                  proximasJornadasTodas.map(p => <JornadaProximaCard key={p.id} p={p} />)
                )
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
