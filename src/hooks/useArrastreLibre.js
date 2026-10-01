import { useCallback, useRef, useState } from 'react'

// Arrastre libre por Pointer Events en vez de @dnd-kit: en PlayerSlot.jsx
// el drag es un intercambio entre casillas FIJAS (el "transform" de
// dnd-kit es solo un efecto visual pasajero, la posición base nunca
// cambia bajo él). Aquí la posición base sí cambia en cada suelta, y
// eso descubrió un salto real: dnd-kit resetea su "transform" a null en
// cuanto isDragging pasa a false, y si ese reset se pinta un frame antes
// de que el estado del padre (la nueva x/y) llegue, la ficha se ve saltar
// hacia atrás y luego hacia delante. Con Pointer Events controlamos
// nosotros el orden: onPointerUp calcula el delta final, llama a
// onMover() y limpia el offset local EN LA MISMA función — un único
// commit de React, sin hueco para ese salto.
//
// `ancho`/`alto` son las dimensiones en px del lienzo LOCAL (antes de
// cualquier rotación visual) donde vive la ficha — ver PizarraCampo.jsx,
// que gira ese lienzo entero con CSS (90° a la derecha en escritorio,
// -90° a la izquierda en móvil) sin tocar las posiciones % de fichas/
// balón. `anguloRotacion` (en grados) avisa a este hook de que el
// delta en px que da el puntero está en pantalla (ya rotada), así que
// hay que pasarlo al espacio local SIN rotar (inversa de rotate())
// antes de aplicarlo — si no, la ficha "seguiría al ratón" en una
// dirección girada.
export default function useArrastreLibre({ onMover, ancho, alto, anguloRotacion = 0 }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [arrastrando, setArrastrando] = useState(false)
  const startRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })

  const onPointerDown = useCallback(e => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY }
    offsetRef.current = { x: 0, y: 0 }
    setOffset({ x: 0, y: 0 })
    setArrastrando(true)
  }, [])

  const onPointerMove = useCallback(e => {
    if (!startRef.current) return
    const dxPantalla = e.clientX - startRef.current.x
    const dyPantalla = e.clientY - startRef.current.y
    // Inversa de rotate(anguloRotacion): rotar el delta de pantalla por
    // -anguloRotacion para llevarlo al espacio local sin rotar.
    const rad = (anguloRotacion * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const next = {
      x: dxPantalla * cos + dyPantalla * sin,
      y: -dxPantalla * sin + dyPantalla * cos,
    }
    offsetRef.current = next
    setOffset(next)
  }, [anguloRotacion])

  const finalizar = useCallback(() => {
    if (!startRef.current) return
    const { x, y } = offsetRef.current
    if (ancho && alto && (x !== 0 || y !== 0)) {
      onMover((x / ancho) * 100, (y / alto) * 100)
    }
    startRef.current = null
    offsetRef.current = { x: 0, y: 0 }
    setOffset({ x: 0, y: 0 })
    setArrastrando(false)
  }, [ancho, alto, onMover])

  return {
    offset,
    arrastrando,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finalizar,
      onPointerCancel: finalizar,
    },
  }
}
