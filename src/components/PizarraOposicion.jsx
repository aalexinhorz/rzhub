import useArrastreLibre from '../hooks/useArrastreLibre'

// Ficha genérica de oposición: mismo mecanismo de arrastre libre que
// PizarraBalon.jsx, pero sin imagen — solo un círculo relleno amarillo
// para marcar "aquí hay un rival" sin asociarlo a un jugador real.
export default function PizarraOposicion({ token, size, onRemove, onMover, ancho, alto, capturing }) {
  const { offset, arrastrando, handlers } = useArrastreLibre({ ancho, alto, onMover })
  const opacity = token.opacity ?? 1

  return (
    <div
      {...(!capturing ? handlers : {})}
      style={{
        position: 'absolute',
        left: `${token.x}%`,
        top: `${token.y}%`,
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
        width: `${size}px`,
        height: `${size}px`,
        opacity,
        touchAction: 'none',
        cursor: capturing ? 'default' : 'grab',
        zIndex: arrastrando ? 999 : 2,
        userSelect: 'none',
      }}
    >
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: '#f5c400', border: '2px solid #8a6800',
        boxShadow: arrastrando ? '0 14px 28px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.35)',
      }} />
      {!capturing && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(token.id) }}
          onPointerDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: '-5px', right: '-5px', zIndex: 5,
            width: '14px', height: '14px', borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '9px', lineHeight: '14px',
            padding: 0, cursor: 'pointer',
          }}
          aria-label="Quitar ficha de oposición"
        >✕</button>
      )}
    </div>
  )
}
