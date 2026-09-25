import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import { useEscudo } from '../lib/escudos'
import './Calendario.css'

const ICS_URL = 'https://rzhub.es/calendario.ics'
const ICS_WEBCAL = ICS_URL.replace('https://', 'webcal://')
const POST_IMG = '/POST CALENDARIO.png'
const ESTADIO_LOCAL = 'Ibercaja Estadio'
const EQUIPO = 'Real Zaragoza'

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

function claveMes(fecha) {
  const d = new Date(`${fecha}T00:00:00`)
  return `${d.getFullYear()}-${d.getMonth()}`
}
function nombreMes(fecha) {
  const d = new Date(`${fecha}T00:00:00`)
  return MESES[d.getMonth()]
}
function fechaCorta(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase()
}
function horaDe(kickoff) {
  const d = new Date(kickoff)
  const horaConocida = !(d.getUTCHours() === 0 && d.getUTCMinutes() === 0)
  return horaConocida ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null
}
function estadioDe(partido) {
  return partido.sede === 'local' ? ESTADIO_LOCAL : 'Fuera de casa'
}

function useCalendario() {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('porra_partidos').select('*').order('jornada', { ascending: true }).then(({ data }) => {
      setPartidos(data || [])
      setLoading(false)
    })
  }, [])
  return { partidos, loading }
}

// Solo los rivales con ficha ya construida en /rival/:slug son clicables
// desde el calendario — hoy en día únicamente UD Ibiza.
function useFichasRivales() {
  const [porNombre, setPorNombre] = useState(new Map())
  useEffect(() => {
    supabase.from('rivales').select('id, nombre').then(({ data }) => {
      setPorNombre(new Map((data || []).map(r => [r.nombre, r.id])))
    })
  }, [])
  return porNombre
}

function EscudoEquipo({ nombre, size = 32 }) {
  const src = useEscudo(nombre)
  if (!src) return <span className="cal2-escudo cal2-escudo--placeholder" style={{ width: size, height: size }}>{nombre?.[0]}</span>
  return <img src={src} alt="" className="cal2-escudo" style={{ width: size, height: size }} onError={e => { e.target.style.display = 'none' }} />
}

function EstadoBadge({ partido, esProximo }) {
  if (esProximo) return <span className="cal2-badge cal2-badge--proximo">Próximo partido</span>
  if (partido.finalizado) return <span className="cal2-badge cal2-badge--finalizado">Finalizado</span>
  return <span className="cal2-badge cal2-badge--sin-jugar">Sin jugar</span>
}

function FilaPartido({ partido, esProximo, fichasRivales }) {
  const navigate = useNavigate()
  const esLocal = partido.sede === 'local'
  const equipoLocal = esLocal ? EQUIPO : partido.rival
  const equipoVisitante = esLocal ? partido.rival : EQUIPO
  const hora = horaDe(partido.kickoff)
  const golesLocal = esLocal ? partido.goles_zaragoza : partido.goles_rival
  const golesVisitante = esLocal ? partido.goles_rival : partido.goles_zaragoza
  const slugRival = fichasRivales.get(partido.rival)

  return (
    <div
      className={`cal2-fila${esProximo ? ' cal2-fila--proxima' : ''}${slugRival ? '' : ' cal2-fila--sin-click'}`}
      onClick={slugRival ? () => navigate(`/rival/${slugRival}`) : undefined}
    >
      <div className="cal2-fila__meta">
        <span className="cal2-fila__jornada">Jornada {String(partido.jornada).padStart(2, '0')}</span>
        <span className="cal2-fila__fecha">{fechaCorta(partido.fecha)}{hora ? ` · ${hora}` : ''}</span>
      </div>
      <span className="cal2-fila__lugar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
        {estadioDe(partido)}
      </span>

      <div className="cal2-fila__partido">
        <span className="cal2-fila__equipo">{equipoLocal}</span>
        <EscudoEquipo nombre={equipoLocal} />
        <span className="cal2-fila__marcador">
          {partido.finalizado ? `${golesLocal} - ${golesVisitante}` : '- -'}
        </span>
        <EscudoEquipo nombre={equipoVisitante} />
        <span className="cal2-fila__equipo cal2-fila__equipo--visitante">{equipoVisitante}</span>
      </div>

      <EstadoBadge partido={partido} esProximo={esProximo} />
      <svg className="cal2-fila__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
    </div>
  )
}

function GrupoMes({ mes, partidos, proximoId, abierto, onToggle, fichasRivales }) {
  return (
    <div className="cal2-grupo">
      <button className="cal2-grupo__header" onClick={onToggle}>
        <span className="cal2-grupo__mes">{mes}</span>
        <span className="cal2-grupo__linea" />
        <span className="cal2-grupo__count">{partidos.length} PARTIDO{partidos.length !== 1 ? 'S' : ''}</span>
        <svg className={`cal2-grupo__chevron${abierto ? ' is-abierto' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {abierto && (
        <div className="cal2-grupo__filas">
          {partidos.map(p => <FilaPartido key={p.id} partido={p} esProximo={p.id === proximoId} fichasRivales={fichasRivales} />)}
        </div>
      )}
    </div>
  )
}

function ProximoPartido({ partido }) {
  const navigate = useNavigate()
  if (!partido) return null
  const esLocal = partido.sede === 'local'
  const equipoLocal = esLocal ? EQUIPO : partido.rival
  const equipoVisitante = esLocal ? partido.rival : EQUIPO
  const hora = horaDe(partido.kickoff)

  return (
    <div className="cal2-proximo">
      <div className="cal2-proximo__fondo" />
      <div className="cal2-proximo__overlay" />
      <div className="cal2-proximo__contenido">
        <div className="cal2-proximo__texto">
          <p className="cal2-proximo__eyebrow">Próximo partido</p>
          <p className="cal2-proximo__meta">Primera Federación · Jornada {String(partido.jornada).padStart(2, '0')}</p>
        </div>

        <div className="cal2-proximo__enfrentamiento">
          <div className="cal2-proximo__equipo">
            <EscudoEquipo nombre={equipoLocal} size={44} />
            <span>{equipoLocal.toUpperCase()}</span>
          </div>
          <span className="cal2-proximo__vs">VS</span>
          <div className="cal2-proximo__equipo">
            <EscudoEquipo nombre={equipoVisitante} size={44} />
            <span>{equipoVisitante.toUpperCase()}</span>
          </div>
        </div>

        <div className="cal2-proximo__datos">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></svg>
            {fechaCorta(partido.fecha)}{hora ? ` · ${hora}` : ''}
          </span>
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
            {estadioDe(partido)}
          </span>
        </div>

        <button className="cal2-proximo__btn" onClick={() => navigate('/porra')}>Participa en la porra →</button>
      </div>
    </div>
  )
}

function SyncBar({ onApple, onGoogle, onCopiar, copiado }) {
  return (
    <div className="cal2-syncbar">
      <div className="cal2-syncbar__info">
        <span className="cal2-syncbar__icono">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></svg>
        </span>
        <div>
          <p className="cal2-syncbar__titulo">Tu calendario, siempre{' '}contigo</p>
          <p className="cal2-syncbar__desc">Sincroniza todos los partidos del Real Zaragoza y recibe automáticamente los cambios de horario.</p>
        </div>
      </div>
      <button className="cal2-syncbar__btn" onClick={onApple}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
        <span>Añadir a<br /><strong>Apple Calendar</strong></span>
      </button>
      <button className="cal2-syncbar__btn" onClick={onGoogle}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
        <span>Añadir a<br /><strong>Google Calendar</strong></span>
      </button>
      <button className="cal2-syncbar__btn cal2-syncbar__btn--ghost" onClick={onCopiar}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        <span>{copiado ? '¡URL copiada!' : <>Copiar URL<br /><strong>del calendario (.ics)</strong></>}</span>
      </button>
    </div>
  )
}

export default function Calendario() {
  const { partidos, loading } = useCalendario()
  const fichasRivales = useFichasRivales()
  const [filtro, setFiltro] = useState('todos')
  const [copiado, setCopiado] = useState(false)
  const [gruposAbiertos, setGruposAbiertos] = useState(null)

  const proximo = useMemo(() => partidos.find(p => !p.finalizado), [partidos])

  const partidosFiltrados = useMemo(() => {
    if (filtro === 'local') return partidos.filter(p => p.sede === 'local')
    if (filtro === 'visitante') return partidos.filter(p => p.sede === 'visitante')
    return partidos
  }, [partidos, filtro])

  const grupos = useMemo(() => {
    const mapa = new Map()
    partidosFiltrados.forEach(p => {
      const clave = claveMes(p.fecha)
      if (!mapa.has(clave)) mapa.set(clave, { mes: nombreMes(p.fecha), partidos: [] })
      mapa.get(clave).partidos.push(p)
    })
    return [...mapa.entries()].map(([clave, v]) => ({ clave, ...v }))
  }, [partidosFiltrados])

  // Por defecto, abiertos solo el mes en curso y el siguiente; los meses
  // ya jugados y los más lejanos quedan colapsados hasta que el usuario
  // los despliegue.
  const clavesPorDefecto = useMemo(() => {
    const hoy = new Date()
    const y = hoy.getFullYear(), m = hoy.getMonth()
    const [ySig, mSig] = m === 11 ? [y + 1, 0] : [y, m + 1]
    return new Set([`${y}-${m}`, `${ySig}-${mSig}`])
  }, [])

  const abiertosEfectivo = gruposAbiertos ?? clavesPorDefecto

  function toggleGrupo(clave) {
    setGruposAbiertos(prev => {
      const base = new Set(prev ?? clavesPorDefecto)
      if (base.has(clave)) base.delete(clave)
      else base.add(clave)
      return new Set(base)
    })
  }

  const handleApple = () => { window.location.href = ICS_WEBCAL }
  const handleGoogle = () => { window.open('https://www.google.com/calendar/render?cid=' + encodeURIComponent(ICS_WEBCAL), '_blank') }
  const handleCopiar = () => {
    navigator.clipboard.writeText(ICS_URL).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <div className="cal2-page">
      <SEO
        title="Calendario del Real Zaragoza 26/27 | RZ Hub"
        description="Todos los partidos del Real Zaragoza, fechas, horarios y resultados en un solo lugar."
        path="/calendario"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Calendario del Real Zaragoza 26/27',
          url: `${SITE_URL}/calendario`,
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="cal2-container cal2-container--top">
        <SyncBar onApple={handleApple} onGoogle={handleGoogle} onCopiar={handleCopiar} copiado={copiado} />
      </div>

      <div className="cal2-container">
        {loading ? (
          <p className="cal2-state">Cargando calendario…</p>
        ) : (
          <>
            <ProximoPartido partido={proximo} />

            <div className="cal2-seccion-header">
              <h2 className="cal2-titulo-seccion">Todos los partidos</h2>
              <div className="cal2-filtros">
                <button className={`cal2-filtro${filtro === 'todos' ? ' is-activo' : ''}`} onClick={() => setFiltro('todos')}>Toda la temporada</button>
                <button className={`cal2-filtro${filtro === 'local' ? ' is-activo' : ''}`} onClick={() => setFiltro('local')}>Local</button>
                <button className={`cal2-filtro${filtro === 'visitante' ? ' is-activo' : ''}`} onClick={() => setFiltro('visitante')}>Visitante</button>
              </div>
            </div>

            <div className="cal2-grupos">
              {grupos.map(g => (
                <GrupoMes
                  key={g.clave}
                  mes={g.mes}
                  partidos={g.partidos}
                  proximoId={proximo?.id}
                  abierto={abiertosEfectivo.has(g.clave)}
                  onToggle={() => toggleGrupo(g.clave)}
                  fichasRivales={fichasRivales}
                />
              ))}
            </div>

            <div className="cal2-imagenbar">
              <img src={POST_IMG} alt="" className="cal2-imagenbar__preview" />
              <div className="cal2-imagenbar__texto">
                <p className="cal2-imagenbar__titulo">¿Quieres el calendario en imagen?</p>
                <p className="cal2-imagenbar__desc">Descarga el calendario completo de la temporada 26/27 y compártelo donde quieras.</p>
              </div>
              <a href={POST_IMG} download="Calendario_RealZaragoza_2627.png" className="cal2-btn-descargar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Descargar imagen
              </a>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
