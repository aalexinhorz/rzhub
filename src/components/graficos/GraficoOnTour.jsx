import { useEffect, useMemo, useRef, useState } from 'react'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoOnTour } from '../../lib/graficoOnTour'
import { desplazamientoDe } from '../../lib/desplazamientos'
import { etiquetaPartido, useImagenesPartido, useProximosPartidos } from '../../lib/graficosPartidos'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "On Tour": para los desplazamientos. Ciudad, estadio, km, puesto
// entre los desplazamientos de la temporada y el mapa salen solos del
// partido fuera de casa elegido; la foto del estadio se sube.
const INICIAL = { partidoId: '', antetitulo: '', ciudad: '', estadio: '', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }

export default function GraficoOnTour({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_on_tour', INICIAL))
  useGuardarLocal('redaccion_grafico_on_tour', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const partidos = useProximosPartidos().filter(p => !p.zaragozaLocal)
  const partido = partidos.find(p => p.id === datos.partidoId) || partidos[0] || null
  const imgs = useImagenesPartido(partido?.rival, null, partido?.competicion)
  const recursos = useMemo(() => ({ foto, logo, escudoRival: imgs.escudoLocal }), [foto, logo, imgs])

  const auto = partido ? {
    antetitulo: `${partido.ronda} · ${partido.fecha} · ${partido.hora}`,
    ciudad: partido.ciudad,
    estadio: partido.estadio,
  } : { antetitulo: '', ciudad: '', estadio: '' }
  const final = { antetitulo: datos.antetitulo || auto.antetitulo, ciudad: datos.ciudad || auto.ciudad, estadio: datos.estadio || auto.estadio }

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoOnTour(contextoGrafico(c), { ...datos, ...final, rival: partido?.rival || '' }, recursos)
  }) // tras cada render: los textos automáticos se calculan en cada uno y dibujar es barato

  const destino = partido ? desplazamientoDe(partido.rival) : null
  const campo = (clave, etiqueta) => (
    <label className="graficos-campo">{etiqueta}<input value={datos[clave]} placeholder={auto[clave]} onChange={e => cambiar({ [clave]: e.target.value })} /></label>
  )

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-on-tour-${slug(final.ciudad)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Desplazamiento</legend>
          <label className="graficos-campo">
            Partido fuera de casa
            <select value={partido?.id || ''} onChange={e => cambiar({ partidoId: e.target.value, antetitulo: '', ciudad: '', estadio: '' })}>
              {partidos.map(p => <option key={p.id} value={p.id}>{etiquetaPartido(p)}</option>)}
            </select>
          </label>
          {campo('ciudad', 'Ciudad')}
          {campo('estadio', 'Estadio')}
          {campo('antetitulo', 'Antetítulo')}
          <p className="graficos-nota">
            {destino
              ? `Km, puesto entre los desplazamientos y mapa salen de la página On Tour (${destino.km} km, ${destino.num}.º más corto).`
              : 'Este partido no está entre los desplazamientos de liga de la página On Tour: no salen km ni mapa.'}
          </p>
        </fieldset>
        <CampoFoto foto={foto} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <p className="graficos-nota">Sube una foto del estadio: va arriba y se funde con el azul.</p>
      </form>
    </div>
  )
}
