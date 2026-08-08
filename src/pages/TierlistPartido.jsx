import { useState, useRef, useEffect } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import { DndContext, closestCenter, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core'
import usePlayers from '../hooks/usePlayers'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'
import useLastMatch from '../hooks/useLastMatch'
import html2canvas from 'html2canvas'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

const GRADE_TIERS = [
  { id: 'sobresaliente', label: 'Sobresaliente' },
  { id: 'notable',       label: 'Notable' },
  { id: 'bien',          label: 'Bien' },
  { id: 'suficiente',    label: 'Suficiente' },
  { id: 'suspenso',      label: 'Suspenso' },
]

// "Real Zaragoza vs Utebo (Amistoso)" / "Gimnastic de Tarragona vs Real Zaragoza (J1)" -> rival
function extractRival(summary) {
  if (!summary) return null
  const sinParentesis = summary.replace(/\s*\([^)]*\)\s*$/, '').trim()
  const partes = sinParentesis.split(/\s+vs\s+/i)
  if (partes.length !== 2) return null
  const [a, b] = partes
  return a.toLowerCase().includes('real zaragoza') ? b.trim() : a.trim()
}

function TierCard({ player, isDragging, small }) {
  const borderColor = player.isZaragoza ? '#0B4390' : '#f5c400'
  const footerColor = player.isZaragoza ? '#0B4390' : '#f5c400'
  const cardW = small ? '52px' : '72px'
  const cardH = small ? '48px' : '68px'
  const fontSize = small ? '8px' : '9px'

  return (
    <div style={{ width: cardW, borderRadius: '6px', border: `2px solid ${borderColor}`, overflow: 'hidden', background: 'white', opacity: isDragging ? 0.4 : 1, cursor: 'grab', userSelect: 'none', boxSizing: 'border-box', flexShrink: 0 }}>
      <div style={{ width: '100%', height: cardH, background: '#f5f5f5', position: 'relative', overflow: 'hidden' }}>
        <img crossOrigin="anonymous" src={player.photo || DEFAULT_PHOTO} alt={player.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%', display: 'block' }}
          onError={e => { e.target.src = DEFAULT_PHOTO }} />
        {player.teamLogo && (
          <img crossOrigin="anonymous" src={player.teamLogo} alt=""
            style={{ position: 'absolute', top: '2px', left: '2px', width: '12px', height: '12px', objectFit: 'contain', zIndex: 3 }} />
        )}
      </div>
      <div style={{ background: footerColor, padding: '2px 3px', textAlign: 'center' }}>
        <span style={{ color: '#ffffff', fontSize: fontSize, fontFamily: 'Archivo, sans-serif', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
          {player.shortName || player.name}
        </span>
      </div>
    </div>
  )
}

function DraggableTierCard({ player, small }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ touchAction: 'none' }}>
      <TierCard player={player} isDragging={isDragging} small={small} />
    </div>
  )
}

// A diferencia del TierMaker de opinión, las columnas de notas son fijas:
// sin editar la etiqueta ni añadir/borrar filas.
function GradeRow({ tier, color, players, small }) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id })
  const labelW = small ? '90px' : '140px'
  const labelFontSize = small ? '12px' : '14px'
  const minH = small ? '70px' : '100px'

  return (
    <div style={{ display: 'flex', marginBottom: '4px', minHeight: minH, background: '#060D1A', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1a2436' }}>
      <div style={{ width: labelW, minWidth: labelW, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
        <span style={{ color: 'white', fontFamily: 'sans-serif', fontWeight: '700', fontSize: labelFontSize, textAlign: 'center', lineHeight: '1.3', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{tier.label}</span>
      </div>
      <div ref={setNodeRef} style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', alignItems: 'center', background: isOver ? '#132241' : '#060D1A', transition: 'background 0.15s', minHeight: minH }}>
        {players.map(p => <DraggableTierCard key={p.id} player={p} small={small} />)}
      </div>
    </div>
  )
}

function PoolZone({ primerEquipo, cantera, small }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  return (
    <div ref={setNodeRef} style={{ background: isOver ? '#132241' : '#060D1A', borderRadius: '8px', padding: '12px', transition: 'background 0.15s' }}>
      {primerEquipo.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', color: '#999', marginBottom: '10px', letterSpacing: '1px' }}>PRIMER EQUIPO</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: small ? '6px' : '10px' }}>
            {primerEquipo.map(p => <DraggableTierCard key={p.id} player={p} small={small} />)}
          </div>
        </div>
      )}
      {cantera.length > 0 && (
        <div>
          <p style={{ fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', color: '#999', marginBottom: '10px', letterSpacing: '1px' }}>CANTERA</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: small ? '6px' : '10px' }}>
            {cantera.map(p => <DraggableTierCard key={p.id} player={p} small={small} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TierlistPartido() {
  const { players, loading } = usePlayers()
  const { user } = useAuth()
  const { lastMatch } = useLastMatch()
  const [tierPlayers, setTierPlayers] = useState({})
  const [activePlayer, setActivePlayer] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [titulo, setTitulo] = useState('TIERLIST DEL REAL ZARAGOZA')
  const [tituloEditado, setTituloEditado] = useState(false)
  const [nombreGuardado, setNombreGuardado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const tierlistRef = useRef(null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  useEffect(() => {
    if (tituloEditado || !lastMatch) return
    const rival = extractRival(lastMatch.summary)
    if (rival) setTitulo(`TIERLIST VS ${rival.toUpperCase()}`)
  }, [lastMatch, tituloEditado])

  useEffect(() => { setNombreGuardado(titulo) }, [titulo])

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

  async function handleDownload() {
    if (!tierlistRef.current) return
    try {
      const canvas = await html2canvas(tierlistRef.current, { scale: 2, useCORS: true, backgroundColor: '#060D1A', logging: false })
      const link = document.createElement('a')
      link.download = 'notas-partido-zaragoza.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) { console.error(e) }
  }

  function abrirModal() {
    if (!user) { alert('Debes iniciar sesión para guardar en la comunidad.'); return }
    const total = Object.values(tierPlayers).flat().length
    if (total === 0) { alert('Añade al menos un jugador a las columnas antes de guardar.'); return }
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
        tiers: GRADE_TIERS,
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
  const gradeColors = { suspenso: '#c0392b', suficiente: '#e67e22', bien: '#f1c40f', notable: '#2ecc71', sobresaliente: '#FFC800' }

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#999' }}>Cargando plantilla...</p>
    </div>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#060D1A', padding: isMobile ? '16px 12px' : '24px' }}>
      <SEO
        title="Tierlist del partido | Puntúa al Real Zaragoza | RZ Hub"
        description="Clasifica a los jugadores del Real Zaragoza por su actuación en el último partido: suspenso, suficiente, bien, notable o sobresaliente."
        keywords="tierlist partido Real Zaragoza, puntuar jugadores Real Zaragoza, notas Real Zaragoza"
        path="/tierlist-partido"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Tierlist del partido | RZ Hub',
          url: `${SITE_URL}/tierlist-partido`,
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          description: 'Herramienta para clasificar a los jugadores del Real Zaragoza según su actuación en el último partido.',
        }}
      />
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            value={titulo}
            onChange={e => { setTitulo(e.target.value); setTituloEditado(true) }}
            style={{
              fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: isMobile ? '32px' : '48px',
              textTransform: 'uppercase', color: 'white', lineHeight: '1', margin: 0,
              background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.2)',
              outline: 'none', flex: '1 1 auto', minWidth: '200px', padding: '4px 0',
            }} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {guardado ? (
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderRadius: '24px', background: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', fontSize: '13px', fontFamily: 'sans-serif' }}>
                ✅ ¡Guardado!
              </div>
            ) : (
              <button onClick={abrirModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '24px', border: '2px solid #27ae60', background: 'white', color: '#27ae60', fontWeight: 'bold', fontSize: '13px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
                💾 {isMobile ? 'Guardar' : 'Guardar en comunidad'}
              </button>
            )}
            <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '24px', border: '2px solid #0B4390', background: 'white', color: '#0B4390', fontWeight: 'bold', fontSize: '13px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
              ⬇ {isMobile ? '' : 'Descargar'}
            </button>
            <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '24px', border: '2px solid #ccc', background: 'white', color: '#666', fontWeight: 'bold', fontSize: '13px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
              ↺ {isMobile ? '' : 'Restablecer'}
            </button>
          </div>
        </div>

        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div ref={tierlistRef} style={{ padding: isMobile ? '8px' : '16px', background: '#060D1A', borderRadius: '8px' }}>
            {GRADE_TIERS.map(tier => (
              <GradeRow
                key={tier.id}
                tier={tier}
                color={gradeColors[tier.id]}
                players={tierPlayers[tier.id] || []}
                small={isMobile}
              />
            ))}
            <PoolZone primerEquipo={primerEquipo} cantera={cantera} small={isMobile} />
          </div>
          <DragOverlay>
            {activePlayer ? <TierCard player={activePlayer} small={isMobile} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#0B4390', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', fontFamily: 'sans-serif' }}>Guardar Tierlist</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ fontSize: '12px', color: '#888', fontFamily: 'sans-serif', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Nombre de la tierlist
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
