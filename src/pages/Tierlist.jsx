import { useState, useRef } from 'react'
import { DndContext, closestCenter, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core'
import usePlayers from '../hooks/usePlayers'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'
import html2canvas from 'html2canvas'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'

const TIERS_INICIALES = [
  { id: 'clave',        label: 'Jugador clave',  color: '#c0392b' },
  { id: 'se-queda',    label: 'Se queda',        color: '#27ae60' },
  { id: 'transferible', label: 'Transferible',   color: '#2980b9' },
  { id: 'cedido',      label: 'Cedido',          color: '#7f8c8d' },
  { id: 'venta',       label: 'Venta segura',    color: '#1a1a1a' },
]

function TierCard({ player, isDragging }) {
  const borderColor = player.isZaragoza ? '#0B4390' : '#f5c400'
  const footerColor = player.isZaragoza ? '#0B4390' : '#f5c400'
  return (
    <div style={{ width: '72px', borderRadius: '8px', border: `3px solid ${borderColor}`, overflow: 'hidden', background: 'white', opacity: isDragging ? 0.4 : 1, cursor: 'grab', userSelect: 'none', boxSizing: 'border-box', flexShrink: 0 }}>
      <div style={{ width: '100%', height: '68px', background: '#f5f5f5', position: 'relative', overflow: 'hidden' }}>
        <img crossOrigin="anonymous" src={player.photo || DEFAULT_PHOTO} alt={player.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%', display: 'block' }}
          onError={e => { e.target.src = DEFAULT_PHOTO }} />
        {player.teamLogo && (
          <img crossOrigin="anonymous" src={player.teamLogo} alt=""
            style={{ position: 'absolute', top: '3px', left: '3px', width: '14px', height: '14px', objectFit: 'contain', zIndex: 3, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
        )}
      </div>
      <div style={{ background: footerColor, padding: '3px 4px', textAlign: 'center' }}>
        <span style={{ color: '#ffffff', fontSize: '9px', fontFamily: 'Archivo, sans-serif', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
          {player.shortName || player.name}
        </span>
      </div>
    </div>
  )
}

function DraggableTierCard({ player }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ touchAction: 'none' }}>
      <TierCard player={player} isDragging={isDragging} />
    </div>
  )
}

function TierRow({ tier, players, onLabelChange }) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id })
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(tier.label)
  return (
    <div style={{ display: 'flex', marginBottom: '4px', minHeight: '100px', background: 'white', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
      <div style={{ width: '140px', minWidth: '140px', background: tier.color, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', cursor: 'pointer' }} onClick={() => setEditing(true)}>
        {editing ? (
          <input autoFocus value={label} onChange={e => setLabel(e.target.value)}
            onBlur={() => { setEditing(false); onLabelChange(tier.id, label) }}
            onKeyDown={e => e.key === 'Enter' && setEditing(false)}
            style={{ background: 'transparent', border: 'none', borderBottom: '2px solid white', color: 'white', fontFamily: 'sans-serif', fontWeight: '700', fontSize: '14px', textAlign: 'center', width: '100%', outline: 'none' }} />
        ) : (
          <span style={{ color: 'white', fontFamily: 'sans-serif', fontWeight: '700', fontSize: '14px', textAlign: 'center', lineHeight: '1.3' }}>{label}</span>
        )}
      </div>
      <div ref={setNodeRef} style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 12px', alignItems: 'center', background: isOver ? '#f0f4ff' : 'white', transition: 'background 0.15s', minHeight: '100px' }}>
        {players.map(p => <DraggableTierCard key={p.id} player={p} />)}
      </div>
    </div>
  )
}

function PoolZone({ primerEquipo, cantera }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  return (
    <div ref={setNodeRef} style={{ background: isOver ? '#f0f4ff' : '#f5f5f5', borderRadius: '8px', padding: '16px', transition: 'background 0.15s' }}>
      {primerEquipo.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>PRIMER EQUIPO</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {primerEquipo.map(p => <DraggableTierCard key={p.id} player={p} />)}
          </div>
        </div>
      )}
      {cantera.length > 0 && (
        <div>
          <p style={{ fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', color: '#999', marginBottom: '12px', letterSpacing: '1px' }}>CANTERA</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {cantera.map(p => <DraggableTierCard key={p.id} player={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Tierlist() {
  const { players, loading } = usePlayers()
  const { user } = useAuth()
  const [tiers, setTiers] = useState(TIERS_INICIALES)
  const [tierPlayers, setTierPlayers] = useState({})
  const [activePlayer, setActivePlayer] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [nombreGuardado, setNombreGuardado] = useState('Mi Tier List')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const tierlistRef = useRef(null)

  const zaragozaPlayers = players.filter(p => p.isZaragoza)
  const assignedIds = new Set(Object.values(tierPlayers).flat().map(p => p.id))
  const poolPlayers = zaragozaPlayers.filter(p => !assignedIds.has(p.id))
  const primerEquipo = poolPlayers.filter(p => !p.isCantera)
  const cantera = poolPlayers.filter(p => p.isCantera)

  function findPlayerLocation(playerId) {
    if (poolPlayers.find(p => p.id === playerId)) return 'pool'
    for (const tierId of Object.keys(tierPlayers)) {
      if (tierPlayers[tierId]?.find(p => p.id === playerId)) return tierId
    }
    return null
  }

  function handleDragStart(event) {
    const player = zaragozaPlayers.find(p => p.id === event.active.id)
    setActivePlayer(player || null)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActivePlayer(null)
    if (!over) return
    const playerId = active.id
    const destination = over.id
    const source = findPlayerLocation(playerId)
    if (source === destination) return
    const player = zaragozaPlayers.find(p => p.id === playerId)
    if (!player) return
    if (source !== 'pool') {
      setTierPlayers(prev => ({ ...prev, [source]: (prev[source] || []).filter(p => p.id !== playerId) }))
    }
    if (destination !== 'pool') {
      setTierPlayers(prev => ({ ...prev, [destination]: [...(prev[destination] || []), player] }))
    }
  }

  function handleReset() { setTierPlayers({}) }

  function handleLabelChange(tierId, newLabel) {
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, label: newLabel } : t))
  }

  function handleAddRow() {
    const newId = `tier-${Date.now()}`
    setTiers(prev => [...prev, { id: newId, label: 'Nueva fila', color: '#888888' }])
  }

  async function handleDownload() {
    if (!tierlistRef.current) return
    try {
      const canvas = await html2canvas(tierlistRef.current, { scale: 2, useCORS: true, backgroundColor: '#f5f5f5', logging: false })
      const link = document.createElement('a')
      link.download = 'tierlist-zaragoza.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) { console.error(e) }
  }

  function abrirModal() {
    if (!user) { alert('Debes iniciar sesión para guardar en la comunidad.'); return }
    const total = Object.values(tierPlayers).flat().length
    if (total === 0) { alert('Añade al menos un jugador a los tiers antes de guardar.'); return }
    setShowModal(true)
  }

  async function confirmarGuardar() {
    setGuardando(true)
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        name: user.user_metadata?.name || user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
      })
      const { error } = await supabase.from('tierlists').insert({
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email,
        tiers,
        tier_players: tierPlayers,
        title: nombreGuardado,
      })
      if (error) throw error
      setShowModal(false)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch (e) {
      console.error(e)
      alert('Error al guardar la tier list.')
    } finally {
      setGuardando(false)
    }
  }

  const nombreUsuario = user?.user_metadata?.name || user?.email || ''

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#999' }}>Cargando plantilla...</p>
    </div>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5', padding: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: '72px', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: 0 }}>
            Tier List
          </h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            {guardado ? (
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '24px', background: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif' }}>
                ✅ ¡Guardado en la comunidad!
              </div>
            ) : (
              <button onClick={abrirModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px', border: '2px solid #27ae60', background: 'white', color: '#27ae60', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
                💾 Guardar en comunidad
              </button>
            )}
            <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px', border: '2px solid #0B4390', background: 'white', color: '#0B4390', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
              ⬇ Descargar
            </button>
            <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px', border: '2px solid #ccc', background: 'white', color: '#666', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
              ↺ Restablecer
            </button>
          </div>
        </div>

        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div ref={tierlistRef} style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            {tiers.map(tier => (
              <TierRow key={tier.id} tier={tier} players={tierPlayers[tier.id] || []} onLabelChange={handleLabelChange} />
            ))}
            <button onClick={handleAddRow} style={{ width: '100%', padding: '10px', marginBottom: '16px', marginTop: '4px', border: '2px dashed #ccc', borderRadius: '4px', background: 'transparent', color: '#999', fontFamily: 'sans-serif', fontSize: '14px', cursor: 'pointer' }}>
              + Añadir fila
            </button>
            <PoolZone primerEquipo={primerEquipo} cantera={cantera} />
          </div>
          <DragOverlay>
            {activePlayer ? <TierCard player={activePlayer} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#0B4390', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', fontFamily: 'sans-serif' }}>Guardar Tier List</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ fontSize: '12px', color: '#888', fontFamily: 'sans-serif', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Nombre de la tier list
              </label>
              <input autoFocus value={nombreGuardado} onChange={e => setNombreGuardado(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmarGuardar()}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '10px 12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f5c400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0B4390' }}>
                    {nombreUsuario.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
                <span style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#555' }}>
                  Se publicará como <strong>{nombreUsuario.split(' ')[0]}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#666', fontSize: '14px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={confirmarGuardar} disabled={guardando || !nombreGuardado.trim()} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#0B4390', color: 'white', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: 'bold', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Guardando...' : '💾 Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}