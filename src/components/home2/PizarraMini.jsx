import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const INICIALES = [
  { id: 'a', x: 30, y: 70, tipo: 'rz' },
  { id: 'b', x: 70, y: 70, tipo: 'rz' },
  { id: 'c', x: 50, y: 48, tipo: 'rz' },
  { id: 'd', x: 50, y: 22, tipo: 'rz' },
  { id: 'r1', x: 38, y: 34, tipo: 'rival' },
  { id: 'r2', x: 64, y: 30, tipo: 'rival' },
  { id: 'balon', x: 56, y: 52, tipo: 'balon' },
]

// Mini pizarra en la home: fichas que se arrastran con ratón o dedo, como
// gancho para abrir La Pizarra completa.
export default function PizarraMini() {
  const [fichas, setFichas] = useState(INICIALES)
  const [tocada, setTocada] = useState(false)
  const campo = useRef(null)
  const arrastre = useRef(null)

  function empezar(e, id) {
    e.preventDefault()
    arrastre.current = id
    e.currentTarget.setPointerCapture(e.pointerId)
    setTocada(true)
  }

  function mover(e) {
    if (!arrastre.current || !campo.current) return
    const r = campo.current.getBoundingClientRect()
    const x = Math.min(95, Math.max(5, ((e.clientX - r.left) / r.width) * 100))
    const y = Math.min(94, Math.max(6, ((e.clientY - r.top) / r.height) * 100))
    setFichas(fs => fs.map(f => (f.id === arrastre.current ? { ...f, x, y } : f)))
  }

  function soltar() { arrastre.current = null }

  return (
    <div className="h2-card h2-pizarra">
      <div className="h2-card__cabecera">
        <span className="h2-card__eyebrow">Herramienta</span>
        <span className="h2-pill">Interactiva</span>
      </div>
      <h3 className="h2-card__titulo">La Pizarra</h3>
      <p className="h2-card__texto">{tocada ? '¡Eso es! Ahora monta la jugada entera y descárgala en vídeo.' : 'Arrastra las fichas: así de fácil se monta una jugada.'}</p>

      <div className="h2-pizarra__campo" ref={campo} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}>
        <img src="/CAMPO_PARA_WEB.svg" alt="" className="h2-pizarra__fondo" draggable="false" />
        {fichas.map(f => (
          <span
            key={f.id}
            role="button"
            aria-label={f.tipo === 'balon' ? 'Balón' : f.tipo === 'rival' ? 'Ficha rival' : 'Ficha del Real Zaragoza'}
            className={`h2-pizarra__ficha h2-pizarra__ficha--${f.tipo}`}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
            onPointerDown={e => empezar(e, f.id)}
          />
        ))}
      </div>

      <Link to="/pizarra" className="h2-boton h2-boton--amarillo h2-boton--bloque">Abrir La Pizarra →</Link>
    </div>
  )
}
