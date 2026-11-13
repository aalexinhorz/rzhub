import { useEffect, useMemo, useRef, useState } from 'react'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug, urlParaCanvas } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoConvocatoria, ordenPosicion } from '../../lib/graficoConvocatoria'
import { cargarProximoYUltimo } from '../../lib/partidoActual'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useGuardarLocal, useJugadores } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Convocatoria": se marcan los convocados de la plantilla del
// Real Zaragoza y salen sus tarjetas del Lineup ordenadas por posición. El
// rival y la jornada salen del próximo partido.
const INICIAL = { convocados: [], rivalId: '', antetitulo: '', titulo: '', pie: '', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }
const POSICIONES = ['Porteros', 'Defensas', 'Centrocampistas', 'Delanteros']
const fotos = {}

export default function GraficoConvocatoria({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_convocatoria', INICIAL))
  useGuardarLocal('redaccion_grafico_convocatoria', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const plantilla = useJugadores('real-zaragoza')
  const rivales = useEquiposGraficos().filter(e => e.id !== 'real-zaragoza')
  const rival = rivales.find(r => r.id === datos.rivalId) || null

  // Ordenados por posición y, dentro, por dorsal y nombre.
  const jugadores = useMemo(() => [...(plantilla || [])].sort((a, b) =>
    ordenPosicion(a.posicion) - ordenPosicion(b.posicion) || (a.dorsal ?? 99) - (b.dorsal ?? 99) || a.nombre.localeCompare(b.nombre, 'es')), [plantilla])

  // Sin rival elegido: el del próximo partido, con la jornada.
  useEffect(() => {
    cargarProximoYUltimo().then(({ proximo }) => {
      if (!proximo) return
      setDatos(d => (d.rivalId ? d : {
        ...d, rivalId: `nombre:${proximo.rival}`,
        antetitulo: proximo.jornada ? `Jornada ${proximo.jornada} · Primera Federación` : (proximo.competicion || '').split(' · ')[0],
      }))
    })
  }, [])
  // El próximo partido trae el nombre del rival; se cambia por su id en cuanto hay lista.
  const rivalEfectivo = rival || rivales.find(r => `nombre:${r.nombre}` === datos.rivalId) || null
  const nombreRival = rivalEfectivo?.nombre || ''

  const [imgs, setImgs] = useState({ cartas: [] })
  const elegidos = useMemo(() => jugadores.filter(j => datos.convocados.includes(j.id)), [jugadores, datos.convocados])
  useEffect(() => {
    let activo = true
    ;(async () => {
      const escudoZaragoza = await cargarImagen(encodeURI(escudoDe('Real Zaragoza')))
      const escudoRival = nombreRival ? await cargarImagen(encodeURI(escudoDe(nombreRival) || '')) : null
      const cartas = await Promise.all(elegidos.map(async j => {
        if (!(j.id in fotos)) fotos[j.id] = await cargarImagen(urlParaCanvas(j.foto), { cors: true })
        return { foto: fotos[j.id], escudo: escudoZaragoza, nombre: j.corto, esZaragoza: true }
      }))
      if (activo) setImgs({ cartas, escudoRival })
    })()
    return () => { activo = false }
  }, [elegidos, nombreRival])

  const recursos = useMemo(() => ({ logo, foto, ...imgs }), [logo, foto, imgs])
  const titulo = datos.titulo || (nombreRival ? `Convocatoria vs ${nombreRival.replace(/ (CF|FC|SD|CD|UD|AD|UE|CE)$/, '').replace(/^(CF|FC|SD|CD|UD|AD|UE|CE) /, '')}` : 'Convocatoria')
  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoConvocatoria(contextoGrafico(c), { ...datos, titulo }, recursos)
  }, [datos, titulo, recursos, fuentesListas])

  const alternar = id => setDatos(d => ({ ...d, convocados: d.convocados.includes(id) ? d.convocados.filter(x => x !== id) : [...d.convocados, id] }))

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-convocatoria-${slug(nombreRival)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partido</legend>
          <label className="graficos-campo">
            Rival
            <select value={rivalEfectivo?.id || ''} onChange={e => cambiar({ rivalId: e.target.value })}>
              <option value="">—</option>
              {rivales.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </label>
          <label className="graficos-campo">Antetítulo<input value={datos.antetitulo} onChange={e => cambiar({ antetitulo: e.target.value })} placeholder="Jornada 12 · Primera Federación" /></label>
          <label className="graficos-campo">Título<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} placeholder={titulo} /></label>
          <label className="graficos-campo">Pie (opcional)<input value={datos.pie} onChange={e => cambiar({ pie: e.target.value })} placeholder="P. ej. Los elegidos de Rubén Sellés" /></label>
        </fieldset>
        <fieldset>
          <legend>Convocados ({datos.convocados.length})</legend>
          <div className="graficos-fila">
            <button type="button" className="graficos-mini-boton" onClick={() => cambiar({ convocados: jugadores.map(j => j.id) })}>Marcar todos</button>
            <button type="button" className="graficos-mini-boton" onClick={() => cambiar({ convocados: [] })}>Ninguno</button>
          </div>
          {!plantilla && <p className="graficos-nota">Cargando plantilla…</p>}
          {POSICIONES.map((titulo, orden) => {
            const grupo = jugadores.filter(j => ordenPosicion(j.posicion) === orden)
            if (!grupo.length) return null
            return (
              <div key={titulo} className="graficos-convocados">
                <span className="graficos-convocados__titulo">{titulo}</span>
                {grupo.map(j => (
                  <label key={j.id} className="graficos-check">
                    <input type="checkbox" checked={datos.convocados.includes(j.id)} onChange={() => alternar(j.id)} />
                    {j.dorsal ? `${j.dorsal}. ` : ''}{j.nombre}
                  </label>
                ))}
              </div>
            )
          })}
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <p className="graficos-nota">La foto (p. ej. el entrenador) va a la derecha; si no subes ninguna, las tarjetas ocupan todo el ancho.</p>
      </form>
    </div>
  )
}
