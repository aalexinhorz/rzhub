import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarImagen, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ALTO_FOTO, dibujarGraficoNoticia, encajeFoto } from '../../lib/graficoNoticia'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "Noticia": foto, etiqueta, titular (con *palabras* en
// amarillo), entradilla y fuente. Se puede rellenar con una noticia ya
// publicada en la web. El borrador (sin la foto) se guarda en el navegador.

const CLAVE_BORRADOR = 'redaccion_grafico_noticia'
const INICIAL = { etiqueta: 'Noticia', titular: '', entradilla: '', fuente: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }
const ETIQUETAS = ['Noticia', 'Última hora', 'Oficial', 'Mercado', 'Rumor', 'Crónica', 'Previa', 'Comunicado']

function leerBorrador() {
  try { return JSON.parse(localStorage.getItem(CLAVE_BORRADOR)) || null } catch { return null }
}

export default function GraficoNoticia({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const arrastre = useRef(null)
  const [datos, setDatos] = useState(() => ({ ...INICIAL, ...leerBorrador() }))
  const [foto, setFoto] = useState(null)
  const [noticias, setNoticias] = useState([])
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    supabase.from('noticias').select('slug, titulo, excerpt, imagen_url, og_imagen').eq('publicada', true)
      .order('created_at', { ascending: false }).limit(40)
      .then(({ data }) => setNoticias(data || []))
  }, [])

  useEffect(() => {
    try { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos)) } catch { /* privado */ }
  }, [datos])

  const recursos = useMemo(() => ({ foto, logo }), [foto, logo])
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) dibujarGraficoNoticia(canvas.getContext('2d'), datos, recursos)
  }, [datos, recursos, fuentesListas])

  const cambiar = cambios => setDatos(d => ({ ...d, ...cambios }))

  const elegirFoto = e => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    cargarImagen(URL.createObjectURL(archivo)).then(img => { setFoto(img); cambiar({ ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }) })
  }

  const rellenarCon = async slugNoticia => {
    const n = noticias.find(x => x.slug === slugNoticia)
    if (!n) return
    cambiar({ titular: n.titulo || '', entradilla: n.excerpt || '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } })
    setAviso('')
    const url = n.imagen_url || n.og_imagen
    if (!url) { setFoto(null); return }
    const img = await cargarImagen(url, { cors: true })
    setFoto(img)
    if (!img) setAviso('La foto de esa noticia no se puede usar aquí: súbela a mano.')
  }

  // Arrastrar la foto (zona de arriba) para encuadrarla.
  const empezarArrastre = e => {
    if (!foto || e.nativeEvent.offsetY / e.currentTarget.clientHeight > ALTO_FOTO / ALTO) return
    e.currentTarget.setPointerCapture(e.pointerId)
    arrastre.current = { x: e.clientX, y: e.clientY, ...datos.ajusteFoto }
  }
  const arrastrar = e => {
    const a = arrastre.current
    if (!a || !foto) return
    const escala = ANCHO / e.currentTarget.clientWidth
    const ef = encajeFoto(foto, a.zoom, a.dx + (e.clientX - a.x) * escala, a.dy + (e.clientY - a.y) * escala)
    cambiar({ ajusteFoto: { zoom: a.zoom, dx: ef.x - (ANCHO - ef.w) / 2, dy: ef.y - (ALTO_FOTO - ef.h) / 2 } })
  }
  const soltar = () => { arrastre.current = null }

  const empezarDeCero = () => {
    if (!window.confirm('¿Vaciar todos los campos?')) return
    setFoto(null)
    setDatos(INICIAL)
  }

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas
          ref={canvasRef} width={ANCHO} height={ALTO} className="graficos-canvas"
          onPointerDown={empezarArrastre} onPointerMove={arrastrar} onPointerUp={soltar} onPointerCancel={soltar}
        />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-noticia-${slug(datos.titular).slice(0, 40)}.png`} />
      </div>

      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        {noticias.length > 0 && (
          <fieldset>
            <legend>Desde la web</legend>
            <label className="graficos-campo">
              Rellenar con una noticia publicada
              <select value="" onChange={e => rellenarCon(e.target.value)}>
                <option value="">Elige una noticia…</option>
                {noticias.map(n => <option key={n.slug} value={n.slug}>{n.titulo}</option>)}
              </select>
            </label>
            {aviso && <p className="graficos-nota graficos-nota--aviso">{aviso}</p>}
          </fieldset>
        )}

        <fieldset>
          <legend>Foto</legend>
          <label className="graficos-archivo">
            <input type="file" accept="image/*" onChange={elegirFoto} />
            <span>{foto ? 'Cambiar foto' : 'Subir foto'}</span>
          </label>
          {foto && (
            <label className="graficos-campo">
              Zoom
              <input
                type="range" min="1" max="3" step="0.01" value={datos.ajusteFoto.zoom}
                onChange={e => cambiar({ ajusteFoto: { ...datos.ajusteFoto, zoom: Number(e.target.value) } })}
              />
            </label>
          )}
        </fieldset>

        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">
            Etiqueta
            <input list="graficos-etiquetas" value={datos.etiqueta} onChange={e => cambiar({ etiqueta: e.target.value })} />
            <datalist id="graficos-etiquetas">{ETIQUETAS.map(t => <option key={t} value={t} />)}</datalist>
          </label>
          <label className="graficos-campo">
            Titular
            <textarea rows={2} value={datos.titular} onChange={e => cambiar({ titular: e.target.value })} placeholder="¡Buenas noticias! *Jardí* vuelve con el grupo" />
          </label>
          <p className="graficos-nota">Pon *asteriscos* alrededor de las palabras que quieras en amarillo.</p>
          <label className="graficos-campo">
            Entradilla
            <textarea rows={3} value={datos.entradilla} onChange={e => cambiar({ entradilla: e.target.value })} />
          </label>
          <label className="graficos-campo">
            Fuente (opcional)
            <input value={datos.fuente} onChange={e => cambiar({ fuente: e.target.value })} placeholder="Heraldo de Aragón" />
          </label>
        </fieldset>

        <button type="button" className="graficos-reset" onClick={empezarDeCero}>Empezar de cero</button>
      </form>
    </div>
  )
}
