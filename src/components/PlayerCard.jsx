import { useDraggable } from '@dnd-kit/core'

const positionColors = {
  POR: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
  DEF: { bg: '#e3f2fd', border: '#2196f3', text: '#0d47a1' },
  MED: { bg: '#e8f5e9', border: '#4caf50', text: '#1b5e20' },
  DEL: { bg: '#fce4ec', border: '#e91e63', text: '#880e4f' },
}

export default function PlayerCard({ player }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
  })

  const colors = positionColors[player.position] || { bg: '#f5f5f5', border: '#999', text: '#333' }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        marginBottom: '6px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: 'box-shadow 0.15s',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Número */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: colors.border,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        flexShrink: 0,
      }}>
        {player.number}
      </div>

      {/* Nombre */}
      <span style={{
        flex: 1,
        fontSize: '13px',
        fontFamily: 'sans-serif',
        fontWeight: '600',
        color: '#222',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {player.name}
      </span>

      {/* Badge posición */}
      <span style={{
        fontSize: '10px',
        fontWeight: 'bold',
        color: colors.text,
        fontFamily: 'sans-serif',
        letterSpacing: '0.5px',
      }}>
        {player.position}
      </span>
    </div>
  )
}