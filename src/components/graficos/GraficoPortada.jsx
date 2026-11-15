import { useEffect, useMemo, useRef, useState } from 'react'
import { cargarImagen, contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, MAX_RECORTES, ZONA_FOTO, cajaRecorte, colocarRecortes, dibujarGraficoPortada } from '../../lib/graficoPortada'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Portada": título enorme libre (CONVOCADOS, FICHAJES, ONCE…),
// subtítulo, foto de fondo y hasta 5 recortes de jugadores (PNG sin fondo)
// que se arrastran sobre la vista previa. Lo que no está encima de un
// recorte mueve la foto de fondo.
const INICIAL = {
  tema: 'claro', pastilla: 'Oficial', titulo: 'Convocados', subtitulo: 'Por el Real Zaragoza para el partido',
  credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}

let siguienteId = 1

export default function GraficoPortada({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_portada', INICIAL))
  useGuardarLocal('redaccion_grafico_portada', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers: handlersFoto, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const [recortes, setRecortes] = useState([])
  const arrastre = useRef(null)

  const recursos = useMemo(() => ({ foto, logo, recortes }), [foto, logo, recortes])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoPortada(contextoGrafico(c), datos, recursos)
  }, [datos, recursos])

  const añadirRecortes = async e => {
    const archivos = Array.from(e.target.files || []).slice(0, MAX_RECORTES - recortes.length)
    e.target.value = ''
    if (!archivos.length) return
    const imgs = (await Promise.all(archivos.map(a => cargarImagen(URL.createObjectURL(a))))).filter(Boolean)
    setRecortes(rs => {
      const total = Math.min(MAX_RECORTES, rs.length + imgs.length)
      const pos = colocarRecortes(total)
      const nuevos = imgs.slice(0, total - rs.length).map((img, i) => ({ id: siguienteId++, img, ...pos[rs.length + i] }))
      return [...rs, ...nuevos]
    })
  }
  const cambiarRecorte = (id, c) => setRecortes(rs => rs.map(r => (r.id === id ? { ...r, ...c } : r)))
  const quitarRecorte = id => setRecortes(rs => rs.filter(r => r.id !== id))
  const alFrente = id => setRecortes(rs => [...rs.filter(r => r.id !== id), rs.find(r => r.id === id)])
  const recolocar = () => setRecortes(rs => { const pos = colocarRecortes(rs.length); return rs.map((r, i) => ({ ...r, ...pos[i] })) })

  // Arrastrar: primero el recorte de más arriba bajo el dedo; si no hay, la foto.
  const punto = e => {
    const escala = ANCHO / e.currentTarget.clientWidth
    return { x: e.nativeEvent.offsetX * escala, y: e.nativeEvent.offsetY * escala, escala }
  }
  const handlers = {
    onPointerDown: e => {
      const p = punto(e)
      const r = [...recortes].reverse().find(r => {
        const c = cajaRecorte(r)
        return p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h
      })
      if (!r) { handlersFoto.onPointerDown(e); return }
      e.currentTarget.setPointerCapture(e.pointerId)
      arrastre.current = { id: r.id, cx: e.clientX, cy: e.clientY, x: r.x, yBase: r.yBase }
    },
    onPointerMove: e => {
      const a = arrastre.current
      if (!a) { handlersFoto.onPointerMove(e); return }
      const escala = ANCHO / e.currentTarget.clientWidth
      cambiarRecorte(a.id, { x: a.x + (e.clientX - a.cx) * escala, yBase: a.yBase + (e.clientY - a.cy) * escala })
    },
    onPointerUp: e => { arrastre.current = null; handlersFoto.onPointerUp(e) },
    onPointerCancel: e => { arrastre.current = null; handlersFoto.onPointerCancel(e) },
  }

  const campo = (clave, etiqueta, placeholder) => (
    <label className="graficos-campo">{etiqueta}<input value={datos[clave]} placeholder={placeholder} onChange={e => cambiar({ [clave]: e.target.value })} /></label>
  )

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-${slug(datos.titulo)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Texto</legend>
          {campo('pastilla', 'Pastilla (encima del título)', 'Vacío, no sale')}
          {campo('titulo', 'Título en grande')}
          {campo('subtitulo', 'Subtítulo')}
          <label className="graficos-campo">
            Tema
            <select value={datos.tema} onChange={e => cambiar({ tema: e.target.value })}>
              <option value="claro">Claro (título azul)</option>
              <option value="azul">Azul (título amarillo)</option>
            </select>
          </label>
        </fieldset>
        <fieldset>
          <legend>Jugadores recortados</legend>
          {recortes.length < MAX_RECORTES && (
            <label className="graficos-archivo">
              <input type="file" accept="image/png,image/webp" multiple onChange={añadirRecortes} />
              <span>{recortes.length ? 'Añadir más recortes' : 'Subir recortes (PNG sin fondo)'}</span>
            </label>
          )}
          {recortes.map((r, i) => (
            <div key={r.id} className="graficos-recorte">
              <img src={r.img.src} alt="" />
              <label className="graficos-campo">
                Tamaño {i + 1}
                <input type="range" min="300" max="1200" step="5" value={r.alto} onChange={e => cambiarRecorte(r.id, { alto: Number(e.target.value) })} />
              </label>
              <button type="button" className="graficos-mini-boton" onClick={() => alFrente(r.id)} disabled={i === recortes.length - 1}>Al frente</button>
              <button type="button" className="graficos-mini-boton" onClick={() => quitarRecorte(r.id)}>Quitar</button>
            </div>
          ))}
          {recortes.length > 1 && <button type="button" className="graficos-mini-boton" onClick={recolocar}>Recolocar todos</button>}
          <p className="graficos-nota">
            Hasta {MAX_RECORTES}. Arrástralos en la vista previa para colocarlos; pueden asomar por encima del panel.
            Para sacar un recorte: en el iPhone, mantén pulsado el jugador en la foto → «Copiar» y pégalo en una nota o guárdalo como imagen.
          </p>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <p className="graficos-nota">La foto de fondo va en el panel de abajo (la grada, el estadio…). Sin foto, sale un degradado azul.</p>
      </form>
    </div>
  )
}
