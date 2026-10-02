import useArrastreLibre from '../hooks/useArrastreLibre'

// Tirador de un extremo de la flecha: mismo arrastre libre que fichas/
// balón, pero solo mueve su propio punto (x1,y1 o x2,y2), nunca la
// flecha entera.
function Tirador({ xPct, yPct, ancho, alto, onMover, capturing }) {
  const { offset, handlers } = useArrastreLibre({ ancho, alto, onMover })
  if (capturing) return null
  return (
    <div
      {...handlers}
      style={{
        position: 'absolute',
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.9)',
        border: '2px solid #0B4390',
        cursor: 'grab',
        touchAction: 'none',
        zIndex: 6,
        userSelect: 'none',
      }}
    />
  )
}

// Flecha libre sobre el campo para indicar "quiero que este jugador
// vaya por aquí" — independiente de mover la ficha en sí. Línea +
// cabeza dibujadas a mano en un <svg> (mismo criterio de "nada de
// librerías externas" que ya sigue pizarraCanvas.js para el export),
// con un tirador arrastrable en cada extremo. Los puntos viven en el
// mismo sistema de % que fichas/balón, pero aquí se convierten a px
// reales (ancho/alto del campo) para que el triángulo de la cabeza no
// salga deformado por el aspect ratio del campo.
export default function PizarraFlecha({ flecha, ancho, alto, capturing, onMoverExtremo, onRemove }) {
  if (!ancho || !alto) return null
  const opacity = flecha.opacity ?? 1

  const x1 = (flecha.x1 / 100) * ancho
  const y1 = (flecha.y1 / 100) * alto
  const x2 = (flecha.x2 / 100) * ancho
  const y2 = (flecha.y2 / 100) * alto

  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const grosor = Math.max(2, ancho * 0.008)
  const cabezaLargo = Math.max(10, ancho * 0.035)
  const cabezaAncho = cabezaLargo * 0.7
  const baseX = x2 - ux * cabezaLargo
  const baseY = y2 - uy * cabezaLargo
  const px = -uy
  const py = ux
  const puntoA = `${x2},${y2}`
  const puntoB = `${baseX + (px * cabezaAncho) / 2},${baseY + (py * cabezaAncho) / 2}`
  const puntoC = `${baseX - (px * cabezaAncho) / 2},${baseY - (py * cabezaAncho) / 2}`

  const midXPct = (flecha.x1 + flecha.x2) / 2
  const midYPct = (flecha.y1 + flecha.y2) / 2

  return (
    <>
      <svg width={ancho} height={alto} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', opacity, zIndex: 1 }}>
        <line x1={x1} y1={y1} x2={baseX} y2={baseY} stroke="#ffffff" strokeWidth={grosor} strokeLinecap="round" />
        <polygon points={`${puntoA} ${puntoB} ${puntoC}`} fill="#ffffff" />
      </svg>
      <Tirador xPct={flecha.x1} yPct={flecha.y1} ancho={ancho} alto={alto} capturing={capturing}
        onMover={(dx2, dy2) => onMoverExtremo(flecha.id, 'inicio', dx2, dy2)} />
      <Tirador xPct={flecha.x2} yPct={flecha.y2} ancho={ancho} alto={alto} capturing={capturing}
        onMover={(dx2, dy2) => onMoverExtremo(flecha.id, 'fin', dx2, dy2)} />
      {!capturing && (
        <button
          onClick={() => onRemove(flecha.id)}
          style={{
            position: 'absolute', left: `${midXPct}%`, top: `${midYPct}%`,
            transform: 'translate(-50%, -50%)',
            width: '16px', height: '16px', borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '10px', lineHeight: '16px',
            padding: 0, cursor: 'pointer', zIndex: 6,
          }}
          aria-label="Quitar flecha"
        >✕</button>
      )}
    </>
  )
}
