import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { formationsList } from '../pages/Lineup'

const DEFAULT_PHOTO = 'https://assets.laliga.com/squad/2025/t190/default/512x512/default_t190_2025_1_003_000.png'

export default function SidePanel({ formation, setFormation, teamName, setTeamName, slots, setSlots, setSubs, players, fichajes, setFichajes, ventas, setVentas }) {
  const [activeTab, setActiveTab] = useState('ajustes')
  const [showModalVenta, setShowModalVenta] = useState(false)
  const [showModalFichaje, setShowModalFichaje] = useState(false)
  const [search, setSearch] = useState('')
  const [valor, setValor] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [editingValor, setEditingValor] = useState(null)
  const [peticion, setPeticion] = useState('')
  const [peticionEnviada, setPeticionEnviada] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const totalVentas = ventas.reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0)
  const totalFichajes = fichajes.reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0)
  const balance = totalVentas - totalFichajes

  const zaragozaPlayers = (players || []).filter(p => p.isZaragoza)
  const externalPlayers = (players || []).filter(p => !p.isZaragoza)

  const filteredVenta = zaragozaPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && !ventas.find(v => v.id === p.id)
  )
  const filteredFichaje = externalPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && !fichajes.find(f => f.id === p.id)
  )

  function addVenta() {
    if (!selectedPlayer) return
    setVentas(prev => [...prev, { ...selectedPlayer, valor: parseFloat(valor) || 0 }])
    setShowModalVenta(false); setSearch(''); setValor(''); setSelectedPlayer(null)
  }

  function addFichaje() {
    if (!selectedPlayer) return
    setFichajes(prev => {
      if (prev.find(f => f.id === selectedPlayer.id)) return prev
      return [...prev, { ...selectedPlayer, valor: parseFloat(valor) || 0 }]
    })
    setShowModalFichaje(false); setSearch(''); setValor(''); setSelectedPlayer(null)
  }

  async function handleEnviarPeticion() {
    if (!peticion.trim()) return
    setEnviando(true)
    try {
      await emailjs.send(
        'service_yu2o009',
        'template_j4mlxar',
        { mensaje: peticion.trim(), email: '' },
        { publicKey: '4UVo2QGYmg_lTiY_p' }
      )
      setPeticionEnviada(true)
      setPeticion('')
      setTimeout(() => setPeticionEnviada(false), 3000)
    } catch (e) {
      console.error('Error enviando petición:', e)
      alert('Error al enviar la petición, inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ flex: 1, marginLeft: '0', minWidth: '280px', width: '100%' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderRadius: '8px 8px 0 0', borderBottom: '1px solid #e0e0e0' }}>
        {['ajustes', 'mercado', 'salarios'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '12px', border: 'none', background: 'transparent',
            color: activeTab === tab ? '#0B4390' : '#666',
            fontWeight: activeTab === tab ? 'bold' : 'normal',
            fontSize: '14px', cursor: 'pointer',
            borderBottom: activeTab === tab ? '2px solid #0B4390' : '2px solid transparent',
            fontFamily: 'sans-serif', textTransform: 'capitalize',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* AJUSTES */}
      {activeTab === 'ajustes' && (
        <div style={{ background: 'white', borderRadius: '0 0 8px 8px', padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '4px', fontFamily: 'sans-serif' }}>Nombre del equipo</label>
            <input value={teamName} onChange={e => setTeamName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '4px', fontFamily: 'sans-serif' }}>Formación</label>
            <select value={formation} onChange={e => setFormation(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'sans-serif', background: 'white', cursor: 'pointer' }}>
              {formationsList.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <button onClick={() => { setSlots({}); setSubs({}) }} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', color: '#666', fontSize: '13px', cursor: 'pointer', fontFamily: 'sans-serif' }}>
            🗑 Limpiar campo
          </button>
        </div>
      )}

      {/* MERCADO */}
      {activeTab === 'mercado' && (
        <div style={{ background: 'white', borderRadius: '0 0 8px 8px', padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#e0e0e0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
            {[
              { label: 'BALANCE', value: balance, color: balance >= 0 ? '#2e7d32' : '#c62828' },
              { label: 'SALIDAS', value: totalVentas, color: '#2e7d32' },
              { label: 'FICHAJES', value: totalFichajes, color: '#c62828' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '900', color: stat.color, fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
                  {balance < 0 && stat.label === 'BALANCE' ? '-' : ''}{Math.abs(stat.value)}<span style={{ fontSize: '14px' }}>M€</span>
                </div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#333', fontFamily: 'sans-serif', marginTop: '4px', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ background: '#2e7d32', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '16px', letterSpacing: '1px' }}>VENTAS</span>
              <button onClick={() => { setShowModalVenta(true); setSearch('') }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <div style={{ padding: '6px', minHeight: '60px' }}>
              {ventas.length === 0 && <p style={{ textAlign: 'center', color: '#aaa', fontFamily: 'sans-serif', padding: '16px 0', fontSize: '12px' }}>Sin ventas</p>}
              {ventas.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                  <span style={{ flex: 1, fontFamily: 'sans-serif', fontWeight: '600', fontSize: '13px', color: '#222' }}>{p.name}</span>
                  {editingValor === p.id ? (
                    <input autoFocus type="number" defaultValue={p.valor} onBlur={e => { setVentas(prev => prev.map(v => v.id === p.id ? { ...v, valor: parseFloat(e.target.value) || 0 } : v)); setEditingValor(null) }} style={{ width: '60px', padding: '3px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }} />
                  ) : (
                    <span onClick={() => setEditingValor(p.id)} style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '12px', color: '#2e7d32', cursor: 'pointer' }}>+{p.valor}M€</span>
                  )}
                  <button onClick={() => setVentas(prev => prev.filter(v => v.id !== p.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '14px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#0B4390', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '16px', letterSpacing: '1px' }}>FICHAJES</span>
              <button onClick={() => { setShowModalFichaje(true); setSearch('') }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <div style={{ padding: '6px', minHeight: '60px' }}>
              {fichajes.length === 0 && <p style={{ textAlign: 'center', color: '#aaa', fontFamily: 'sans-serif', padding: '16px 0', fontSize: '12px' }}>Sin fichajes</p>}
              {fichajes.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                  <span style={{ flex: 1, fontFamily: 'sans-serif', fontWeight: '600', fontSize: '13px', color: '#222' }}>{p.name}</span>
                  {editingValor === p.id ? (
                    <input autoFocus type="number" defaultValue={p.valor} onBlur={e => { setFichajes(prev => prev.map(f => f.id === p.id ? { ...f, valor: parseFloat(e.target.value) || 0 } : f)); setEditingValor(null) }} style={{ width: '60px', padding: '3px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }} />
                  ) : (
                    <span onClick={() => setEditingValor(p.id)} style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '12px', color: '#c62828', cursor: 'pointer' }}>-{p.valor}M€</span>
                  )}
                  <button onClick={() => setFichajes(prev => prev.filter(f => f.id !== p.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '14px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SALARIOS */}
      {activeTab === 'salarios' && (
        <div style={{ background: 'white', borderRadius: '0 0 8px 8px', padding: '40px 24px', textAlign: 'center', color: '#aaa' }}>
          <p style={{ fontSize: '36px' }}>💶</p>
          <p style={{ fontFamily: 'sans-serif', fontSize: '14px', marginTop: '8px' }}>Sección de salarios — próximamente</p>
        </div>
      )}

      {/* PANEL PETICIONES */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '16px', marginTop: '16px', border: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '16px' }}>✉️</span>
          <span style={{ fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px', color: '#222' }}>Solicita aquí los jugadores que faltan</span>
        </div>
        <textarea
          value={peticion}
          onChange={e => { if (e.target.value.length <= 400) setPeticion(e.target.value) }}
          placeholder="Escribe tu petición"
          style={{ width: '100%', minHeight: '100px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}
        />
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#aaa', fontFamily: 'sans-serif', marginBottom: '10px' }}>
          {peticion.length}/400
        </div>
        {peticionEnviada ? (
          <div style={{ textAlign: 'center', padding: '10px', background: '#e8f5e9', borderRadius: '6px', color: '#2e7d32', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600' }}>
            ✅ Petición enviada, ¡gracias!
          </div>
        ) : (
          <button
            onClick={handleEnviarPeticion}
            disabled={!peticion.trim() || enviando}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #0B4390', background: peticion.trim() && !enviando ? '#0B4390' : 'white', color: peticion.trim() && !enviando ? 'white' : '#0B4390', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: 'bold', cursor: peticion.trim() && !enviando ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {enviando ? 'Enviando...' : '➤ Enviar petición'}
          </button>
        )}
      </div>

      {/* Modal Venta */}
      {showModalVenta && (
        <div onClick={() => { setShowModalVenta(false); setSelectedPlayer(null) }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', maxHeight: '580px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#2e7d32', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', fontFamily: 'sans-serif' }}>Añadir venta</span>
              <button onClick={() => { setShowModalVenta(false); setSelectedPlayer(null) }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
              <input autoFocus placeholder="Buscar jugador del Zaragoza..." value={search} onChange={e => { setSearch(e.target.value); setSelectedPlayer(null) }} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            {selectedPlayer && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0' }}>
                  <img src={selectedPlayer.photo || DEFAULT_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} />
                </div>
                <span style={{ flex: 1, fontFamily: 'sans-serif', fontWeight: '600' }}>{selectedPlayer.name}</span>
                <input type="number" placeholder="M€" value={valor} onChange={e => setValor(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none' }} />
                <button onClick={addVenta} style={{ background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 'bold' }}>Añadir</button>
              </div>
            )}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
              {search.length < 2 && <div style={{ textAlign: 'center', padding: '30px', color: '#bbb', fontFamily: 'sans-serif', fontSize: '13px' }}>🔍 Busca un jugador del Zaragoza</div>}
              {filteredVenta.map(p => (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: selectedPlayer?.id === p.id ? '#f0f7f0' : 'transparent' }}
                  onMouseEnter={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.background = '#f5f5f5' }}
                  onMouseLeave={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px', color: '#222' }}>{p.name}</div>
                    <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#888' }}>{p.position}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Fichaje */}
      {showModalFichaje && (
        <div onClick={() => { setShowModalFichaje(false); setSelectedPlayer(null) }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', maxHeight: '580px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#0B4390', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', fontFamily: 'sans-serif' }}>Añadir fichaje</span>
              <button onClick={() => { setShowModalFichaje(false); setSelectedPlayer(null) }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
              <input autoFocus placeholder="Buscar jugador externo..." value={search} onChange={e => { setSearch(e.target.value); setSelectedPlayer(null) }} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            {selectedPlayer && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0' }}>
                  <img src={selectedPlayer.photo || DEFAULT_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} />
                </div>
                <span style={{ flex: 1, fontFamily: 'sans-serif', fontWeight: '600' }}>{selectedPlayer.name}</span>
                <input type="number" placeholder="M€" value={valor} onChange={e => setValor(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none' }} />
                <button onClick={addFichaje} style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 'bold' }}>Añadir</button>
              </div>
            )}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
              {search.length < 2 && <div style={{ textAlign: 'center', padding: '30px', color: '#bbb', fontFamily: 'sans-serif', fontSize: '13px' }}>🔍 Busca un jugador externo</div>}
              {filteredFichaje.map(p => (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: selectedPlayer?.id === p.id ? '#e8f0fb' : 'transparent' }}
                  onMouseEnter={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.background = '#f5f5f5' }}
                  onMouseLeave={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'sans-serif', fontWeight: '600', fontSize: '14px', color: '#222' }}>{p.name}</div>
                    <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#888' }}>{p.team} · {p.position}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}