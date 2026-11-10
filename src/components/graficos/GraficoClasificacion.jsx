import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { calcularClasificacion } from '../../lib/clasificacion'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoClasificacion, nombreCorto } from '../../lib/graficoClasificacion'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "Clasificación": la tabla sale sola de liga_calendario (las
// mismas cuentas que la home) tras la jornada elegida, con lo que ha subido
// o bajado cada equipo respecto a la anterior.

const CLAVE_AJUSTES = 'redaccion_grafico_clasificacion'
const AJUSTES_INICIALES = { resaltar: 'Real Zaragoza', subtitulo: 'Primera Federación · Grupo 2', mostrarCambios: true }

function leerAjustes() {
  try { return { ...AJUSTES_INICIALES, ...JSON.parse(localStorage.getItem(CLAVE_AJUSTES)) } } catch { return AJUSTES_INICIALES }
}

function tablaTras(partidos, jornada) {
  const tabla = calcularClasificacion(partidos.filter(p => p.jornada <= jornada))
  if (jornada <= 1) return tabla.map(f => ({ ...f, cambio: 0 }))
  const antes = calcularClasificacion(partidos.filter(p => p.jornada <= jornada - 1))
  const posAntes = new Map(antes.map((f, i) => [f.equipo, i]))
  return tabla.map((f, i) => ({ ...f, cambio: (posAntes.get(f.equipo) ?? i) - i }))
}

export default function GraficoClasificacion({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [partidos, setPartidos] = useState(null)
  const [jornada, setJornada] = useState(null)
  const [ajustes, setAjustes] = useState(leerAjustes)
  const [escudos, setEscudos] = useState({})

  useEffect(() => {
    supabase.from('liga_calendario').select('jornada, fecha, equipo_local, equipo_visitante, goles_local, goles_visitante').order('jornada')
      .then(({ data }) => setPartidos(data || []))
  }, [])

  // Jornadas con algún resultado; por defecto la última.
  const jornadas = useMemo(() => [...new Set((partidos || []).filter(p => p.goles_local !== null).map(p => p.jornada))].sort((a, b) => a - b), [partidos])
  const jornadaElegida = jornada ?? jornadas[jornadas.length - 1] ?? null
  const tabla = useMemo(() => (partidos && jornadaElegida ? tablaTras(partidos, jornadaElegida) : []), [partidos, jornadaElegida])
  const incompleta = useMemo(() => (partidos || []).filter(p => p.jornada === jornadaElegida && p.goles_local === null).length, [partidos, jornadaElegida])

  const equipos = useMemo(() => tabla.map(f => f.equipo).sort((a, b) => nombreCorto(a).localeCompare(nombreCorto(b), 'es')), [tabla])
  const clave = equipos.join('|')
  useEffect(() => {
    if (!clave) return
    let activo = true
    const lista = clave.split('|')
    Promise.all(lista.map(e => cargarImagen(encodeURI(escudoDe(e) || ''))))
      .then(imgs => { if (activo) setEscudos(Object.fromEntries(lista.map((e, i) => [e, imgs[i]]))) })
    return () => { activo = false }
  }, [clave])

  useEffect(() => {
    try { localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes)) } catch { /* privado */ }
  }, [ajustes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    dibujarGraficoClasificacion(contextoGrafico(canvas), { tabla, jornada: jornadaElegida, ...ajustes }, { logo, escudos })
  }, [tabla, jornadaElegida, ajustes, logo, escudos, fuentesListas])

  const cambiar = cambios => setAjustes(a => ({ ...a, ...cambios }))

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas graficos-canvas--fijo" />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-clasificacion-j${jornadaElegida || ''}.png`} />
      </div>

      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Clasificación</legend>
          {!partidos ? <p className="graficos-nota">Cargando resultados…</p> : (
            <>
              <label className="graficos-campo">
                Tras la jornada
                <select value={jornadaElegida ?? ''} onChange={e => setJornada(Number(e.target.value))}>
                  {jornadas.map(j => <option key={j} value={j}>Jornada {j}</option>)}
                </select>
              </label>
              {incompleta > 0 && (
                <p className="graficos-nota graficos-nota--aviso">
                  Faltan {incompleta} {incompleta === 1 ? 'resultado' : 'resultados'} de esta jornada: la tabla no la cuenta entera.
                </p>
              )}
            </>
          )}
          <label className="graficos-campo">
            Equipo resaltado
            <select value={ajustes.resaltar} onChange={e => cambiar({ resaltar: e.target.value })}>
              <option value="">Ninguno</option>
              {equipos.map(e => <option key={e} value={e}>{nombreCorto(e)}</option>)}
            </select>
          </label>
          <label className="graficos-campo">
            Competición (debajo del título)
            <input value={ajustes.subtitulo} onChange={e => cambiar({ subtitulo: e.target.value })} />
          </label>
          <label className="graficos-check">
            <input type="checkbox" checked={ajustes.mostrarCambios} onChange={e => cambiar({ mostrarCambios: e.target.checked })} />
            Flechas de subida y bajada respecto a la jornada anterior
          </label>
        </fieldset>
      </form>
    </div>
  )
}
