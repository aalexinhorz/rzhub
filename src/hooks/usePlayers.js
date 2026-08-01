import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

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
      isCantera: p.is_cantera || false,
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
      isCantera: false,
    }
    setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)))
    return newPlayer
  }

  return { players, loading, addCustomPlayer }
}