import { useRef, useState } from 'react'
import PizarraFicha from './PizarraFicha'
import PizarraBalon from './PizarraBalon'

function scaleByFieldWidth(fieldWidth, min, max, refMin = 320, refMax = 620) {
  if (!fieldWidth) return max
  const t = Math.min(1, Math.max(0, (fieldWidth - refMin) / (refMax - refMin)))
  return min + (max - min) * t
}

// Mismo campo de siempre (mismo SVG, mismas posiciones % de fichas y
// balón, mismo export a Canvas — nada de eso cambia), en vertical,
// igual que el Lineup Builder — sin ningún giro.
export default function PizarraCampo({ fichas, onMoverFicha, onRemoveFicha, balon, onMoverBalon, onRemoveBalon, capturing, campoRef: externalRef }) {
  const localRef = useRef(null)
  const outerRef = externalRef || localRef
  const [tamano, setTamano] = useState({ width: 0, height: 0 })

  function medirCampo(el) {
    outerRef.current = el
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setTamano({ width, height })
    })
    observer.observe(el)
  }

  const fichaSize = scaleByFieldWidth(tamano.width, 34, 66)
  const balonSize = fichaSize * 0.45

  return (
    <div ref={medirCampo} style={{ width: '100%', aspectRatio: '540 / 675', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <img src="/CAMPO_PARA_WEB.svg" alt="campo" crossOrigin="anonymous"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }}>
        {fichas.map(ficha => (
          <PizarraFicha
            key={ficha.id}
            ficha={ficha}
            size={fichaSize}
            ancho={tamano.width}
            alto={tamano.height}
            capturing={capturing}
            onRemove={onRemoveFicha}
            onMover={(dx, dy) => onMoverFicha(ficha.id, dx, dy)}
          />
        ))}
        {balon && (
          <PizarraBalon
            balon={balon}
            size={balonSize}
            ancho={tamano.width}
            alto={tamano.height}
            capturing={capturing}
            onRemove={onRemoveBalon}
            onMover={onMoverBalon}
          />
        )}
      </div>
    </div>
  )
}
