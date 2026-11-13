import { useEffect, useMemo, useRef, useState } from 'react'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoPorra, zonaFoto } from '../../lib/graficoPorra'
import { etiquetaPartido, useImagenesPartido, useProximosPartidos } from '../../lib/graficosPartidos'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "La Porra": anuncia la porra del próximo partido con sus escudos.
const TEXTO_PORRA = 'Pronostica el resultado y los goleadores del Real Zaragoza y **gana una camiseta a final de temporada**'
const INICIAL = { partidoId: '', titulo: 'La Porra', texto: TEXTO_PORRA, enlace: 'rzhub.es/porra', fotoIzquierda: false, credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }

export default function GraficoPorra({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_porra', INICIAL))
  useGuardarLocal('redaccion_grafico_porra', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const zona = useMemo(() => zonaFoto(datos.fotoIzquierda), [datos.fotoIzquierda])
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(zona, datos.ajusteFoto, setAjuste)
  const partidos = useProximosPartidos()
  const partido = partidos.find(p => p.id === datos.partidoId) || partidos[0] || null
  const imgs = useImagenesPartido(partido?.local, partido?.visitante, partido?.competicion)
  const recursos = useMemo(() => ({ foto, logo, ...imgs }), [foto, logo, imgs])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoPorra(contextoGrafico(c), { ...datos, zaragozaLocal: partido ? partido.zaragozaLocal : true }, recursos)
  }, [datos, partido, recursos, fuentesListas])

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-porra-${slug(partido ? `${partido.local} ${partido.visitante}` : '')}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partido</legend>
          <label className="graficos-campo">
            Partido
            <select value={partido?.id || ''} onChange={e => cambiar({ partidoId: e.target.value })}>
              {partidos.map(p => <option key={p.id} value={p.id}>{etiquetaPartido(p)}</option>)}
            </select>
          </label>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">Título<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} /></label>
          <label className="graficos-campo">
            Llamada
            <textarea rows={3} value={datos.texto} onChange={e => cambiar({ texto: e.target.value })} />
          </label>
          <p className="graficos-nota">Lo que va entre **dos asteriscos** sale en negrita.</p>
          <label className="graficos-campo">Pastilla<input value={datos.enlace} onChange={e => cambiar({ enlace: e.target.value })} /></label>
        </fieldset>
        <fieldset>
          <legend>Disposición</legend>
          <label className="graficos-campo">
            Foto
            <select value={datos.fotoIzquierda ? 'izquierda' : 'derecha'} onChange={e => cambiar({ fotoIzquierda: e.target.value === 'izquierda', ajusteFoto: { zoom: datos.ajusteFoto.zoom, dx: 0, dy: 0 } })}>
              <option value="derecha">A la derecha (texto a la izquierda)</option>
              <option value="izquierda">A la izquierda (texto a la derecha)</option>
            </select>
          </label>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
