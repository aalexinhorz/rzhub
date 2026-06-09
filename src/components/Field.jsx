import { useRef, useState } from 'react'
import domtoimage from 'dom-to-image-more'
import PlayerSlot from './PlayerSlot'

export default function Field({ slotsLayout, slots, subs, teamName, setTeamName, formation, allPlayers, onSelectPlayer, onRemovePlayer, onSelectSub, onRemoveSub, onAddCustomPlayer }) {
  const fieldRef = useRef(null)
  const [editingName, setEditingName] = useState(false)

  async function handleDownload() {
    if (!fieldRef.current) return
    try {
      const el = fieldRef.current
      const rect = el.getBoundingClientRect()
      const actualWidth = rect.width
      const actualHeight = rect.height
      const scale = Math.max(1080 / actualWidth, 4)

      const dataUrl = await domtoimage.toPng(el, {
        scale: scale,
        bgcolor: '#ffffff',
        width: actualWidth,
        height: actualHeight,
      })
      const link = document.createElement('a')
      link.download = `${teamName || 'alineacion'}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error al descargar:', error)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '620px', flexShrink: 0 }}>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px', border: '2px solid #0B4390', background: 'white', color: '#0B4390', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
          ⬇ Descargar
        </button>
      </div>

      <div
        ref={fieldRef}
        style={{
          width: '100%',
          aspectRatio: '540 / 675',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <img src="/CAMPO_PARA_WEB.svg" alt="campo" crossOrigin="anonymous"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 20px 6px 20px', zIndex: 10 }}>
          {editingName ? (
            <input autoFocus value={teamName} onChange={e => setTeamName(e.target.value)}
              onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(20px, 5vw, 38px)', color: '#0B4390', border: 'none', borderBottom: '2px solid #0B4390', outline: 'none', background: 'transparent', width: '100%', letterSpacing: '0px', lineHeight: '1' }} />
          ) : (
            <h2 onClick={() => setEditingName(true)} title="Clic para editar"
              style={{ color: '#0B4390', fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(20px, 5vw, 38px)', margin: 0, letterSpacing: '0px', cursor: 'text', userSelect: 'none', lineHeight: '1' }}>
              {teamName}
            </h2>
          )}
          <div style={{ display: 'inline-block', background: '#0B4390', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 10px', borderRadius: '4px', marginTop: '5px', fontFamily: 'sans-serif' }}>
            {formation}
          </div>
        </div>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}>
          {slotsLayout.map(slot => (
            <PlayerSlot
              key={slot.id}
              slot={slot}
              player={slots[slot.id] || null}
              sub1={subs[slot.id]?.[0] || null}
              sub2={subs[slot.id]?.[1] || null}
              allPlayers={allPlayers}
              onSelectPlayer={onSelectPlayer}
              onRemovePlayer={onRemovePlayer}
              onSelectSub={onSelectSub}
              onRemoveSub={onRemoveSub}
              onAddCustomPlayer={onAddCustomPlayer}
            />
          ))}
        </div>
      </div>
    </div>
  )
}