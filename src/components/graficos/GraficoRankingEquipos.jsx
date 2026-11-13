import { useEffect, useMemo, useRef, useState } from 'react'
import { ESCUDOS_CLUBS } from '../../lib/escudos'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarRankingEquipos, zonaFotoRecta } from '../../lib/graficoListas'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoDisposicion, CampoFoto, CamposTexto } from './comunes'

// Plantilla "Ránking de equipos": hasta 6 equipos con escudo y su número.
const EQUIPOS = [...new Set(['Real Zaragoza', ...Object.keys(ESCUDOS_CLUBS)])].sort((a, b) => a.localeCompare(b, 'es'))
const FILA = { equipo: '', nombre: '', valor: '' }
const INICIAL = {
  titulo: 'Racha de victorias', subtitulo: 'Primera Federación · Grupo 2', explicacion: '', credito: '',
  ajusteFoto: { zoom: 1, dx: 0, dy: 0 }, fotoDerecha: false, filas: [FILA, FILA, FILA, FILA, FILA, FILA],
}

export default function GraficoRankingEquipos({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_ranking_equipos', INICIAL))
  useGuardarLocal('redaccion_grafico_ranking_equipos', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const zona = useMemo(() => zonaFotoRecta(datos.fotoDerecha), [datos.fotoDerecha])
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(zona, datos.ajusteFoto, setAjuste)
  const [escudos, setEscudos] = useState([])

  const clave = datos.filas.map(f => f.equipo).join('|')
  useEffect(() => {
    let activo = true
    Promise.all(clave.split('|').map(e => cargarImagen(encodeURI(escudoDe(e) || ''))))
      .then(imgs => { if (activo) setEscudos(imgs.map(escudo => ({ escudo }))) })
    return () => { activo = false }
  }, [clave])
  const recursos = useMemo(() => ({ foto, logo, filas: escudos }), [foto, logo, escudos])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarRankingEquipos(contextoGrafico(c), datos, recursos)
  }, [datos, recursos, fuentesListas])

  const cambiarFila = (i, c) => setDatos(d => ({ ...d, filas: d.filas.map((f, j) => (j === i ? { ...f, ...c } : f)) }))

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-ranking-${slug(datos.titulo)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <CamposTexto datos={datos} cambiar={cambiar} ayudaExplicacion="Equipos del grupo con mejor racha de victorias en liga." />
        <fieldset>
          <legend>Equipos (el primero, en amarillo)</legend>
          <datalist id="graficos-equipos-ranking">{EQUIPOS.map(e => <option key={e} value={e} />)}</datalist>
          {datos.filas.map((f, i) => (
            <div className="graficos-fila" key={i}>
              <label className="graficos-campo">
                Equipo {i + 1}
                <input list="graficos-equipos-ranking" value={f.equipo} onChange={e => cambiarFila(i, { equipo: e.target.value, nombre: e.target.value })} />
              </label>
              <label className="graficos-campo">
                Nombre
                <input value={f.nombre} onChange={e => cambiarFila(i, { nombre: e.target.value })} />
              </label>
              <label className="graficos-campo graficos-campo--valor">
                Número
                <input value={f.valor} onChange={e => cambiarFila(i, { valor: e.target.value })} />
              </label>
            </div>
          ))}
          <p className="graficos-nota">Los que dejes vacíos no salen. El nombre se puede acortar (p. ej. "Villarreal B").</p>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <CampoDisposicion datos={datos} cambiar={cambiar} />
      </form>
    </div>
  )
}
