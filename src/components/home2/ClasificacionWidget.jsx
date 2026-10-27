import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../hooks/useAuth'
import { useEscudo } from '../../lib/escudos'
import { calcularClasificacion, zonaDe } from '../../lib/clasificacion'

const EQUIPO = 'Real Zaragoza'
const REFRESCO_MS = 60_000
const sinComillas = n => (n || '').replace(/[""]/g, '').trim()

function Escudo({ nombre }) {
  const src = useEscudo(nombre)
  return src ? <img src={src} alt="" className="h2-tabla__escudo" /> : <span className="h2-tabla__escudo h2-tabla__escudo--vacio">{nombre[0]}</span>
}

// Filas del resumen: el top 5 (ascenso + playoff) y el Real Zaragoza con
// sus vecinos si está más abajo.
function filasResumen(tabla) {
  const idx = tabla.findIndex(f => f.equipo === EQUIPO)
  const indices = new Set([0, 1, 2, 3, 4])
  if (idx > 4) [idx - 1, idx, idx + 1].forEach(i => { if (i >= 0 && i < tabla.length) indices.add(i) })
  return [...indices].sort((a, b) => a - b)
}

export default function ClasificacionWidget() {
  const [tabla, setTabla] = useState(null)
  const [jornada, setJornada] = useState(null)
  const [completa, setCompleta] = useState(false)

  useEffect(() => {
    let activo = true
    function cargar() {
      supabase.from('liga_calendario').select('*').order('jornada').then(({ data }) => {
        if (!activo || !data) return
        setTabla(calcularClasificacion(data))
        const jugadas = data.filter(f => f.goles_local !== null).map(f => f.jornada)
        setJornada(jugadas.length ? Math.max(...jugadas) : null)
      })
    }
    // En móvil la pestaña suele quedarse en segundo plano: al volver, refresca.
    function alVolver() { if (document.visibilityState === 'visible') cargar() }
    cargar()
    const id = setInterval(cargar, REFRESCO_MS)
    document.addEventListener('visibilitychange', alVolver)
    return () => { activo = false; clearInterval(id); document.removeEventListener('visibilitychange', alVolver) }
  }, [])

  if (!tabla) return <div className="h2-card h2-tabla h2-tabla--cargando">Cargando clasificación…</div>

  const indices = completa ? tabla.map((_, i) => i) : filasResumen(tabla)

  return (
    <div className="h2-card h2-tabla">
      <div className="h2-card__cabecera">
        <span className="h2-card__eyebrow">Primera Federación · Grupo 2</span>
        {jornada && <span className="h2-pill">Tras la J{jornada}</span>}
      </div>
      <h3 className="h2-card__titulo">Clasificación</h3>

      <table className="h2-tabla__tabla">
        <thead>
          <tr>
            <th className="h2-tabla__pos">#</th>
            <th className="h2-tabla__equipo">Equipo</th>
            <th>PJ</th>
            <th className="h2-tabla__ocultable">DG</th>
            <th className="h2-tabla__ocultable">Forma</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {indices.map((i, k) => {
            const f = tabla[i]
            const pos = i + 1
            const salto = k > 0 && indices[k - 1] !== i - 1
            return (
              <tr key={f.equipo} className={`h2-tabla__fila h2-tabla__fila--${zonaDe(pos) || 'media'}${f.equipo === EQUIPO ? ' is-rz' : ''}${salto ? ' is-salto' : ''}`}>
                <td className="h2-tabla__pos">{pos}</td>
                <td className="h2-tabla__equipo"><span className="h2-tabla__equipo-in"><Escudo nombre={sinComillas(f.equipo)} /><span>{sinComillas(f.equipo)}</span></span></td>
                <td>{f.pj}</td>
                <td className="h2-tabla__ocultable">{f.dg > 0 ? `+${f.dg}` : f.dg}</td>
                <td className="h2-tabla__ocultable">
                  <span className="h2-tabla__forma">
                    {f.forma.map((r, j) => <span key={j} className={`h2-forma h2-forma--${r}`} title={r === 'V' ? 'Victoria' : r === 'E' ? 'Empate' : 'Derrota'} />)}
                  </span>
                </td>
                <td className="h2-tabla__pts">{f.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="h2-tabla__leyenda">
        <span><i className="h2-tabla__dot h2-tabla__dot--ascenso" />Ascenso</span>
        <span><i className="h2-tabla__dot h2-tabla__dot--playoff" />Play-off</span>
        <span><i className="h2-tabla__dot h2-tabla__dot--descenso" />Descenso</span>
      </div>

      <div className="h2-tabla__acciones">
        <button type="button" className="h2-boton h2-boton--borde" onClick={() => setCompleta(v => !v)}>
          {completa ? 'Ver resumen' : 'Ver tabla completa'}
        </button>
        <Link to="/simulador" className="h2-boton h2-boton--texto">Simula el final de liga →</Link>
      </div>
    </div>
  )
}
