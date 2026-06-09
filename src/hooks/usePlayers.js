import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const DEFAULT_PHOTO = 'https://assets.laliga.com/squad/2025/t190/default/512x512/default_t190_2025_1_003_000.png'

export default function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true })

    if (error) { console.error(error); return }

    const mapped = data.map(p => ({
      id: `db_${p.id}`,
      name: p.name,
      shortName: p.short_name || p.name,
      number: p.number,
      position: p.position || 'MED',
      photo: p.photo || DEFAULT_PHOTO,
      team: p.team || '',
      teamLogo: p.team_logo || '',
      isZaragoza: p.is_zaragoza || false,
    }))

    setPlayers(mapped)
    setLoading(false)
  }

  function addCustomPlayer(playerData) {
    const newPlayer = {
      id: `temp_${Date.now()}`,
      name: playerData.name,
      shortName: playerData.shortName || playerData.name,
      position: playerData.position || 'MED',
      photo: playerData.photo || DEFAULT_PHOTO,
      team: playerData.team || '',
      teamLogo: playerData.teamLogo || '',
      isZaragoza: false,
    }
    setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)))
    return newPlayer
  }

  return { players, loading, addCustomPlayer }
}