import { useEffect, useMemo, useRef, useState } from 'react'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoPartido } from '../../lib/graficoPartido'
import { etiquetaPartido, useImagenesPartido, useProximosPartidos } from '../../lib/graficosPartidos'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Partido": el lema entre los dos escudos, los datos del partido
// y una foto ancha. Todo sale del partido elegido; los campos vacíos usan
// el texto automático.
const INICIAL = { partidoId: '', titulo: '', linea1: '', linea2: '', linea3: '', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }

export default function GraficoPartido({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_partido', INICIAL))
  useGuardarLocal('redaccion_grafico_partido', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const partidos = useProximosPartidos()
  const partido = partidos.find(p => p.id === datos.partidoId) || partidos[0] || null
  const imgs = useImagenesPartido(partido?.local, partido?.visitante, partido?.competicion)
  const recursos = useMemo(() => ({ foto, logo, ...imgs }), [foto, logo, imgs])

  const auto = partido ? {
    titulo: partido.zaragozaLocal ? 'Ganar en casa' : 'Ganar fuera de casa',
    linea1: `${partido.local} - ${partido.visitante}`,
    linea2: partido.estadio,
    linea3: `${partido.ronda} - ${partido.hora}H`,
  } : { titulo: '', linea1: '', linea2: '', linea3: '' }
  const final = {
    titulo: datos.titulo || auto.titulo, linea1: datos.linea1 || auto.linea1,
    linea2: datos.linea2 || auto.linea2, linea3: datos.linea3 || auto.linea3,
  }

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoPartido(contextoGrafico(c), { ...datos, ...final, zaragozaLocal: partido ? partido.zaragozaLocal : true }, recursos)
  }) // tras cada render: los textos automáticos se calculan en cada uno y dibujar es barato

  const campo = (clave, etiqueta) => (
    <label className="graficos-campo">{etiqueta}<input value={datos[clave]} placeholder={auto[clave]} onChange={e => cambiar({ [clave]: e.target.value })} /></label>
  )

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-partido-${slug(final.linea1)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partido</legend>
          <label className="graficos-campo">
            Partido
            <select value={partido?.id || ''} onChange={e => cambiar({ partidoId: e.target.value, titulo: '', linea1: '', linea2: '', linea3: '' })}>
              {partidos.map(p => <option key={p.id} value={p.id}>{etiquetaPartido(p)}</option>)}
            </select>
          </label>
          {campo('titulo', 'Lema')}
          {campo('linea1', 'Partido')}
          {campo('linea2', 'Estadio')}
          {campo('linea3', 'Jornada y hora')}
          <p className="graficos-nota">Todo sale solo del partido; escribe en un campo para cambiar su texto.</p>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <p className="graficos-nota">La foto va ancha bajo los datos: por ejemplo, un jugador de cada equipo montados juntos.</p>
      </form>
    </div>
  )
}
