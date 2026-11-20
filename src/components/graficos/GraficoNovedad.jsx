import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarImagen, contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarNovedad } from '../../lib/graficoNovedad'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Novedad web": una mejora de "Mejoras en la web" por imagen.
// Se elige del devlog (rellena título, texto, fecha y enlace) y se puede
// retocar todo a mano. La captura de la web es opcional.
const INICIAL = {
  etiqueta: 'Novedad en la web', fecha: '', titulo: '', texto: '', enlace: 'rzhub.es',
  ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}

// Sección de la web según de qué hable la mejora.
const RUTAS = [
  [/predicci/i, '/prediccion'], [/clasificaci/i, '/clasificacion'], [/comunidad/i, '/comunidad'],
  [/mi perfil/i, '/perfil'], [/cantera|femenino|juvenil|deportivo arag/i, '/cantera'], [/porra/i, '/porra'],
  [/line-?up|alineaci/i, '/lineup'], [/vestuario blanquillo|pr[oó]ximo partido/i, '/proximo-partido'],
  [/adivina/i, '/adivina-resultado'], [/zaragozle/i, '/zaragozle'], [/mercado|fichaje/i, '/mercado'],
  [/notas/i, '/notas'], [/calendario/i, '/calendario'], [/noticias/i, '/noticias'],
]
const enlaceDe = t => `rzhub.es${RUTAS.find(([re]) => re.test(t))?.[1] || ''}`

// "Comunidad: ahora puedes…" → título "Comunidad", texto "Ahora puedes…".
function partirMejora(t) {
  const i = t.indexOf(':')
  if (i > 0 && i < 45) {
    const resto = t.slice(i + 1).trim()
    return { titulo: t.slice(0, i).trim(), texto: resto.charAt(0).toUpperCase() + resto.slice(1) }
  }
  return { titulo: 'Novedad', texto: t }
}
const fechaLarga = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

export default function GraficoNovedad({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_novedad', INICIAL))
  useGuardarLocal('redaccion_grafico_novedad', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, ponerFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const recursos = useMemo(() => ({ foto, logo }), [foto, logo])
  const [mejoras, setMejoras] = useState([])
  const [avisoCaptura, setAvisoCaptura] = useState('')

  useEffect(() => {
    supabase.from('devlog').select('fecha, cambios, capturas').order('fecha', { ascending: false }).order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setMejoras((data || []).flatMap(d => (d.cambios || []).map((texto, i) => ({ fecha: d.fecha, texto, captura: d.capturas?.[i] || null })))))
  }, [])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarNovedad(contextoGrafico(c), datos, recursos)
  }, [datos, recursos, fuentesListas])

  const elegirMejora = i => {
    const m = mejoras[i]
    if (!m) return
    const enlace = m.captura?.ruta ? `rzhub.es${m.captura.ruta === '/' ? '' : m.captura.ruta}` : enlaceDe(m.texto)
    cambiar({ ...partirMejora(m.texto), fecha: fechaLarga(m.fecha), enlace })
    // La captura real de la web de esa mejora, si está guardada.
    if (!m.captura?.url) { setAvisoCaptura('Esta mejora no tiene captura guardada: sube una tú.'); return }
    setAvisoCaptura('Cargando la captura de la web…')
    cargarImagen(m.captura.url, { cors: true })
      .then(img => {
        if (!img) { setAvisoCaptura('No se ha podido cargar la captura: sube una tú.'); return }
        ponerFoto(img)
        setAvisoCaptura('Captura real de la web cargada. Arrástrala para encuadrarla o sube otra.')
      })
  }

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-novedad-${slug(datos.titulo)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Mejora</legend>
          <label className="graficos-campo">
            De "Mejoras en la web"
            <select value="" onChange={e => elegirMejora(Number(e.target.value))}>
              <option value="">— Elige una para rellenarla —</option>
              {mejoras.map((m, i) => (
                <option key={i} value={i}>{`${m.captura ? '📷 ' : ''}${m.fecha.slice(8, 10)}/${m.fecha.slice(5, 7)} · ${m.texto.length > 90 ? `${m.texto.slice(0, 90)}…` : m.texto}`}</option>
              ))}
            </select>
          </label>
          <p className="graficos-nota">Rellena el título (lo que va antes de los dos puntos), el texto, la fecha y el enlace. Luego retócalo a tu gusto.</p>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <div className="graficos-fila">
            <label className="graficos-campo">Etiqueta<input value={datos.etiqueta} onChange={e => cambiar({ etiqueta: e.target.value })} placeholder="Novedad en la web" /></label>
            <label className="graficos-campo">Fecha<input value={datos.fecha} onChange={e => cambiar({ fecha: e.target.value })} placeholder="20 de noviembre de 2026" /></label>
          </div>
          <label className="graficos-campo">Título<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} /></label>
          <label className="graficos-campo">Explicación<textarea rows={4} value={datos.texto} onChange={e => cambiar({ texto: e.target.value })} /></label>
          <label className="graficos-campo">Enlace (en el botón)<input value={datos.enlace} onChange={e => cambiar({ enlace: e.target.value })} placeholder="rzhub.es/comunidad" /></label>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} />
        <p className="graficos-nota">{avisoCaptura || 'Al elegir una mejora se pone sola la captura real de la web (si está guardada). También puedes subir otra. Sin captura, el texto sale más grande.'}</p>
      </form>
    </div>
  )
}
