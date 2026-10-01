import useArrastreLibre from '../hooks/useArrastreLibre'

// Mismo mecanismo de arrastre libre que PizarraFicha.jsx — el balón es
// solo un token más sobre el campo, sin jugador asociado.
export default function PizarraBalon({ balon, size, onRemove, onMover, ancho, alto, anguloRotacion = 0, capturing }) {
  const { offset, arrastrando, handlers } = useArrastreLibre({ ancho, alto, anguloRotacion, onMover })
  const opacity = balon.opacity ?? 1
  const contrarrotacion = anguloRotacion ? `rotate(${-anguloRotacion}deg)` : 'none'

  return (
    <div
      {...(!capturing ? handlers : {})}
      style={{
        position: 'absolute',
        left: `${balon.x}%`,
        top: `${balon.y}%`,
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
        width: `${size}px`,
        height: `${size}px`,
        opacity,
        touchAction: 'none',
        cursor: capturing ? 'default' : 'grab',
        zIndex: arrastrando ? 999 : 4,
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', transform: contrarrotacion }}>
        {!capturing && (
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            onPointerDown={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: '-5px', right: '-5px', zIndex: 5,
              width: '14px', height: '14px', borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '9px', lineHeight: '14px',
              padding: 0, cursor: 'pointer',
            }}
            aria-label="Quitar balón"
          >✕</button>
        )}
        <img
          src="/balon.webp"
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))' }}
        />
      </div>
    </div>
  )
}
