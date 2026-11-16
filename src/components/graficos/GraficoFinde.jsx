import { useEffect, useMemo, useRef, useState } from 'react'
import { cargarImagen, contextoGrafico, ESCALA } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoFinde } from '../../lib/graficoFinde'
import { cargarPartidosFinde, diaCorto, soloFinDeSemana } from '../../lib/finDeSemana'
import { leerLocal, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "Fin de semana": los partidos de los próximos días del primer
// equipo, el filial, el juvenil y el femenino en un solo gráfico, sin foto.
// Salen solos (los mismos que la sección de la home); se puede quitar alguno
// y cambiar el título.
const INICIAL = { titulo: '', subtitulo: 'Primer equipo, filial, juvenil y femenino', excluidos: [] }

const cargarEscudo = src => (src ? cargarImagen(/^https?:/.test(src) ? src : encodeURI(src), { cors: /^https?:/.test(src) }) : Promise.resolve(null))

export default function GraficoFinde({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_finde', INICIAL))
  useGuardarLocal('redaccion_grafico_finde', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const [partidos, setPartidos] = useState(null)
  const [escudos, setEscudos] = useState({})

  useEffect(() => {
    let activo = true
    cargarPartidosFinde().then(async lista => {
      if (!activo) return
      setPartidos(lista)
      const pares = await Promise.all(lista.map(async p => [p.clave, {
        local: await cargarEscudo(p.escudoLocal), visitante: await cargarEscudo(p.escudoVisitante),
      }]))
      if (activo) setEscudos(Object.fromEntries(pares))
    })
    return () => { activo = false }
  }, [])

  const elegidos = useMemo(() => (partidos || []).filter(p => !datos.excluidos.includes(p.clave)), [partidos, datos.excluidos])
  const tituloAuto = elegidos.length && !soloFinDeSemana(elegidos) ? 'Esta semana' : 'Este fin de semana'
  const titulo = datos.titulo || tituloAuto
  const recursos = useMemo(() => ({ logo, escudos }), [logo, escudos])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoFinde(contextoGrafico(c), { ...datos, titulo }, elegidos, recursos)
  }) // tras cada render: el título automático se calcula en cada uno y dibujar es barato

  const alternar = clave => cambiar({
    excluidos: datos.excluidos.includes(clave) ? datos.excluidos.filter(c => c !== clave) : [...datos.excluidos, clave],
  })

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas graficos-canvas--fijo" />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo="rzhub-fin-de-semana.jpg" />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partidos</legend>
          {!partidos ? <p className="graficos-nota">Cargando partidos…</p> : !partidos.length ? (
            <p className="graficos-nota">No hay partidos de ningún equipo en los próximos 8 días.</p>
          ) : (
            <div className="graficos-convocados">
              {partidos.map(p => (
                <label key={p.clave} className="graficos-check">
                  <input type="checkbox" checked={!datos.excluidos.includes(p.clave)} onChange={() => alternar(p.clave)} />
                  {p.equipo}: {p.nombreLocal} - {p.nombreVisitante} ({diaCorto(p.fecha)}{p.hora ? ` ${p.hora}` : ''})
                </label>
              ))}
            </div>
          )}
          <p className="graficos-nota">Salen solos: el próximo partido de cada equipo en los próximos 8 días. Desmarca los que no quieras.</p>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">Título<input value={datos.titulo} placeholder={tituloAuto} onChange={e => cambiar({ titulo: e.target.value })} /></label>
          <label className="graficos-campo">Subtítulo<input value={datos.subtitulo} onChange={e => cambiar({ subtitulo: e.target.value })} placeholder="Vacío, no sale" /></label>
        </fieldset>
      </form>
    </div>
  )
}
