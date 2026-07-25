import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { formationsList } from '../pages/Lineup'

const DEFAULT_PHOTO = 'https://assets.laliga.com/squad/2025/t190/default/512x512/default_t190_2025_1_003_000.png'

const card = { background: '#0F1E38', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: '#0A1628', color: '#ffffff', fontSize: '14px', fontFamily: 'Archivo, sans-serif', boxSizing: 'border-box', outline: 'none' }
const labelStyle = { fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Archivo, sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }

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
        { publicKey: '4UVo2QGYmg_lTiY_p', privateKey: 'dGSMsNSLxJ_jytvoORyA_' }
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
    <div style={{ flex: 1, minWidth: '280px', width: '100%' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '20px' }}>
        {['ajustes', 'mercado', 'salarios'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '12px 8px', border: 'none', background: 'transparent',
            color: activeTab === tab ? '#FFC800' : 'rgba(255,255,255,0.35)',
            fontWeight: activeTab === tab ? '700' : '400',
            fontSize: '12px', cursor: 'pointer',
            borderBottom: activeTab === tab ? '2px solid #FFC800' : '2px solid transparent',
            fontFamily: 'Archivo, sans-serif', textTransform: 'uppercase', letterSpacing: '1px',
            transition: 'all 0.15s',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* AJUSTES */}
      {activeTab === 'ajustes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ ...card, padding: '16px' }}>
            <label style={labelStyle}>Nombre del equipo</label>
            <input value={teamName} onChange={e => setTeamName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ ...card, padding: '16px' }}>
            <label style={labelStyle}>Formación</label>
            <select value={formation} onChange={e => setFormation(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {formationsList.map(f => <option key={f} value={f} style={{ background: '#0A1628' }}>{f}</option>)}
            </select>
          </div>
          <button onClick={() => { setSlots({}); setSubs({}) }}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
          >
            🗑 Limpiar campo
          </button>

          {/* Panel peticiones */}
          <div style={{ ...card, padding: '16px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px' }}>✉️</span>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Solicita jugadores que faltan</span>
            </div>
            <textarea
              value={peticion}
              onChange={e => { if (e.target.value.length <= 400) setPeticion(e.target.value) }}
              placeholder="Escribe tu petición..."
              style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
            />
            <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Archivo, sans-serif', margin: '6px 0 10px' }}>
              {peticion.length}/400
            </div>
            {peticionEnviada ? (
              <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(34,197,94,0.12)', borderRadius: '8px', color: '#22C55E', fontFamily: 'Archivo, sans-serif', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(34,197,94,0.2)' }}>
                ✅ Petición enviada, ¡gracias!
              </div>
            ) : (
              <button onClick={handleEnviarPeticion} disabled={!peticion.trim() || enviando}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: peticion.trim() && !enviando ? '#FFC800' : 'rgba(255,200,0,0.1)', color: peticion.trim() && !enviando ? '#060D1A' : 'rgba(255,200,0,0.35)', fontSize: '13px', fontFamily: 'Archivo, sans-serif', fontWeight: '700', cursor: peticion.trim() && !enviando ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                {enviando ? 'Enviando...' : '➤ Enviar petición'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MERCADO */}
      {activeTab === 'mercado' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
            {[
              { label: 'BALANCE', value: balance, color: balance >= 0 ? '#22C55E' : '#EF4444' },
              { label: 'SALIDAS', value: totalVentas, color: '#22C55E' },
              { label: 'FICHAJES', value: totalFichajes, color: '#EF4444' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#0F1E38', padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '900', color: stat.color, fontFamily: 'Humane, sans-serif', lineHeight: 1 }}>
                  {balance < 0 && stat.label === 'BALANCE' ? '-' : ''}{Math.abs(stat.value)}<span style={{ fontSize: '13px' }}>M€</span>
                </div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', fontFamily: 'Archivo, sans-serif', marginTop: '4px', letterSpacing: '1px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Ventas */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ background: '#22C55E', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontFamily: 'Humane, sans-serif', fontSize: '18px', letterSpacing: '1px' }}>VENTAS</span>
              <button onClick={() => { setShowModalVenta(true); setSearch('') }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <div style={{ padding: '6px', minHeight: '50px' }}>
              {ventas.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontFamily: 'Archivo, sans-serif', padding: '14px 0', fontSize: '12px' }}>Sin ventas</p>}
              {ventas.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#152445' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                  <span style={{ flex: 1, fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{p.name}</span>
                  {editingValor === p.id ? (
                    <input autoFocus type="number" defaultValue={p.valor} onBlur={e => { setVentas(prev => prev.map(v => v.id === p.id ? { ...v, valor: parseFloat(e.target.value) || 0 } : v)); setEditingValor(null) }} style={{ width: '60px', padding: '3px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', fontSize: '12px', background: '#0A1628', color: '#fff', outline: 'none' }} />
                  ) : (
                    <span onClick={() => setEditingValor(p.id)} style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '12px', color: '#22C55E', cursor: 'pointer' }}>+{p.valor}M€</span>
                  )}
                  <button onClick={() => setVentas(prev => prev.filter(v => v.id !== p.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Fichajes */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ background: '#0D4491', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontFamily: 'Humane, sans-serif', fontSize: '18px', letterSpacing: '1px' }}>FICHAJES</span>
              <button onClick={() => { setShowModalFichaje(true); setSearch('') }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <div style={{ padding: '6px', minHeight: '50px' }}>
              {fichajes.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontFamily: 'Archivo, sans-serif', padding: '14px 0', fontSize: '12px' }}>Sin fichajes</p>}
              {fichajes.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#152445' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                  <span style={{ flex: 1, fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{p.name}</span>
                  {editingValor === p.id ? (
                    <input autoFocus type="number" defaultValue={p.valor} onBlur={e => { setFichajes(prev => prev.map(f => f.id === p.id ? { ...f, valor: parseFloat(e.target.value) || 0 } : f)); setEditingValor(null) }} style={{ width: '60px', padding: '3px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', fontSize: '12px', background: '#0A1628', color: '#fff', outline: 'none' }} />
                  ) : (
                    <span onClick={() => setEditingValor(p.id)} style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '12px', color: '#EF4444', cursor: 'pointer' }}>-{p.valor}M€</span>
                  )}
                  <button onClick={() => setFichajes(prev => prev.filter(f => f.id !== p.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SALARIOS */}
      {activeTab === 'salarios' && (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '36px', margin: 0 }}>💶</p>
          <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: '14px', marginTop: '12px', color: 'rgba(255,255,255,0.3)' }}>Sección de salarios — próximamente</p>
        </div>
      )}

      {/* Modal Venta */}
      {showModalVenta && (
        <div onClick={() => { setShowModalVenta(false); setSelectedPlayer(null) }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', width: '90%', maxWidth: '400px', maxHeight: '580px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ background: '#22C55E', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: 'Archivo, sans-serif' }}>Añadir venta</span>
              <button onClick={() => { setShowModalVenta(false); setSelectedPlayer(null) }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <input autoFocus placeholder="Buscar jugador del Zaragoza..." value={search} onChange={e => { setSearch(e.target.value); setSelectedPlayer(null) }} style={inputStyle} />
            </div>
            {selectedPlayer && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#152445' }}>
                  <img src={selectedPlayer.photo || DEFAULT_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} />
                </div>
                <span style={{ flex: 1, fontFamily: 'Archivo, sans-serif', fontWeight: '600', color: '#fff' }}>{selectedPlayer.name}</span>
                <input type="number" placeholder="M€" value={valor} onChange={e => setValor(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontFamily: 'Archivo, sans-serif', background: '#152445', color: '#fff', outline: 'none' }} />
                <button onClick={addVenta} style={{ background: '#22C55E', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontWeight: '700' }}>Añadir</button>
              </div>
            )}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
              {search.length < 2 && <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Archivo, sans-serif', fontSize: '13px' }}>🔍 Busca un jugador del Zaragoza</div>}
              {filteredVenta.map(p => (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: selectedPlayer?.id === p.id ? 'rgba(34,197,94,0.12)' : 'transparent' }}
                  onMouseEnter={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#152445' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '14px', color: '#fff' }}>{p.name}</div>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{p.position}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Fichaje */}
      {showModalFichaje && (
        <div onClick={() => { setShowModalFichaje(false); setSelectedPlayer(null) }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', width: '90%', maxWidth: '400px', maxHeight: '580px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ background: '#0D4491', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: 'Archivo, sans-serif' }}>Añadir fichaje</span>
              <button onClick={() => { setShowModalFichaje(false); setSelectedPlayer(null) }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <input autoFocus placeholder="Buscar jugador externo..." value={search} onChange={e => { setSearch(e.target.value); setSelectedPlayer(null) }} style={inputStyle} />
            </div>
            {selectedPlayer && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#152445' }}>
                  <img src={selectedPlayer.photo || DEFAULT_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} />
                </div>
                <span style={{ flex: 1, fontFamily: 'Archivo, sans-serif', fontWeight: '600', color: '#fff' }}>{selectedPlayer.name}</span>
                <input type="number" placeholder="M€" value={valor} onChange={e => setValor(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontFamily: 'Archivo, sans-serif', background: '#152445', color: '#fff', outline: 'none' }} />
                <button onClick={addFichaje} style={{ background: '#0D4491', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontWeight: '700' }}>Añadir</button>
              </div>
            )}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
              {search.length < 2 && <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Archivo, sans-serif', fontSize: '13px' }}>🔍 Busca un jugador externo</div>}
              {filteredFichaje.map(p => (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: selectedPlayer?.id === p.id ? 'rgba(13,68,145,0.3)' : 'transparent' }}
                  onMouseEnter={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#152445' }}>
                    <img src={p.photo || DEFAULT_PHOTO} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '600', fontSize: '14px', color: '#fff' }}>{p.name}</div>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{p.team} · {p.position}</div>
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