import { useEffect, useMemo, useRef, useState } from 'react'
import { extractRival, isAway } from '../../lib/ics'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoCalendario, finDe } from '../../lib/graficoCalendario'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "Calendario": los partidos salen de /calendario.ics (el mismo
// del calendario público), que distingue las horas confirmadas de las que
// aún no lo están (eventos de día entero → "SIN HORA").

const CLAVE_AJUSTES = 'redaccion_grafico_calendario'
const hoyMadrid = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })

function etiquetaDe(summary) {
  const entre = (summary.match(/\(([^)]*)\)\s*$/) || [])[1] || ''
  const jornada = entre.match(/^J(\d+)/i)
  if (jornada) return `J${jornada[1]}`
  if (/copa/i.test(entre)) return 'COPA'
  if (/amistoso/i.test(entre)) return 'AMISTOSO'
  return ''
}

function partidosDelIcs(texto) {
  const out = []
  for (const bloque of texto.split('BEGIN:VEVENT').slice(1)) {
    const summary = (bloque.match(/SUMMARY:([^\r\n]+)/) || [])[1]?.trim()
    const dt = bloque.match(/DTSTART([^:\r\n]*):([^\r\n]+)/)
    if (!summary || !dt) continue
    const valor = dt[2].trim()
    let fecha
    let hora = null
    if (!valor.includes('T')) {
      fecha = `${valor.slice(0, 4)}-${valor.slice(4, 6)}-${valor.slice(6, 8)}` // sin hora confirmada
    } else if (valor.endsWith('Z')) {
      const d = new Date(`${valor.slice(0, 4)}-${valor.slice(4, 6)}-${valor.slice(6, 8)}T${valor.slice(9, 11)}:${valor.slice(11, 13)}:00Z`)
      fecha = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
      hora = d.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
    } else {
      fecha = `${valor.slice(0, 4)}-${valor.slice(4, 6)}-${valor.slice(6, 8)}` // TZID=Europe/Madrid
      hora = `${valor.slice(9, 11)}:${valor.slice(11, 13)}`
    }
    out.push({ fecha, hora, rival: extractRival(summary), enCasa: !isAway(summary), etiqueta: etiquetaDe(summary) })
  }
  return out
}

function leerAjustes() {
  try { return JSON.parse(localStorage.getItem(CLAVE_AJUSTES)) || {} } catch { return {} }
}

export default function GraficoCalendario({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [partidos, setPartidos] = useState(null)
  const [ajustes, setAjustes] = useState(() => ({ semanas: 5, titulo: 'Calendario', subtitulo: 'Todos los partidos del Real Zaragoza', ...leerAjustes() }))
  const [desde, setDesde] = useState(hoyMadrid)
  const [escudos, setEscudos] = useState({})

  useEffect(() => {
    fetch('/calendario.ics', { cache: 'no-store' }).then(r => r.text()).then(t => setPartidos(partidosDelIcs(t))).catch(() => setPartidos([]))
  }, [])

  useEffect(() => {
    try { localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes)) } catch { /* privado */ }
  }, [ajustes])

  const hasta = finDe(desde, ajustes.semanas)
  const enRango = useMemo(() => (partidos || []).filter(p => p.fecha >= desde && p.fecha <= hasta), [partidos, desde, hasta])
  const clave = [...new Set(enRango.map(p => p.rival))].join('|')

  useEffect(() => {
    if (!clave) return
    let activo = true
    const rivales = clave.split('|')
    Promise.all(rivales.map(r => cargarImagen(encodeURI(escudoDe(r) || ''))))
      .then(imgs => { if (activo) setEscudos(e => ({ ...e, ...Object.fromEntries(rivales.map((r, i) => [r, imgs[i]])) })) })
    return () => { activo = false }
  }, [clave])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) dibujarGraficoCalendario(contextoGrafico(canvas), { ...ajustes, desde, partidos: enRango }, { logo, escudos })
  }, [ajustes, desde, enRango, logo, escudos, fuentesListas])

  const cambiar = cambios => setAjustes(a => ({ ...a, ...cambios }))

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas graficos-canvas--fijo" />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-calendario-${desde}.png`} />
      </div>

      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Fechas</legend>
          <div className="graficos-fila">
            <label className="graficos-campo">
              Desde
              <input type="date" value={desde} onChange={e => e.target.value && setDesde(e.target.value)} />
            </label>
            <label className="graficos-campo">
              Semanas
              <select value={ajustes.semanas} onChange={e => cambiar({ semanas: Number(e.target.value) })}>
                {[4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          {partidos && (
            <p className="graficos-nota">
              {enRango.length ? `${enRango.length} ${enRango.length === 1 ? 'partido' : 'partidos'} en estas fechas` : 'No hay partidos en estas fechas.'}
              {enRango.some(p => !p.hora) && ' · Los que no tienen hora confirmada salen como "SIN HORA".'}
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">
            Título
            <input value={ajustes.titulo} onChange={e => cambiar({ titulo: e.target.value })} />
          </label>
          <label className="graficos-campo">
            Subtítulo
            <input value={ajustes.subtitulo} onChange={e => cambiar({ subtitulo: e.target.value })} />
          </label>
        </fieldset>
      </form>
    </div>
  )
}
