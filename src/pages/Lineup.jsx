import { useState } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import Field from '../components/Field'
import SidePanel from '../components/SidePanel'
import Footer from '../components/Footer'
import usePlayers from '../hooks/usePlayers'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'

const formations = {
  '4-3-3': [
    { id: 'GK',   x: 50, y: 88, label: 'POR' },
    { id: 'DEF1', x: 12, y: 72, label: 'DEF' },
    { id: 'DEF2', x: 34, y: 72, label: 'DEF' },
    { id: 'DEF3', x: 66, y: 72, label: 'DEF' },
    { id: 'DEF4', x: 88, y: 72, label: 'DEF' },
    { id: 'MID1', x: 22, y: 50, label: 'MED' },
    { id: 'MID2', x: 50, y: 50, label: 'MED' },
    { id: 'MID3', x: 78, y: 50, label: 'MED' },
    { id: 'FWD1', x: 18, y: 24, label: 'DEL' },
    { id: 'FWD2', x: 50, y: 24, label: 'DEL' },
    { id: 'FWD3', x: 82, y: 24, label: 'DEL' },
  ],
  '4-4-2': [
    { id: 'GK',   x: 50, y: 88, label: 'POR' },
    { id: 'DEF1', x: 12, y: 70, label: 'DEF' },
    { id: 'DEF2', x: 34, y: 70, label: 'DEF' },
    { id: 'DEF3', x: 66, y: 70, label: 'DEF' },
    { id: 'DEF4', x: 88, y: 70, label: 'DEF' },
    { id: 'MID1', x: 12, y: 47, label: 'MED' },
    { id: 'MID2', x: 37, y: 47, label: 'MED' },
    { id: 'MID3', x: 63, y: 47, label: 'MED' },
    { id: 'MID4', x: 88, y: 47, label: 'MED' },
    { id: 'FWD1', x: 33, y: 23, label: 'DEL' },
    { id: 'FWD2', x: 67, y: 23, label: 'DEL' },
  ],
  '4-4-2 en rombo': [
    { id: 'GK',   x: 50, y: 88, label: 'POR' },
    { id: 'DEF1', x: 12, y: 72, label: 'DEF' },
    { id: 'DEF2', x: 34, y: 72, label: 'DEF' },
    { id: 'DEF3', x: 66, y: 72, label: 'DEF' },
    { id: 'DEF4', x: 88, y: 72, label: 'DEF' },
    { id: 'MID1', x: 50, y: 60, label: 'MED' },
    { id: 'MID2', x: 20, y: 47, label: 'MED' },
    { id: 'MID3', x: 80, y: 47, label: 'MED' },
    { id: 'MID4', x: 50, y: 34, label: 'MED' },
    { id: 'FWD1', x: 33, y: 20, label: 'DEL' },
    { id: 'FWD2', x: 67, y: 20, label: 'DEL' },
  ],
  '4-2-3-1': [
    { id: 'GK',   x: 50, y: 88, label: 'POR' },
    { id: 'DEF1', x: 12, y: 73, label: 'DEF' },
    { id: 'DEF2', x: 30, y: 80, label: 'DEF' },
    { id: 'DEF3', x: 70, y: 80, label: 'DEF' },
    { id: 'DEF4', x: 88, y: 73, label: 'DEF' },
    { id: 'MID1', x: 33, y: 55, label: 'MED' },
    { id: 'MID2', x: 67, y: 55, label: 'MED' },
    { id: 'CAM1', x: 15, y: 40, label: 'MED' },
    { id: 'CAM2', x: 50, y: 44, label: 'MED' },
    { id: 'CAM3', x: 85, y: 40, label: 'MED' },
    { id: 'FWD1', x: 50, y: 20, label: 'DEL' },
  ],
  '3-4-2-1': [
    { id: 'GK',   x: 50, y: 89, label: 'POR' },
    { id: 'DEF1', x: 17, y: 72, label: 'DEF' },
    { id: 'DEF2', x: 50, y: 67, label: 'DEF' },
    { id: 'DEF3', x: 83, y: 72, label: 'DEF' },
    { id: 'MID1', x: 15, y: 50, label: 'MED' },
    { id: 'MID2', x: 33, y: 58, label: 'MED' },
    { id: 'MID3', x: 67, y: 58, label: 'MED' },
    { id: 'MID4', x: 85, y: 50, label: 'MED' },
    { id: 'CAM1', x: 33, y: 35, label: 'MED' },
    { id: 'CAM2', x: 67, y: 35, label: 'MED' },
    { id: 'FWD1', x: 50, y: 22, label: 'DEL' },
  ],
  '5-3-2': [
    { id: 'GK',   x: 50, y: 89, label: 'POR' },
    { id: 'DEF1', x: 8,  y: 72, label: 'DEF' },
    { id: 'DEF2', x: 28, y: 72, label: 'DEF' },
    { id: 'DEF3', x: 50, y: 67, label: 'DEF' },
    { id: 'DEF4', x: 72, y: 72, label: 'DEF' },
    { id: 'DEF5', x: 92, y: 72, label: 'DEF' },
    { id: 'MID1', x: 22, y: 47, label: 'MED' },
    { id: 'MID2', x: 50, y: 45, label: 'MED' },
    { id: 'MID3', x: 78, y: 47, label: 'MED' },
    { id: 'FWD1', x: 33, y: 23, label: 'DEL' },
    { id: 'FWD2', x: 67, y: 23, label: 'DEL' },
  ],
}

export const formationsList = Object.keys(formations)

export default function Lineup() {
  const { players, loading, addCustomPlayer } = usePlayers()
  const { user } = useAuth()
  const [formation, setFormation] = useState('4-2-3-1')
  const [slots, setSlots] = useState({})
  const [subs, setSubs] = useState({})
  const [teamName, setTeamName] = useState('El XI del Real Zaragoza')
  const [fichajes, setFichajes] = useState([])
  const [ventas, setVentas] = useState([])

  const slotsLayout = formations[formation]

  // Distancia mínima antes de considerarlo un arrastre (no un simple clic),
  // para poder seguir abriendo el modal de "cambiar jugador" con un clic.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const fromId = active.id
    const toId = over.id

    setSlots(prev => {
      const n = { ...prev }
      const fromPlayer = n[fromId]
      const toPlayer = n[toId]
      if (toPlayer) n[fromId] = toPlayer; else delete n[fromId]
      if (fromPlayer) n[toId] = fromPlayer; else delete n[toId]
      return n
    })
    setSubs(prev => {
      const n = { ...prev }
      const fromSubs = n[fromId]
      const toSubs = n[toId]
      if (toSubs) n[fromId] = toSubs; else delete n[fromId]
      if (fromSubs) n[toId] = fromSubs; else delete n[toId]
      return n
    })
  }

  function handleChangeFormation(newFormation) {
    const oldLayout = formations[formation]
    const newLayout = formations[newFormation]
    const playersByLabel = {}
    oldLayout.forEach(slot => {
      const player = slots[slot.id]
      if (player) {
        if (!playersByLabel[slot.label]) playersByLabel[slot.label] = []
        playersByLabel[slot.label].push({ player, sub: subs[slot.id] })
      }
    })
    const newSlots = {}
    const newSubs = {}
    const usedIndexes = {}
    newLayout.forEach(slot => {
      const label = slot.label
      const idx = usedIndexes[label] || 0
      if (playersByLabel[label] && playersByLabel[label][idx]) {
        newSlots[slot.id] = playersByLabel[label][idx].player
        if (playersByLabel[label][idx].sub) newSubs[slot.id] = playersByLabel[label][idx].sub
        usedIndexes[label] = idx + 1
      }
    })
    setFormation(newFormation)
    setSlots(newSlots)
    setSubs(newSubs)
  }

  function handleSelectPlayer(slotId, player) {
    const prevPlayer = slots[slotId]
    if (prevPlayer && !prevPlayer.isZaragoza) {
      setFichajes(prev => prev.filter(f => f.id !== prevPlayer.id))
    }
    if (!player.isZaragoza) {
      setFichajes(prev => {
        if (prev.find(f => f.id === player.id)) return prev
        return [...prev, { ...player, valor: 0 }]
      })
    }
    setSlots(prev => ({ ...prev, [slotId]: player }))
  }

  function handleRemovePlayer(slotId) {
    const player = slots[slotId]
    if (player && !player.isZaragoza) {
      const stillInField = Object.entries(slots).some(([id, p]) => id !== slotId && p?.id === player.id)
      if (!stillInField) setFichajes(prev => prev.filter(f => f.id !== player.id))
    }
    setSlots(prev => { const n = { ...prev }; delete n[slotId]; return n })
    setSubs(prev => { const n = { ...prev }; delete n[slotId]; return n })
  }

  async function handleGuardar(nombrePersonalizado) {
    if (!user) return
    if (Object.keys(slots).length === 0) {
      alert('Añade al menos un jugador antes de guardar.')
      throw new Error('Sin jugadores')
    }
    await supabase.from('profiles').upsert({
      id: user.id,
      name: user.user_metadata?.name || user.email,
      avatar_url: user.user_metadata?.avatar_url || null,
    })
    const { error } = await supabase.from('lineups').insert({
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email,
      team_name: nombrePersonalizado || teamName,
      formation,
      slots,
      subs,
    })
    if (error) throw error
  }

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#060D1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: '18px', color: 'rgba(255,255,255,0.4)' }}>Cargando plantilla...</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', isolation: 'isolate', minHeight: 'calc(100vh - 72px)', background: '#060D1A', fontFamily: 'Archivo, sans-serif' }}>
      {/* Misma imagen panorámica de estadio/afición que usa .editorial-section */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `linear-gradient(180deg, rgba(4, 18, 46, 0.94) 0%, rgba(7, 35, 88, 0.90) 35%, rgba(10, 68, 145, 0.82) 65%, rgba(4, 18, 46, 0.95) 100%), url('/images/estadio-comunidad.webp') center center / cover no-repeat`,
        filter: 'saturate(0.82) contrast(0.94)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <SEO
        title="Alineación del Real Zaragoza | Crea tu XI | RZ Hub"
        description="Crea tu alineación ideal del Real Zaragoza. Elige formación, coloca a los jugadores de la plantilla y comparte tu XI con otros zaragocistas."
        keywords="alineación Real Zaragoza, crear XI Real Zaragoza, once titular Real Zaragoza, formación Real Zaragoza, plantilla Real Zaragoza 26/27"
        path="/lineup"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Alineación del Real Zaragoza | RZ Hub',
          url: `${SITE_URL}/lineup`,
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          description: 'Herramienta para crear y compartir tu alineación ideal del Real Zaragoza eligiendo formación y jugadores de la plantilla.',
        }}
      />

      {/* Header de página */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '28px clamp(16px,4vw,40px) 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ color: '#FFC800', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
          REAL ZARAGOZA · TEMPORADA 26/27
        </p>
        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(56px, 10vw, 96px)', color: '#ffffff', textTransform: 'uppercase', margin: 0, lineHeight: 0.85, letterSpacing: '-1px' }}>
          LINE-UP
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontSize: '14px', margin: '12px 0 0' }}>
          Crea tu once ideal y compártelo con la comunidad.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto', padding: '24px clamp(16px,4vw,40px) 64px', gap: '24px' }}>
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
          <Field
            slotsLayout={slotsLayout}
            slots={slots}
            subs={subs}
            teamName={teamName}
            setTeamName={setTeamName}
            formation={formation}
            allPlayers={players}
            onSelectPlayer={handleSelectPlayer}
            onRemovePlayer={handleRemovePlayer}
            onSelectSub={(slotId, subIndex, player) => setSubs(prev => ({ ...prev, [slotId]: { ...prev[slotId], [subIndex]: player } }))}
            onRemoveSub={(slotId, subIndex) => setSubs(prev => {
              const n = { ...prev }
              if (n[slotId]) { const s = { ...n[slotId] }; delete s[subIndex]; n[slotId] = s }
              return { ...n }
            })}
            onAddCustomPlayer={addCustomPlayer}
            onGuardar={handleGuardar}
            user={user}
          />
          <SidePanel
            formation={formation}
            setFormation={handleChangeFormation}
            teamName={teamName}
            setTeamName={setTeamName}
            slots={slots}
            setSlots={setSlots}
            setSubs={setSubs}
            players={players}
            fichajes={fichajes}
            setFichajes={setFichajes}
            ventas={ventas}
            setVentas={setVentas}
          />
        </DndContext>
      </div>
      <Footer />
      </div>
    </div>
  )
}