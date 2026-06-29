import { useState, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'

function PlayerPhoto({ src, alt }) {
  return (
    <img crossOrigin="anonymous" src={src || DEFAULT_PHOTO} alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%', display: 'block' }}
      onError={e => { e.target.src = DEFAULT_PHOTO }} />
  )
}

function SubRow({ player, onClick }) {
  const bgColor = player.isZaragoza ? '#0B4390' : '#f5c400'
  const textColor = player.isZaragoza ? '#ffffff' : '#000000'
  const imgSize = 'clamp(14px, 3.5vw, 22px)'
  const fontSize = 'clamp(6px, 1.5vw, 8px)'
  return (
    <div onClick={onClick} title="Clic para quitar" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 3px', background: bgColor, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: imgSize, height: imgSize, flexShrink: 0, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        <img crossOrigin="anonymous" src={player.photo || DEFAULT_PHOTO} alt={player.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 10%', display: 'block' }}
          onError={e => { e.target.src = DEFAULT_PHOTO }} />
      </div>
      <span style={{ fontSize: fontSize, fontFamily: 'Arial, sans-serif', fontWeight: '600', color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
        {player.shortName || player.name}
      </span>
    </div>
  )
}

function PlayerRow({ player, onClick, selected }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: selected ? '#e8f0fb' : 'transparent' }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#f5f5f5' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', border: `2px solid ${player.isZaragoza ? '#0B4390' : '#f5c400'}` }}>
        <PlayerPhoto src={player.photo} alt={player.name} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px', color: '#222' }}>{player.name}</div>
        <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#888' }}>{player.team} · {player.position}</div>
      </div>
    </div>
  )
}

function SubSearch({ label, pending, search, results, onSearchChange, onSelect, onRemove, onAddCustom }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '16px' }}>
      <div style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <input placeholder="Buscar suplente..." value={search} onChange={e => onSearchChange(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', background: '#f9f9f9' }}
        onKeyDown={e => { if (e.key === 'Enter' && results.length === 0 && search.trim().length >= 2) onAddCustom(search) }}
      />
      {pending && search.length < 2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '8px 12px', background: '#f0f0f0', borderRadius: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${pending.isZaragoza ? '#0B4390' : '#f5c400'}` }}>
            <PlayerPhoto src={pending.photo} alt={pending.name} />
          </div>
          <span style={{ fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px', flex: 1 }}>{pending.name}</span>
          <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}
      {search.length >= 2 && (
        <div style={{ marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {results.map(p => (
            <PlayerRow key={p.id} player={p} onClick={() => onSelect(p)} selected={pending?.id === p.id} />
          ))}
          {results.length === 0 && (
            <div onClick={() => onAddCustom(search)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: '2px dashed #f5c400', background: '#fffbe6', marginTop: '4px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0', flexShrink: 0 }}>
                <PlayerPhoto src={DEFAULT_PHOTO} alt="" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px', color: '#222' }}>{search.trim()}</div>
                <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#f5a000' }}>➕ Añadir como jugador externo</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PlayerSlot({ slot, player, sub1, sub2, allPlayers, onSelectPlayer, onRemovePlayer, onSelectSub, onRemoveSub, onAddCustomPlayer }) {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [pendingSub1, setPendingSub1] = useState(null)
  const [pendingSub2, setPendingSub2] = useState(null)
  const [searchSub1, setSearchSub1] = useState('')
  const [searchSub2, setSearchSub2] = useState('')
  const [resultsSub1, setResultsSub1] = useState([])
  const [resultsSub2, setResultsSub2] = useState([])
  const { setNodeRef, isOver } = useDroppable({ id: slot.id })

  useEffect(() => {
    if (search.length < 2) { setResults([]); return }
    setResults(allPlayers.filter(p => p.name.toLowerCase().includes(search.toLowerCase())))
  }, [search, allPlayers])

  useEffect(() => {
    if (searchSub1.length < 2) { setResultsSub1([]); return }
    setResultsSub1(allPlayers.filter(p => p.name.toLowerCase().includes(searchSub1.toLowerCase())))
  }, [searchSub1, allPlayers])

  useEffect(() => {
    if (searchSub2.length < 2) { setResultsSub2([]); return }
    setResultsSub2(allPlayers.filter(p => p.name.toLowerCase().includes(searchSub2.toLowerCase())))
  }, [searchSub2, allPlayers])

  function openModal() {
    setPendingSub1(sub1 || null)
    setPendingSub2(sub2 || null)
    setSearch(''); setSearchSub1(''); setSearchSub2('')
    setResults([]); setResultsSub1([]); setResultsSub2([])
    setShowModal(true)
  }

  function handleClose() {
    setShowModal(false)
    setSearch(''); setSearchSub1(''); setSearchSub2('')
    setResults([]); setResultsSub1([]); setResultsSub2([])
  }

  function handleSelectTitular(p) {
    onSelectPlayer(slot.id, p)
    setSearch(''); setResults([])
  }

  function handleConfirm() {
    if (pendingSub1) onSelectSub(slot.id, 0, pendingSub1)
    else onRemoveSub(slot.id, 0)
    if (pendingSub2) onSelectSub(slot.id, 1, pendingSub2)
    else onRemoveSub(slot.id, 1)
    handleClose()
  }

  function handleAddCustom(name) {
    if (!name || name.trim().length < 2) return
    const customPlayer = onAddCustomPlayer({
      name: name.trim(), shortName: name.trim(),
      position: slot.label, photo: DEFAULT_PHOTO, team: '', teamLogo: '',
    })
    if (customPlayer) handleSelectTitular(customPlayer)
  }

  function handleAddCustomSub1(name) {
    if (!name || name.trim().length < 2) return
    const customPlayer = onAddCustomPlayer({
      name: name.trim(), shortName: name.trim(),
      position: slot.label, photo: DEFAULT_PHOTO, team: '', teamLogo: '',
    })
    if (customPlayer) { setPendingSub1(customPlayer); setSearchSub1(''); setResultsSub1([]) }
  }

  function handleAddCustomSub2(name) {
    if (!name || name.trim().length < 2) return
    const customPlayer = onAddCustomPlayer({
      name: name.trim(), shortName: name.trim(),
      position: slot.label, photo: DEFAULT_PHOTO, team: '', teamLogo: '',
    })
    if (customPlayer) { setPendingSub2(customPlayer); setSearchSub2(''); setResultsSub2([]) }
  }

  const borderColor = player ? (player.isZaragoza ? '#0B4390' : '#f5c400') : 'transparent'

  const cardW = 'clamp(52px, 13vw, 82px)'
  const cardH = 'clamp(44px, 11vw, 82px)'
  const slotW = 'clamp(60px, 15vw, 100px)'
  const fontSize = 'clamp(7px, 1.8vw, 10px)'
  const subFontSize = 'clamp(6px, 1.4vw, 8px)'
  const plusSize = 'clamp(28px, 7vw, 46px)'
  const plusFontSize = 'clamp(14px, 3.5vw, 22px)'

  return (
    <>
      <div ref={setNodeRef} data-slot-container style={{ position: 'absolute', left: `${slot.x}%`, top: `${slot.y}%`, transform: 'translate(-50%, -50%)', width: slotW, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
        {player ? (
          <div data-card-container style={{ width: cardW, borderRadius: '8px', border: `3px solid ${borderColor}`, overflow: 'hidden', background: 'white', cursor: 'pointer', boxShadow: 'none', boxSizing: 'border-box' }}>
            <div data-card-photo onClick={openModal} style={{ width: '100%', height: cardH, background: '#f5f5f5', position: 'relative', overflow: 'hidden' }}>
              <PlayerPhoto src={player.photo} alt={player.name} />
              {player.teamLogo && (
                <img crossOrigin="anonymous" src={player.teamLogo} alt="" style={{ position: 'absolute', top: '4px', left: '4px', width: '16px', height: '16px', objectFit: 'contain', zIndex: 3, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
              )}
            </div>
            <div onClick={openModal} style={{ background: borderColor, padding: '3px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
              <span style={{ color: '#FFFFFF', fontSize: fontSize, fontFamily: 'Archivo, sans-serif', fontWeight: 'bold', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                {player.shortName || player.name}
              </span>
            </div>
            {sub1 ? <SubRow player={sub1} onClick={() => onRemoveSub(slot.id, 0)} /> : (
              <div onClick={openModal} style={{ display: 'flex', alignItems: 'center', padding: '3px 4px', cursor: 'pointer', background: 'rgba(0,0,0,0.04)', borderTop: '1px dashed rgba(0,0,0,0.1)', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: subFontSize, color: 'rgba(0,0,0,0.3)', fontFamily: 'sans-serif' }}>+ suplente</span>
              </div>
            )}
            {sub2 ? <SubRow player={sub2} onClick={() => onRemoveSub(slot.id, 1)} /> : (
              <div onClick={openModal} style={{ display: 'flex', alignItems: 'center', padding: '3px 4px', cursor: 'pointer', background: 'rgba(0,0,0,0.04)', borderTop: '1px dashed rgba(0,0,0,0.1)', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: subFontSize, color: 'rgba(0,0,0,0.3)', fontFamily: 'sans-serif' }}>+ suplente</span>
              </div>
            )}
          </div>
        ) : (
          <div onClick={openModal} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <div style={{ width: plusSize, height: plusSize, borderRadius: '50%', background: isOver ? '#444' : '#1a1a1a', border: `3px solid ${isOver ? '#fff' : 'rgba(255,255,255,0.6)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: plusFontSize, transition: 'all 0.15s' }}>+</div>
            <div style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.85)', fontSize: subFontSize, fontFamily: 'sans-serif', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px' }}>{slot.label}</div>
          </div>
        )}
      </div>

      {showModal && (
        <div onClick={handleClose} style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflowY: 'auto',
          paddingTop: '20px',
          paddingBottom: '20px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#f5f5f5',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '480px',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            maxHeight: '90vh',
          }}>
            <div style={{ background: '#0B4390', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', fontFamily: 'sans-serif' }}>
                {player ? 'Cambiar jugador' : `Seleccionar ${slot.label}`}
              </span>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jugador — {slot.label}</div>
                <input autoFocus placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && results.length === 0 && search.trim().length >= 2) handleAddCustom(search) }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', background: '#f9f9f9' }} />
                {player && search.length < 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '8px 12px', background: '#f0f0f0', borderRadius: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${player.isZaragoza ? '#0B4390' : '#f5c400'}` }}>
                      <PlayerPhoto src={player.photo} alt={player.name} />
                    </div>
                    <span style={{ fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px', flex: 1 }}>{player.name}</span>
                    <button onClick={() => { onRemovePlayer(slot.id); handleClose() }} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>
                )}
                {search.length >= 2 && (
                  <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {results.map(p => <PlayerRow key={p.id} player={p} onClick={() => handleSelectTitular(p)} />)}
                    {results.length === 0 && (
                      <div onClick={() => handleAddCustom(search)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: '2px dashed #f5c400', background: '#fffbe6', marginTop: '4px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0', flexShrink: 0 }}>
                          <PlayerPhoto src={DEFAULT_PHOTO} alt="" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px', color: '#222' }}>{search.trim()}</div>
                          <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#f5a000' }}>➕ Añadir como jugador externo</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {player && (
                <SubSearch
                  label="Suplente 1"
                  pending={pendingSub1}
                  search={searchSub1}
                  results={resultsSub1}
                  onSearchChange={setSearchSub1}
                  onSelect={p => { setPendingSub1(p); setSearchSub1(''); setResultsSub1([]) }}
                  onRemove={() => setPendingSub1(null)}
                  onAddCustom={handleAddCustomSub1}
                />
              )}

              {player && (
                <SubSearch
                  label="Suplente 2"
                  pending={pendingSub2}
                  search={searchSub2}
                  results={resultsSub2}
                  onSearchChange={setSearchSub2}
                  onSelect={p => { setPendingSub2(p); setSearchSub2(''); setResultsSub2([]) }}
                  onRemove={() => setPendingSub2(null)}
                  onAddCustom={handleAddCustomSub2}
                />
              )}
            </div>

            {player && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'white', flexShrink: 0 }}>
                <button onClick={handleClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#666', fontSize: '14px', cursor: 'pointer', fontFamily: 'sans-serif' }}>Cancelar</button>
                <button onClick={handleConfirm} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0B4390', color: 'white', fontSize: '14px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 'bold' }}>Confirmar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}