import { useEffect, useMemo, useRef, useState } from 'react'
import { ESCUDOS_CLUBS } from '../../lib/escudos'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarBarras } from '../../lib/graficoBarras'
import { leerLocal, useEquiposGraficos, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "Barras": ránking de hasta 8 equipos a todo el ancho, con la
// barra más larga cuanto mayor es el número. Una fila puede ir en amarillo.
const FILA = { equipo: '', nombre: '', valor: '' }
const INICIAL = {
  cabecera: 'Datos de Primera Federación en la temporada 2026/27',
  titulo: 'Goles a favor', subtitulo: 'Grupo 2 · Primera Federación', seccion: 'Ránking',
  filas: Array.from({ length: 8 }, () => ({ ...FILA })), destacada: -1,
}

export default function GraficoBarras({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_barras', INICIAL))
  useGuardarLocal('redaccion_grafico_barras', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const equipos = useEquiposGraficos()
  const opciones = useMemo(() => [...new Set(['Real Zaragoza', ...Object.keys(ESCUDOS_CLUBS), ...equipos.map(e => e.nombre)])]
    .sort((a, b) => a.localeCompare(b, 'es')), [equipos])

  const clave = datos.filas.map(f => f.equipo).join('|')
  const [escudos, setEscudos] = useState({ clave: '', lista: [] })
  useEffect(() => {
    let activo = true
    Promise.all(clave.split('|').map(e => {
      if (!e) return null
      const src = escudoDe(e) || equipos.find(x => x.nombre === e)?.escudo
      return src ? cargarImagen(encodeURI(src)) : null
    })).then(lista => { if (activo) setEscudos({ clave, lista }) })
    return () => { activo = false }
  }, [clave, equipos])
  const recursos = useMemo(() => ({ logo, escudos: escudos.clave === clave ? escudos.lista : [] }), [logo, escudos, clave])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarBarras(contextoGrafico(c), datos, recursos)
  }, [datos, recursos, fuentesListas])

  const cambiarFila = (i, c) => setDatos(d => ({ ...d, filas: d.filas.map((f, j) => (j === i ? { ...f, ...c } : f)) }))
  const elegirEquipo = (i, equipo) => {
    const anterior = datos.filas[i]
    // El nombre sigue al equipo salvo que se haya cambiado a mano.
    const nombre = !anterior.nombre || anterior.nombre === anterior.equipo ? equipo : anterior.nombre
    const c = { equipo, nombre }
    setDatos(d => ({
      ...d,
      filas: d.filas.map((f, j) => (j === i ? { ...f, ...c } : f)),
      // El Real Zaragoza sale en amarillo solo si no se ha elegido otra.
      destacada: d.destacada === -1 && equipo === 'Real Zaragoza' ? i : d.destacada,
    }))
  }
  // Ordena de mayor a menor por el número.
  const ordenar = () => {
    const num = v => { const n = Number(String(v).replace(/\.(?=\d{3}\b)/g, '').replace(',', '.').replace(/[^\d.-]/g, '')); return Number.isFinite(n) && v !== '' ? n : -Infinity }
    const marcada = datos.filas[datos.destacada]
    const filas = [...datos.filas].sort((a, b) => num(b.valor) - num(a.valor))
    cambiar({ filas, destacada: marcada ? filas.indexOf(marcada) : -1 })
  }

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-${slug(datos.titulo)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">Arriba (pequeño)<input value={datos.cabecera} onChange={e => cambiar({ cabecera: e.target.value })} /></label>
          <label className="graficos-campo">Título<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} /></label>
          <label className="graficos-campo">Subtítulo (en amarillo)<input value={datos.subtitulo} onChange={e => cambiar({ subtitulo: e.target.value })} /></label>
          <label className="graficos-campo">Sección (abajo)<input value={datos.seccion} onChange={e => cambiar({ seccion: e.target.value })} placeholder="Ránking" /></label>
        </fieldset>
        <fieldset>
          <legend>Equipos (hasta 8)</legend>
          <datalist id="graficos-equipos-barras">{opciones.map(e => <option key={e} value={e} />)}</datalist>
          {datos.filas.map((f, i) => (
            <div className="graficos-fila" key={i}>
              <label className="graficos-campo">
                Equipo {i + 1}
                <input list="graficos-equipos-barras" value={f.equipo} onChange={e => elegirEquipo(i, e.target.value)} />
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
          <div className="graficos-fila graficos-fila--equipo">
            <label className="graficos-campo">
              En amarillo
              <select value={datos.destacada} onChange={e => cambiar({ destacada: Number(e.target.value) })}>
                <option value={-1}>Ninguna</option>
                {datos.filas.map((f, i) => (f.nombre || f.equipo) && <option key={i} value={i}>{f.nombre || f.equipo}</option>)}
              </select>
            </label>
            <button type="button" className="graficos-mini-boton" onClick={ordenar}>Ordenar de mayor a menor</button>
          </div>
          <p className="graficos-nota">La barra es más larga cuanto mayor es el número. Los que dejes vacíos no salen y el nombre se puede acortar.</p>
        </fieldset>
      </form>
    </div>
  )
}
