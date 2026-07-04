import { useDraggable } from '@dnd-kit/core'

export default function PlayerCard({ player }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '72px',
        borderRadius: '8px',
        border: '2px solid #0B4390',
        background: 'linear-gradient(180deg, #c8d8f0 0%, #ffffff 60%)',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        overflow: 'hidden',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.25)' : '0 2px 6px rgba(0,0,0,0.12)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Escudo equipo */}
      {player.teamLogo && (
        <img
          src={player.teamLogo}
          alt=""
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            width: '16px',
            height: '16px',
            objectFit: 'contain',
            zIndex: 2,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
          }}
        />
      )}

      {/* Foto jugador */}
      <div style={{ width: '100%', height: '64px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(180deg, #c8d8f0 0%, #e8f0fa 100%)' }}>
        <img
          crossOrigin="anonymous"
          src={player.photo || 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'}
          alt={player.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 10%',
            display: 'block',
          }}
          onError={e => {
            e.target.src = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'
          }}
        />

        {/* Bandera */}
        {player.flag && (
          <img
            src={player.flag}
            alt=""
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '4px',
              width: '18px',
              height: '12px',
              objectFit: 'cover',
              zIndex: 2,
              borderRadius: '2px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        )}
      </div>

      {/* Nombre */}
      <div style={{
        width: '100%',
        background: '#0B4390',
        padding: '3px 4px',
        textAlign: 'center',
        boxSizing: 'border-box',
      }}>
        <span style={{
          color: 'white',
          fontSize: '9px',
          fontWeight: '700',
          fontFamily: 'Archivo, sans-serif',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
          letterSpacing: '0.3px',
        }}>
          {player.shortName || player.name}
        </span>
      </div>
    </div>
  )
}