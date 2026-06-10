import { useState, useEffect } from 'react'
import { supabase } from '../hooks/useAuth'
import useAuth from '../hooks/useAuth'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'

function LineupCard({ lineup, onDelete, isOwner }) {
  const slots = lineup.slots || {}
  const formation = lineup.formation
  const nombre = lineup.user_name || 'Usuario'
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const fecha = new Date(lineup.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  const jugadores = Object.values(slots).filter(Boolean)

  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
      <div style={{ background: '#0B4390', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'white', fontFamily: 'Humane, sans-serif', fontSize: '28px', fontWeight: '700', textTransform: 'uppercase', lineHeight: '1.1' }}>
            {lineup.team_name}
          </div>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', fontFamily: 'sans-serif' }}>
            {formation}
          </div>
        </div>
        {isOwner && (
          <button onClick={() => onDelete(lineup.id)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
        )}
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {jugadores.slice(0, 11).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f5f5f5', borderRadius: '20px', padding: '3px 8px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'sans-serif', fontWeight: '600', color: '#333' }}>{p.shortName || p.name}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f5c400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#0B4390' }}>{iniciales}</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'sans-serif', color: '#666' }}>{nombre}</span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'sans-serif', color: '#aaa' }}>{fecha}</span>
        </div>
      </div>
    </div>
  )
}

function TierlistCard({ tierlist, onDelete, isOwner }) {
  const tiers = tierlist.tiers || []
  const tierPlayers = tierlist.tier_players || {}
  const nombre = tierlist.user_name || 'Usuario'
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const fecha = new Date(tierlist.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
      <div style={{ background: '#0B4390', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'white', fontFamily: 'Humane, sans-serif', fontSize: '28px', fontWeight: '700', textTransform: 'uppercase', lineHeight: '1.1' }}>
          {tierlist.title || 'Tier List'}
        </div>
        {isOwner && (
          <button onClick={() => onDelete(tierlist.id)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
        )}
      </div>
      <div style={{ padding: '12px 16px' }}>
        {tiers.map(tier => {
          const players = tierPlayers[tier.id] || []
          if (players.length === 0) return null
          return (
            <div key={tier.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '90px', minWidth: '90px', background: tier.color, borderRadius: '4px', padding: '3px 6px', textAlign: 'center' }}>
                <span style={{ color: 'white', fontSize: '10px', fontFamily: 'sans-serif', fontWeight: '700' }}>{tier.label}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {players.map((p, i) => (
                  <div key={i} style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', border: '2px solid #0B4390' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f5c400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#0B4390' }}>{iniciales}</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'sans-serif', color: '#666' }}>{nombre}</span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'sans-serif', color: '#aaa' }}>{fecha}</span>
        </div>
      </div>
    </div>
  )
}

export default function Comunidad() {
  const { user } = useAuth()
  const [tab, setTab] = useState('lineups')
  const [lineups, setLineups] = useState([])
  const [tierlists, setTierlists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: l, error: e1 }, { data: t, error: e2 }] = await Promise.all([
      supabase.from('lineups').select('*').order('created_at', { ascending: false }),
      supabase.from('tierlists').select('*').order('created_at', { ascending: false }),
    ])
    if (e1) console.error('lineups error:', e1)
    if (e2) console.error('tierlists error:', e2)
    setLineups(l || [])
    setTierlists(t || [])
    setLoading(false)
  }

  async function deleteLineup(id) {
    await supabase.from('lineups').delete().eq('id', id)
    setLineups(prev => prev.filter(l => l.id !== id))
  }

  async function deleteTierlist(id) {
    await supabase.from('tierlists').delete().eq('id', id)
    setTierlists(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5', padding: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: '72px', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: '0 0 24px 0' }}>
          Comunidad
        </h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['lineups', 'tierlists'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 24px', borderRadius: '24px', border: 'none', cursor: 'pointer',
              background: tab === t ? '#0B4390' : 'white',
              color: tab === t ? 'white' : '#333',
              fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>
              {t === 'lineups' ? '⚽ Alineaciones' : '📊 Tier Lists'}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ fontFamily: 'sans-serif', color: '#999' }}>Cargando...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {tab === 'lineups' && lineups.map(l => (
              <LineupCard key={l.id} lineup={l} onDelete={deleteLineup} isOwner={user?.id === l.user_id} />
            ))}
            {tab === 'tierlists' && tierlists.map(t => (
              <TierlistCard key={t.id} tierlist={t} onDelete={deleteTierlist} isOwner={user?.id === t.user_id} />
            ))}
            {tab === 'lineups' && lineups.length === 0 && (
              <p style={{ fontFamily: 'sans-serif', color: '#999' }}>No hay alineaciones guardadas todavía.</p>
            )}
            {tab === 'tierlists' && tierlists.length === 0 && (
              <p style={{ fontFamily: 'sans-serif', color: '#999' }}>No hay tier lists guardadas todavía.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}