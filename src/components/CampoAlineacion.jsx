import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formations } from '../lib/formations'
import './CampoAlineacion.css'

const FOTO_DEFECTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

// Mismo escalado que PlayerSlot (Lineup Builder): las cartas crecen con el
// ancho real del campo entre 320 y 620 px.
function escala(ancho, min, max, refMin = 320, refMax = 620) {
  const t = Math.min(1, Math.max(0, (ancho - refMin) / (refMax - refMin)))
  return min + (max - min) * t
}

function Carta({ hueco, j }) {
  const contenido = (
    <>
      <span className="carta-al__foto" style={{ backgroundImage: `url("${j.foto || FOTO_DEFECTO}")` }}>
        {j.nota != null && <span className="carta-al__nota">{j.nota.toFixed(1)}</span>}
        {j.salida != null && <span className="carta-al__salida">↓{j.salida}'</span>}
      </span>
      <span className={`carta-al__nombre${j.esZaragoza === false ? ' carta-al__nombre--externo' : ''}`}>{j.nombre}</span>
      {(j.suplentes || []).map((s, i) => (
        <span key={i} className={`carta-al__suplente${s.esZaragoza === false ? ' carta-al__suplente--externo' : ''}`}>
          <span className="carta-al__suplente-foto" style={{ backgroundImage: `url("${s.foto || FOTO_DEFECTO}")` }} />
          <span className="carta-al__suplente-nombre">{s.nombre}</span>
        </span>
      ))}
    </>
  )
  const clase = `carta-al${j.esZaragoza === false ? ' carta-al--externo' : ''}`
  const estilo = { left: `${hueco.x}%`, top: `${hueco.y}%` }
  return j.href
    ? <Link to={j.href} className={clase} style={estilo}>{contenido}</Link>
    : <span className={clase} style={estilo}>{contenido}</span>
}

// Campo de solo lectura con las cartas del Lineup Builder.
// `jugadores`: { [idHueco]: { nombre, foto, esZaragoza, href?, nota?, salida?, suplentes? } }
// con los ids de hueco de src/lib/formations.js (GK, DEF1…, MID1…, FWD1…).
export default function CampoAlineacion({ formacion, titulo, jugadores }) {
  const ref = useRef(null)
  const [ancho, setAncho] = useState(480)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const huecos = formations[formacion]
  if (!huecos) return null

  const vars = {
    '--carta-w': `${escala(ancho, 38, 78)}px`,
    '--carta-foto-h': `${escala(ancho, 40, 80)}px`,
    '--carta-nombre-fs': `${escala(ancho, 6.5, 9)}px`,
    '--carta-sub-fs': `${escala(ancho, 5, 7)}px`,
    // Título y formación: mismas proporciones que la imagen exportada del
    // Lineup Builder (src/lib/lineupCanvas.js, lienzo de 540 px de ancho).
    '--k': ancho / 540,
  }

  return (
    <div className="campo-al" ref={ref} style={vars}>
      <img src="/CAMPO_PARA_WEB.svg" alt="" className="campo-al__fondo" />
      <div className="campo-al__cabecera">
        {titulo && <span className="campo-al__titulo">{titulo}</span>}
        <span className="campo-al__formacion">{formacion}</span>
      </div>
      {huecos.map(h => jugadores[h.id] ? <Carta key={h.id} hueco={h} j={jugadores[h.id]} /> : null)}
    </div>
  )
}
