import { useState, useEffect } from 'react'
import useArrastreLibre from '../hooks/useArrastreLibre'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

// Mismo truco que PlayerSlot.jsx: background-image en vez de <img
// objectFit>, para que la foto salga igual de encuadrada al exportar
// a Canvas 2D (drawImage no respeta object-fit).
function FichaFoto({ src, alt }) {
  const [bg, setBg] = useState(src || DEFAULT_PHOTO)
  useEffect(() => { setBg(src || DEFAULT_PHOTO) }, [src])
  return (
    <div role="img" aria-label={alt} style={{
      width: '100%', height: '100%', backgroundColor: '#152445',
      backgroundImage: `url("${bg}")`, backgroundSize: 'cover', backgroundPosition: '50% 15%',
    }}>
      <img crossOrigin="anonymous" src={bg} alt="" style={{ display: 'none' }} onError={() => setBg(DEFAULT_PHOTO)} />
    </div>
  )
}

// Ficha de posición libre: se coloca en cualquier x/y% del campo y se
// arrastra a cualquier otro punto, sin casillas ni colisión — ver
// src/hooks/useArrastreLibre.js para por qué no usa @dnd-kit aquí.
export default function PizarraFicha({ ficha, size, onRemove, onMover, ancho, alto, anguloRotacion = 0, capturing }) {
  const { offset, arrastrando, handlers } = useArrastreLibre({ ancho, alto, anguloRotacion, onMover })
  // El punto donde se posiciona la ficha vive en el espacio girado del
  // campo (ver PizarraCampo.jsx), pero la tarjeta en sí debe leerse en
  // vertical de siempre — se contrarrota solo el contenido visual, no
  // el punto de anclaje.
  const contrarrotacion = anguloRotacion ? `rotate(${-anguloRotacion}deg)` : 'none'

  const borderColor = ficha.isZaragoza ? '#0B4390' : '#f5c400'
  const nameBarBg = borderColor
  const nameTextColor = ficha.isZaragoza ? '#ffffff' : '#000000'
  const opacity = ficha.opacity ?? 1

  return (
    <div
      {...(!capturing ? handlers : {})}
      style={{
        position: 'absolute',
        left: `${ficha.x}%`,
        top: `${ficha.y}%`,
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
        width: `${size}px`,
        opacity,
        touchAction: 'none',
        cursor: capturing ? 'default' : 'grab',
        zIndex: arrastrando ? 999 : 3,
        userSelect: 'none',
      }}
    >
      <div style={{
        borderRadius: '6px',
        border: `2px solid ${borderColor}`,
        overflow: 'hidden',
        boxShadow: arrastrando ? '0 14px 28px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
        background: '#eef4fc',
        position: 'relative',
        transform: contrarrotacion,
      }}>
        {!capturing && (
          <button
            onClick={e => { e.stopPropagation(); onRemove(ficha.id) }}
            onPointerDown={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: '2px', right: '2px', zIndex: 4,
              width: '16px', height: '16px', borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '10px', lineHeight: '16px',
              padding: 0, cursor: 'pointer',
            }}
            aria-label="Quitar ficha"
          >✕</button>
        )}
        <div style={{ width: '100%', height: `${size * 1.05}px` }}>
          <FichaFoto src={ficha.foto} alt={ficha.nombre} />
        </div>
        <div style={{ background: nameBarBg, padding: '0 3px', textAlign: 'center', height: '16px', lineHeight: '16px', overflow: 'hidden' }}>
          <span style={{
            color: nameTextColor, fontSize: `${Math.max(7, size * 0.13)}px`, fontFamily: 'Archivo, sans-serif', fontWeight: '700',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%',
          }}>
            {ficha.nombreCorto || ficha.nombre}
          </span>
        </div>
      </div>
    </div>
  )
}
