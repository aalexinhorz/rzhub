import { useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import Field from './components/Field'
import SidePanel from './components/SidePanel'
import usePlayers from './hooks/usePlayers'

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

export default function App() {
  const { players, loading, addCustomPlayer } = usePlayers()
  const [formation, setFormation] = useState('4-2-3-1')
  const [slots, setSlots] = useState({})
  const [subs, setSubs] = useState({})
  const [teamName, setTeamName] = useState('El XI del Real Zaragoza')
  const [fichajes, setFichajes] = useState([])
  const [ventas, setVentas] = useState([])

  const slotsLayout = formations[formation]

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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', fontSize: '18px', color: '#666' }}>Cargando plantilla...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'sans-serif' }}>

      <div style={{ background: '#0B4390', padding: '0 24px', display: 'flex', alignItems: 'center', height: '60px' }}>
        <img src="/PALMADAS_AL_VIENTO_HORIZONTAL 3.png" alt="Palmadas al Viento" style={{ height: '36px' }} />
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        maxWidth: '1300px',
        margin: '0 auto',
        padding: '16px',
        gap: '24px',
      }}>
        <DndContext collisionDetection={closestCenter}>
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
    </div>
  )
}