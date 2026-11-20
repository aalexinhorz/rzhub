import { useState, useEffect, useRef } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import { supabase } from '../hooks/useAuth'
import useAuth from '../hooks/useAuth'
import { formations } from '../lib/formations'
import { drawLineupCanvas } from '../lib/lineupCanvas'
import '../components/HeroSection.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

// Alineación a pantalla completa, dibujada igual que la imagen que se
// descarga en Line-up: misma formación y cada jugador donde lo colocaron.
function LineupModal({ lineup, onClose }) {
  const contenedorRef = useRef(null)
  const [estado, setEstado] = useState('cargando')

  useEffect(() => {
    let activo = true
    const formation = formations[lineup.formation] ? lineup.formation : '4-2-3-1'
    drawLineupCanvas({
      slotsLayout: formations[formation],
      slots: lineup.slots || {},
      subs: lineup.subs || {},
      teamName: lineup.team_name || 'El XI del Real Zaragoza',
      formation,
    }).then(canvas => {
      if (!activo || !contenedorRef.current) return
      canvas.style.width = '100%'
      canvas.style.height = 'auto'
      canvas.style.display = 'block'
      canvas.style.borderRadius = '12px'
      contenedorRef.current.replaceChildren(canvas)
      setEstado('listo')
    }).catch(e => {
      console.error('No se pudo dibujar la alineación:', e)
      if (activo) setEstado('error')
    })
    return () => { activo = false }
  }, [lineup])

  useEffect(() => {
    const alPulsar = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', alPulsar)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', alPulsar); document.body.style.overflow = overflow }
  }, [onClose])

  return (
    <div role="dialog" aria-modal="true" aria-label={lineup.team_name || 'Alineación'} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,16,31,0.88)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: '560px', margin: 'auto 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'Archivo, sans-serif', fontSize: '13px' }}>
            {lineup.user_name || 'Usuario'} · {lineup.formation}
          </span>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
        {estado === 'cargando' && <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Archivo, sans-serif', textAlign: 'center', padding: '80px 0', margin: 0 }}>Cargando alineación…</p>}
        {estado === 'error' && <p style={{ color: '#f87171', fontFamily: 'Archivo, sans-serif', textAlign: 'center', padding: '80px 0', margin: 0 }}>No se ha podido cargar esta alineación.</p>}
        <div ref={contenedorRef} />
      </div>
    </div>
  )
}

function LineupCard({ lineup, onDelete, isOwner, onOpen }) {
  const slots = lineup.slots || {}
  const formation = lineup.formation
  const nombre = lineup.user_name || 'Usuario'
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const fecha = new Date(lineup.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  const jugadores = Object.values(slots).filter(Boolean)

  return (
    <div role="button" tabIndex={0} onClick={() => onOpen(lineup)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(lineup) } }} title="Ver la alineación" style={{ background: '#09215F', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #FFC800', cursor: 'pointer' }}>
      <div style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#09215F', fontFamily: 'Humane, sans-serif', fontSize: '28px', fontWeight: '700', textTransform: 'uppercase', lineHeight: '1.1' }}>
            {lineup.team_name}
          </div>
          <div style={{ display: 'inline-block', background: 'rgba(9,33,95,0.1)', color: '#09215F', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', fontFamily: 'sans-serif' }}>
            {formation}
          </div>
        </div>
        {isOwner && (
          <button onClick={e => { e.stopPropagation(); onDelete(lineup.id) }} aria-label="Borrar alineación" style={{ background: 'rgba(9,33,95,0.1)', border: 'none', color: '#09215F', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
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
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#09215F' }}>{iniciales}</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'sans-serif', color: 'rgba(255,255,255,0.7)' }}>{nombre}</span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'sans-serif', color: 'rgba(255,255,255,0.4)' }}>{fecha} · <span style={{ color: '#FFC800', fontWeight: 700 }}>Ver XI ›</span></span>
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
    <div style={{ background: '#09215F', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #FFC800' }}>
      <div style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#09215F', fontFamily: 'Humane, sans-serif', fontSize: '28px', fontWeight: '700', textTransform: 'uppercase', lineHeight: '1.1' }}>
          {tierlist.title || 'Tier List'}
        </div>
        {isOwner && (
          <button onClick={() => onDelete(tierlist.id)} style={{ background: 'rgba(9,33,95,0.1)', border: 'none', color: '#09215F', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
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
                  <div key={i} style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', border: '2px solid #FFC800' }}>
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
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#09215F' }}>{iniciales}</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'sans-serif', color: 'rgba(255,255,255,0.7)' }}>{nombre}</span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'sans-serif', color: 'rgba(255,255,255,0.4)' }}>{fecha}</span>
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
  const [abierta, setAbierta] = useState(null)

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
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#060D1A', padding: '24px' }}>
      <SEO
        title="Comunidad zaragocista: alineaciones y tier lists | RZ Hub"
        description="Descubre las alineaciones y tier lists creadas por otros aficionados del Real Zaragoza. Comparte las tuyas con la comunidad zaragocista."
        keywords="comunidad Real Zaragoza, aficionados Real Zaragoza, alineaciones comunidad, tier list comunidad, zaragocistas"
        path="/comunidad"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Comunidad RZ Hub',
          url: `${SITE_URL}/comunidad`,
          description: 'Alineaciones y tier lists del Real Zaragoza compartidas por la comunidad de RZ Hub.',
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: '72px', textTransform: 'uppercase', color: '#FFFFFF', lineHeight: '1', margin: '0 0 24px 0' }}>
          Comunidad
        </h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['lineups', 'tierlists'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? 'hero-cta' : undefined} style={{
              width: 'auto', padding: '10px 24px', borderRadius: '24px', border: 'none', cursor: 'pointer',
              background: tab === t ? undefined : 'white',
              color: tab === t ? undefined : '#333',
              fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px',
              boxShadow: tab === t ? undefined : '0 1px 4px rgba(0,0,0,0.1)',
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
              <LineupCard key={l.id} lineup={l} onDelete={deleteLineup} isOwner={user?.id === l.user_id} onOpen={setAbierta} />
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
      {abierta && <LineupModal lineup={abierta} onClose={() => setAbierta(null)} />}
    </div>
  )
}