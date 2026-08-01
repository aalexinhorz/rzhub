import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDroppable } from '@dnd-kit/core'

const DEFAULT_PHOTO = 'https://www.fotmob.com/img/player-fallback-dark.png'

// Usa background-image en vez de <img objectFit> porque html2canvas no
// respeta bien object-fit/object-position al exportar la alineación
// como imagen: las fotos salían estiradas y descentradas.
function PlayerPhoto({ src, alt, position = '50% 15%' }) {
  const [bg, setBg] = useState(src || DEFAULT_PHOTO)

  useEffect(() => { setBg(src || DEFAULT_PHOTO) }, [src])

  return (
    <div role="img" aria-label={alt} style={{
      width: '100%', height: '100%', backgroundColor: '#152445',
      backgroundImage: `url("${bg}")`, backgroundSize: 'cover', backgroundPosition: position,
    }}>
      <img crossOrigin="anonymous" src={bg} alt="" style={{ display: 'none' }}
        onError={() => setBg(DEFAULT_PHOTO)} />
    </div>
  )
}

function SubRow({ player, onClick }) {
  const bgColor = player.isZaragoza ? '#0B4390' : '#f5c400'
  const textColor = player.isZaragoza ? '#ffffff' : '#000000'
  return (
    <div onClick={onClick} title="Clic para quitar" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 3px', background: bgColor, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: '16px', height: '16px', flexShrink: 0, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        <PlayerPhoto src={player.photo} alt={player.name} position="50% 10%" />
      </div>
      <span style={{ fontSize: '7px', fontFamily: 'Archivo, sans-serif', fontWeight: '600', color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
        {player.shortName || player.name}
      </span>
    </div>
  )
}

function PlayerRow({ player, onClick, selected }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: selected ? '#1A3A6B' : 'transparent' }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#152445', border: `2px solid ${player.isZaragoza ? '#0D4491' : '#FFC800'}` }}>
        <PlayerPhoto src={player.photo} alt={player.name} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '14px', color: '#fff' }}>{player.name}</div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{player.team} · {player.position}</div>
      </div>
    </div>
  )
}

function SubSearch({ label, pending, search, results, onSearchChange, onSelect, onRemove, onAddCustom }) {
  return (
    <div style={{ background: '#0F1E38', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Archivo, sans-serif', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
      <input placeholder="Buscar suplente..." value={search} onChange={e => onSearchChange(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px', fontFamily: 'Archivo, sans-serif', boxSizing: 'border-box', outline: 'none', background: '#0A1628', color: '#fff' }}
        onKeyDown={e => { if (e.key === 'Enter' && results.length === 0 && search.trim().length >= 2) onAddCustom(search) }}
      />
      {pending && search.length < 2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${pending.isZaragoza ? '#0D4491' : '#FFC800'}` }}>
            <PlayerPhoto src={pending.photo} alt={pending.name} />
          </div>
          <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '14px', flex: 1, color: '#fff' }}>{pending.name}</span>
          <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}
      {search.length >= 2 && (
        <div style={{ marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {results.map(p => (
            <PlayerRow key={p.id} player={p} onClick={() => onSelect(p)} selected={pending?.id === p.id} />
          ))}
          {results.length === 0 && (
            <div onClick={() => onAddCustom(search)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: '2px dashed rgba(255,200,0,0.4)', background: 'rgba(255,200,0,0.06)', marginTop: '4px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#152445', flexShrink: 0 }}>
                <PlayerPhoto src={DEFAULT_PHOTO} alt="" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '14px', color: '#fff' }}>{search.trim()}</div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '12px', color: '#FFC800' }}>➕ Añadir como jugador externo</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function byZaragozaFirst(a, b) {
  return Number(b.isZaragoza) - Number(a.isZaragoza)
}

function scaleByFieldWidth(fieldWidth, min, max, refMin = 320, refMax = 620) {
  if (!fieldWidth) return max
  const t = Math.min(1, Math.max(0, (fieldWidth - refMin) / (refMax - refMin)))
  return min + (max - min) * t
}

export default function PlayerSlot({ slot, player, sub1, sub2, allPlayers, onSelectPlayer, onRemovePlayer, onSelectSub, onRemoveSub, onAddCustomPlayer, capturing, fieldWidth }) {
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

  // Bloquea el scroll de la página de fondo mientras el modal está abierto.
  useEffect(() => {
    if (!showModal) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  useEffect(() => {
    if (search.length < 2) { setResults([]); return }
    setResults(allPlayers.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).sort(byZaragozaFirst))
  }, [search, allPlayers])

  useEffect(() => {
    if (searchSub1.length < 2) { setResultsSub1([]); return }
    setResultsSub1(allPlayers.filter(p => p.name.toLowerCase().includes(searchSub1.toLowerCase())).sort(byZaragozaFirst))
  }, [searchSub1, allPlayers])

  useEffect(() => {
    if (searchSub2.length < 2) { setResultsSub2([]); return }
    setResultsSub2(allPlayers.filter(p => p.name.toLowerCase().includes(searchSub2.toLowerCase())).sort(byZaragozaFirst))
  }, [searchSub2, allPlayers])

  function openModal() {
    if (capturing) return
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

  const isZaragoza = player?.isZaragoza
  const borderColor = isZaragoza ? '#0B4390' : '#f5c400'
  const nameBarBg = isZaragoza ? '#0B4390' : '#f5c400'
  const nameTextColor = isZaragoza ? '#ffffff' : '#000000'
  const cardBg = isZaragoza
    ? 'linear-gradient(180deg, #c5d8f0 0%, #ddeaf8 40%, #eef4fc 70%, #f5f8fd 100%)'
    : 'linear-gradient(180deg, #f5e6b0 0%, #faf0cc 40%, #fdf7e8 70%, #fefcf3 100%)'

  // Calculados en JS a partir del ancho real del campo (no vw/clamp CSS):
  // html2canvas no siempre resuelve "vw" igual que el navegador real al
  // exportar la alineación como imagen, y descuadraba cards y título.
  const slotW = `${scaleByFieldWidth(fieldWidth, 38, 78)}px`
  const cardW = '100%'
  const cardH = `${scaleByFieldWidth(fieldWidth, 40, 80)}px`
  const plusSize = `${scaleByFieldWidth(fieldWidth, 22, 44)}px`
  const plusFontSize = `${scaleByFieldWidth(fieldWidth, 11, 20)}px`
  const subFontSize = '7px'
  const nameFontSize = '9px'

  return (
    <>
      <div ref={setNodeRef} data-slot-container style={{
        position: 'absolute', left: `${slot.x}%`, top: `${slot.y}%`,
        transform: 'translate(-50%, -50%)', width: slotW,
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2,
      }}>
        {player ? (
          <div data-card-container onClick={openModal}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)' }}
            style={{
            width: cardW,
            borderRadius: '6px',
            border: `2px solid ${borderColor}`,
            overflow: 'hidden',
            cursor: 'pointer',
            boxSizing: 'border-box',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            background: cardBg,
            transition: 'transform 150ms ease, box-shadow 150ms ease',
          }}>
            {/* Foto */}
            <div data-card-photo style={{
              width: '100%',
              height: cardH,
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <PlayerPhoto src={player.photo} alt={player.name} />
              {player.teamLogo && (
                <img crossOrigin="anonymous" src={player.teamLogo} alt=""
                  style={{
                    position: 'absolute', top: '3px', left: '3px',
                    width: '14px', height: '14px',
                    objectFit: 'contain', zIndex: 3,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                  }} />
              )}
            </div>

            {/* Nombre — altura fija para que todas las cards sean iguales */}
            <div style={{
              background: nameBarBg,
              padding: '0 4px',
              textAlign: 'center',
              width: '100%',
              boxSizing: 'border-box',
              flexShrink: 0,
              height: '18px',
              lineHeight: '18px',
              overflow: 'hidden',
            }}>
              {/* line-height en vez de flex+align-items para centrar: con
                  html2canvas el centrado por flexbox posiciona mal el texto
                  verticalmente en cajas pequeñas (se descuadraba sobre la
                  fila de suplente aunque en pantalla se viera bien). */}
              <span style={{
                color: nameTextColor,
                fontSize: nameFontSize,
                fontFamily: 'Archivo, sans-serif',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'inline-block',
                maxWidth: '100%',
                verticalAlign: 'top',
              }}>
                {player.shortName || player.name}
              </span>
            </div>

            {/* Suplentes — altura fija */}
            {[sub1, sub2].map((sub, i) => sub ? (
              <SubRow key={i} player={sub} onClick={e => { e.stopPropagation(); onRemoveSub(slot.id, i) }} />
            ) : (
              <div key={i} data-sub-empty style={{ display: 'flex', alignItems: 'center', padding: '2px 4px', background: 'rgba(0,0,0,0.04)', borderTop: '1px dashed rgba(0,0,0,0.1)', width: '100%', boxSizing: 'border-box', height: '20px' }}>
                <span style={{ fontSize: subFontSize, color: 'rgba(0,0,0,0.3)', fontFamily: 'Archivo, sans-serif' }}>+ suplente</span>
              </div>
            ))}
          </div>
        ) : (
          <div onClick={openModal}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'transform 150ms ease' }}>
            <div style={{
              width: plusSize, height: plusSize, borderRadius: '50%',
              background: isOver ? '#1A5BB8' : 'rgba(10,22,40,0.75)',
              border: `2px solid ${isOver ? '#FFC800' : 'rgba(255,255,255,0.5)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: plusFontSize, transition: 'all 0.15s',
            }}>+</div>
            <div style={{
              background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.85)',
              fontSize: subFontSize, fontFamily: 'Archivo, sans-serif', fontWeight: '700',
              padding: '2px 6px', borderRadius: '3px',
            }}>{slot.label}</div>
          </div>
        )}
      </div>

      {showModal && !capturing && createPortal(
        <div onClick={handleClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', paddingTop: '20px', paddingBottom: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0A1628', borderRadius: '16px', width: '90%', maxWidth: '480px', margin: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ background: '#0D4491', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: 'Archivo, sans-serif' }}>
                {player ? 'Cambiar jugador' : `Seleccionar ${slot.label}`}
              </span>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#0F1E38', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Archivo, sans-serif', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Jugador — {slot.label}</div>
                <input autoFocus placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && results.length === 0 && search.trim().length >= 2) handleAddCustom(search) }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px', fontFamily: 'Archivo, sans-serif', boxSizing: 'border-box', outline: 'none', background: '#0A1628', color: '#fff' }} />
                {player && search.length < 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${player.isZaragoza ? '#0D4491' : '#FFC800'}` }}>
                      <PlayerPhoto src={player.photo} alt={player.name} />
                    </div>
                    <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '14px', flex: 1, color: '#fff' }}>{player.name}</span>
                    <button onClick={() => { onRemovePlayer(slot.id); handleClose() }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>
                )}
                {search.length >= 2 && (
                  <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {results.map(p => <PlayerRow key={p.id} player={p} onClick={() => handleSelectTitular(p)} />)}
                    {results.length === 0 && (
                      <div onClick={() => handleAddCustom(search)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: '2px dashed rgba(255,200,0,0.4)', background: 'rgba(255,200,0,0.06)', marginTop: '4px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#152445', flexShrink: 0 }}>
                          <PlayerPhoto src={DEFAULT_PHOTO} alt="" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '14px', color: '#fff' }}>{search.trim()}</div>
                          <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '12px', color: '#FFC800' }}>➕ Añadir como jugador externo</div>
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
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: '#0A1628', flexShrink: 0 }}>
                <button onClick={handleClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer', fontFamily: 'Archivo, sans-serif' }}>Cancelar</button>
                <button onClick={handleConfirm} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#FFC800', color: '#060D1A', fontSize: '14px', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontWeight: '700' }}>Confirmar</button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}