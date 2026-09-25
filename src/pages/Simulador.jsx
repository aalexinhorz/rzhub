import { useEffect, useMemo, useRef, useState } from 'react'
import SEO from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './Simulador.css'

const LOCALSTORAGE_KEY = 'rzhub_simulador_edits_2026_27'
const EQUIPO_DESTACADO = 'Real Zaragoza'
const TOTAL_JORNADAS = 38

function cargarEdits() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function guardarEdits(edits) {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(edits))
  } catch { /* localStorage no disponible (modo privado, etc.) */ }
}

function EscudoEquipo({ nombre }) {
  const src = useEscudo(nombre)
  if (!src) return <span className="sim-escudo sim-escudo--placeholder">{nombre[0]}</span>
  return <img src={src} alt="" className="sim-escudo" onError={e => { e.target.style.display = 'none' }} />
}

function PartidoRow({ partido, valorLocal, valorVisitante, onChange, editable }) {
  const esZaragoza = partido.equipo_local === EQUIPO_DESTACADO || partido.equipo_visitante === EQUIPO_DESTACADO
  return (
    <div className={`sim-partido${esZaragoza ? ' sim-partido--destacado' : ''}`}>
      <span className="sim-partido__equipo">
        <span>{partido.equipo_local}</span>
        <EscudoEquipo nombre={partido.equipo_local} />
      </span>
      <div className="sim-partido__marcador">
        <input
          type="number" min="0" max="20" inputMode="numeric"
          className="sim-partido__input"
          value={valorLocal ?? ''}
          disabled={!editable}
          onChange={e => onChange('local', e.target.value)}
        />
        <span className="sim-partido__guion">-</span>
        <input
          type="number" min="0" max="20" inputMode="numeric"
          className="sim-partido__input"
          value={valorVisitante ?? ''}
          disabled={!editable}
          onChange={e => onChange('visitante', e.target.value)}
        />
      </div>
      <span className="sim-partido__equipo sim-partido__equipo--visitante">
        <EscudoEquipo nombre={partido.equipo_visitante} />
        <span>{partido.equipo_visitante}</span>
      </span>
    </div>
  )
}

function ZonaLeyenda() {
  return (
    <div className="sim-leyenda">
      <span><i className="sim-leyenda__dot sim-leyenda__dot--promocion" />Ascenso directo</span>
      <span><i className="sim-leyenda__dot sim-leyenda__dot--playoff" />Play-off de ascenso</span>
      <span><i className="sim-leyenda__dot sim-leyenda__dot--descenso" />Descenso</span>
    </div>
  )
}

function TablaClasificacion({ filas }) {
  return (
    <div className="sim-tabla-wrap">
      <table className="sim-tabla">
        <thead>
          <tr>
            <th className="sim-tabla__pos"></th>
            <th className="sim-tabla__equipo">Equipo</th>
            <th>PJ</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>GF</th>
            <th>GC</th>
            <th>DG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => {
            const pos = i + 1
            let zona = ''
            if (pos === 1) zona = 'sim-fila--promocion'
            else if (pos >= 2 && pos <= 5) zona = 'sim-fila--playoff'
            else if (pos >= 16) zona = 'sim-fila--descenso'
            const separador = pos === 2 || pos === 16
            const destacado = f.equipo === EQUIPO_DESTACADO
            return (
              <tr key={f.equipo} className={`${zona}${separador ? ' sim-fila--separador' : ''}${destacado ? ' sim-fila--destacada' : ''}`}>
                <td className="sim-tabla__pos">{pos}</td>
                <td className="sim-tabla__equipo">
                  <EscudoEquipo nombre={f.equipo} />
                  <span>{f.equipo}</span>
                </td>
                <td>{f.pj}</td>
                <td>{f.g}</td>
                <td>{f.e}</td>
                <td>{f.p}</td>
                <td>{f.gf}</td>
                <td>{f.gc}</td>
                <td>{f.dg > 0 ? `+${f.dg}` : f.dg}</td>
                <td className="sim-tabla__pts">{f.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Simulador() {
  const [calendario, setCalendario] = useState([])
  const [loading, setLoading] = useState(true)
  const [jornada, setJornada] = useState(1)
  const [edits, setEdits] = useState(cargarEdits)
  const pillsRef = useRef(null)

  useEffect(() => {
    supabase.from('liga_calendario').select('*').order('jornada').order('id').then(({ data }) => {
      const fixtures = data || []
      setCalendario(fixtures)
      const primeraSinJugar = fixtures.find(f => f.goles_local === null)
      setJornada(primeraSinJugar ? primeraSinJugar.jornada : 1)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const activo = pillsRef.current?.querySelector('.is-activa')
    activo?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [jornada, loading])

  function handleChange(partido, lado, valor) {
    setEdits(prev => {
      const actual = prev[partido.id] || {}
      const siguiente = { ...actual, [lado]: valor === '' ? undefined : Math.max(0, Math.min(20, Number(valor))) }
      const next = { ...prev, [partido.id]: siguiente }
      guardarEdits(next)
      return next
    })
  }

  function handleReiniciar() {
    setEdits({})
    guardarEdits({})
  }

  function cambiarJornada(delta) {
    setJornada(j => Math.min(TOTAL_JORNADAS, Math.max(1, j + delta)))
  }

  const partidosJornada = useMemo(
    () => calendario.filter(f => f.jornada === jornada),
    [calendario, jornada]
  )

  const clasificacion = useMemo(() => {
    const equipos = new Map()
    function equipoDe(nombre) {
      if (!equipos.has(nombre)) equipos.set(nombre, { equipo: nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 })
      return equipos.get(nombre)
    }
    calendario.forEach(f => {
      equipoDe(f.equipo_local)
      equipoDe(f.equipo_visitante)
      const edit = edits[f.id] || {}
      const golesLocal = f.goles_local ?? edit.local
      const golesVisitante = f.goles_visitante ?? edit.visitante
      if (golesLocal === undefined || golesVisitante === undefined || golesLocal === null || golesVisitante === null) return
      const local = equipoDe(f.equipo_local)
      const visitante = equipoDe(f.equipo_visitante)
      local.pj++; visitante.pj++
      local.gf += golesLocal; local.gc += golesVisitante
      visitante.gf += golesVisitante; visitante.gc += golesLocal
      if (golesLocal > golesVisitante) { local.g++; visitante.p++ }
      else if (golesLocal < golesVisitante) { visitante.g++; local.p++ }
      else { local.e++; visitante.e++ }
    })
    return [...equipos.values()]
      .map(t => ({ ...t, dg: t.gf - t.gc, pts: t.g * 3 + t.e }))
      .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.equipo.localeCompare(b.equipo))
  }, [calendario, edits])

  const hayEdits = Object.keys(edits).length > 0

  return (
    <div className="sim-page">
      <SEO
        title="Simulador de la temporada | Primera Federación Grupo 2 | RZ Hub"
        description="Simula los resultados de toda la temporada de 1ª RFEF Grupo 2 jornada a jornada y comprueba cómo quedaría la clasificación."
        path="/simulador"
      />

      <div className="sim-page__body">
        <div className="sim-page__container">
          <div className="sim-header">
            <div>
              <h1 className="sim-header__title">Simulador</h1>
              <p className="sim-header__subtitle">Pon los marcadores de cada jornada y mira cómo queda la clasificación</p>
            </div>
            {hayEdits && (
              <button className="sim-reiniciar" onClick={handleReiniciar}>↺ Reiniciar</button>
            )}
          </div>

          {loading ? (
            <p className="sim-page__state">Cargando calendario…</p>
          ) : (
            <div className="sim-grid">
              <div className="sim-left">
                <div className="sim-competicion">
                  <img src={ESCUDO_ZARAGOZA} alt="" className="sim-competicion__escudo" />
                  <div className="sim-competicion__texto">
                    <strong>Primera Federación</strong>
                    <span>Grupo 2 · 2026/2027</span>
                  </div>
                </div>

                <div className="sim-jornadas">
                  <button className="sim-jornadas__flecha" onClick={() => cambiarJornada(-1)} disabled={jornada === 1}>‹</button>
                  <div className="sim-jornadas__pills" ref={pillsRef}>
                    {Array.from({ length: TOTAL_JORNADAS }, (_, i) => i + 1).map(j => (
                      <button
                        key={j}
                        className={`sim-jornada-btn${jornada === j ? ' is-activa' : ''}`}
                        onClick={() => setJornada(j)}
                      >
                        {j}
                      </button>
                    ))}
                  </div>
                  <button className="sim-jornadas__flecha" onClick={() => cambiarJornada(1)} disabled={jornada === TOTAL_JORNADAS}>›</button>
                </div>

                <h3 className="sim-jornada-label">Jornada {jornada}</h3>

                <div className="sim-partidos">
                  {partidosJornada.map(partido => {
                    const edit = edits[partido.id] || {}
                    const editable = partido.goles_local === null
                    const valorLocal = partido.goles_local !== null ? partido.goles_local : edit.local
                    const valorVisitante = partido.goles_visitante !== null ? partido.goles_visitante : edit.visitante
                    return (
                      <PartidoRow
                        key={partido.id}
                        partido={partido}
                        valorLocal={valorLocal}
                        valorVisitante={valorVisitante}
                        editable={editable}
                        onChange={(lado, valor) => handleChange(partido, lado, valor)}
                      />
                    )
                  })}
                </div>
              </div>

              <div className="sim-right">
                <h2 className="sim-clasificacion__titulo">Clasificación</h2>
                <TablaClasificacion filas={clasificacion} />
                <ZonaLeyenda />
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
