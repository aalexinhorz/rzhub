import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { nombreCorto } from '../../lib/graficoClasificacion'
import { ANCHO, ALTO, dibujarGraficoSuperordenador, dibujarSuperordenadorPartido, prediccionPartido } from '../../lib/graficoSuperordenador'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "El Superordenador": la última predicción de la liga
// (prediccion_liga, la misma de /prediccion). Dos modos: la temporada de un
// equipo (% de subir, play-off, descenso) o un partido del Real Zaragoza
// (1-X-2, resultados más probables y de dónde sale).

export default function GraficoSuperordenador({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [fila, setFila] = useState(undefined)
  const [equipo, setEquipo] = useState('Real Zaragoza')
  const [escudo, setEscudo] = useState(null)
  const [modo, setModo] = useState('partido')
  const [jornadaPartido, setJornadaPartido] = useState(null)
  const [escudosPartido, setEscudosPartido] = useState({})

  useEffect(() => {
    supabase.from('prediccion_liga').select('jornada, simulaciones, equipos, modelo, partidos_rz')
      .order('temporada', { ascending: false }).order('jornada', { ascending: false }).limit(1)
      .then(({ data }) => setFila(data?.[0] || null))
  }, [])

  const equipos = useMemo(() => (fila?.equipos || []).map(e => e.equipo).sort((a, b) => nombreCorto(a).localeCompare(nombreCorto(b), 'es')), [fila])
  const datosEquipo = (fila?.equipos || []).find(e => e.equipo === equipo)

  const partidosRz = fila?.partidos_rz || []
  const partido = partidosRz.find(x => x.jornada === jornadaPartido) || partidosRz[0] || null
  const eqDe = n => (fila?.equipos || []).find(e => e.equipo === n)
  const pred = useMemo(() => {
    if (!partido || !fila?.modelo) return null
    const l = (fila.equipos || []).find(e => e.equipo === partido.local)
    const v = (fila.equipos || []).find(e => e.equipo === partido.visitante)
    return l && v ? prediccionPartido(fila.modelo, l, v) : null
  }, [partido, fila])
  const claveEsc = partido ? `${partido.local}|${partido.visitante}` : ''

  useEffect(() => {
    if (!claveEsc) return
    let activo = true
    const [l, v] = claveEsc.split('|')
    Promise.all([l, v].map(n => cargarImagen(encodeURI(escudoDe(n) || '')).catch(() => null)))
      .then(([el, ev]) => { if (activo) setEscudosPartido({ local: el, visitante: ev }) })
    return () => { activo = false }
  }, [claveEsc])

  useEffect(() => {
    let activo = true
    cargarImagen(encodeURI(escudoDe(equipo) || '')).then(img => { if (activo) setEscudo(img) }).catch(() => {})
    return () => { activo = false }
  }, [equipo])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    if (modo === 'partido') {
      if (!pred) { contextoGrafico(c).clearRect(0, 0, ANCHO, ALTO); return }
      dibujarSuperordenadorPartido(contextoGrafico(c), {
        local: nombreCorto(partido.local), visitante: nombreCorto(partido.visitante), jornada: partido.jornada, tras: fila.jornada,
        simulaciones: fila.simulaciones, pj: eqDe('Real Zaragoza')?.pj, ventajaCasa: Math.exp(fila.modelo.h) - 1, pred,
      }, { logo, escudoLocal: escudosPartido.local, escudoVisitante: escudosPartido.visitante })
      return
    }
    dibujarGraficoSuperordenador(contextoGrafico(c), {
      equipo, nombre: nombreCorto(equipo), puestos: datosEquipo?.puestos || [], jornada: fila?.jornada, simulaciones: fila?.simulaciones,
    }, { logo, escudo })
  }, [modo, pred, partido, escudosPartido, equipo, datosEquipo, fila, logo, escudo, fuentesListas]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas graficos-canvas--fijo" />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={modo === 'partido' ? `rzhub-superordenador-j${partido?.jornada || ''}.jpg` : `rzhub-superordenador-${slug(nombreCorto(equipo))}-j${fila?.jornada || ''}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Qué enseñar</legend>
          {fila === undefined ? <p className="graficos-nota">Cargando la predicción…</p> : !fila ? <p className="graficos-nota">Todavía no hay predicción guardada.</p> : (
            <>
              <label className="graficos-campo">
                Gráfico
                <select value={modo} onChange={e => setModo(e.target.value)}>
                  <option value="partido">Un partido del Real Zaragoza</option>
                  <option value="temporada">Cómo acabará la temporada</option>
                </select>
              </label>
              {modo === 'partido' ? (
                <label className="graficos-campo">
                  Partido
                  <select value={partido?.jornada ?? ''} onChange={e => setJornadaPartido(Number(e.target.value))}>
                    {partidosRz.map(x => <option key={x.jornada} value={x.jornada}>J{x.jornada} · {nombreCorto(x.local)} - {nombreCorto(x.visitante)}</option>)}
                  </select>
                </label>
              ) : (
              <label className="graficos-campo">
                Equipo
                <select value={equipo} onChange={e => setEquipo(e.target.value)}>
                  {equipos.map(e => <option key={e} value={e}>{nombreCorto(e)}</option>)}
                </select>
              </label>
              )}
              <p className="graficos-nota">Sale la última predicción de la web (tras la jornada {fila.jornada}, {Number(fila.simulaciones || 0).toLocaleString('es-ES')} simulaciones). Se actualiza sola después de cada jornada.</p>
            </>
          )}
        </fieldset>
      </form>
    </div>
  )
}
