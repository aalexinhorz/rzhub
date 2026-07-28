import { useState, useEffect } from 'react'
import useAuth, { supabase } from '../hooks/useAuth'

function QuedadaCard({ quedada, isOwner, onDelete }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0', position: 'relative' }}>
      {isOwner && (
        <button onClick={() => onDelete(quedada.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.05)', border: 'none', color: '#999', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
      )}
      <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '15px', fontWeight: '700', color: '#0B4390' }}>
        📍 {quedada.lugar}
      </div>
      <div style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#666', marginTop: '4px' }}>
        {quedada.ciudad} · 🕒 {quedada.hora}
      </div>
      {quedada.nota && (
        <div style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#333', marginTop: '8px' }}>{quedada.nota}</div>
      )}
      <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#aaa', marginTop: '10px' }}>
        Propuesto por {quedada.user_name}
      </div>
    </div>
  )
}

export default function QuedadasSection({ partido }) {
  const { user, profile, signInWithGoogle } = useAuth()
  const [quedadas, setQuedadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [ciudad, setCiudad] = useState('')
  const [lugar, setLugar] = useState('')
  const [hora, setHora] = useState('')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (partido) fetchQuedadas()
  }, [partido])

  async function fetchQuedadas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('quedadas')
      .select('*')
      .eq('partido_id', partido.id)
      .order('created_at', { ascending: true })
    if (error) console.error('Error cargando quedadas:', error)
    setQuedadas(data || [])
    setLoading(false)
  }

  function abrirModal() {
    setCiudad('')
    setLugar('')
    setHora('')
    setNota('')
    setShowModal(true)
  }

  async function confirmarQuedada() {
    if (!lugar.trim() || !hora.trim() || !ciudad.trim()) return
    setGuardando(true)
    const nombreUsuario = profile?.name || user.user_metadata?.name || user.email
    await supabase.from('profiles').upsert({ id: user.id, name: nombreUsuario, avatar_url: profile?.avatar_url })
    const { error } = await supabase.from('quedadas').insert({
      partido_id: partido.id,
      user_id: user.id,
      user_name: nombreUsuario,
      ciudad: ciudad.trim(),
      lugar: lugar.trim(),
      hora: hora.trim(),
      nota: nota.trim() || null,
    })
    if (error) console.error('Error guardando quedada:', error)
    await fetchQuedadas()
    setGuardando(false)
    setShowModal(false)
  }

  async function deleteQuedada(id) {
    await supabase.from('quedadas').delete().eq('id', id)
    setQuedadas(prev => prev.filter(q => q.id !== id))
  }

  if (!partido) return null

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(28px, 5vw, 40px)', color: 'white', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>
            Quedadas
          </h2>
          <p style={{ fontFamily: 'sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
            Para quien no viaja desde Zaragoza — organiza dónde veros antes del partido
          </p>
        </div>
        {user ? (
          <button onClick={abrirModal} className="hero-cta" style={{ width: 'auto', padding: '10px 20px' }}>
            + Proponer quedada
          </button>
        ) : (
          <button onClick={signInWithGoogle} className="hero-cta" style={{ width: 'auto', padding: '10px 20px' }}>
            Inicia sesión para proponer
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'sans-serif' }}>Cargando quedadas...</p>
      ) : quedadas.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif', fontSize: '14px', margin: 0 }}>
            Todavía no hay ninguna quedada propuesta para este partido. ¡Sé el primero!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {quedadas.map(q => (
            <QuedadaCard key={q.id} quedada={q} isOwner={user?.id === q.user_id} onDelete={deleteQuedada} />
          ))}
        </div>
      )}

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ background: '#0D4491', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: 'Archivo, sans-serif' }}>Proponer quedada</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Ciudad
              </label>
              <input
                autoFocus
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
                placeholder="Ej. Tarragona"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#152445', color: '#fff', fontSize: '15px', fontFamily: 'Archivo, sans-serif', boxSizing: 'border-box', outline: 'none', marginBottom: '16px' }}
              />
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Sitio
              </label>
              <input
                value={lugar}
                onChange={e => setLugar(e.target.value)}
                placeholder="Ej. Bar Cervantes, Plaza Mayor"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#152445', color: '#fff', fontSize: '15px', fontFamily: 'Archivo, sans-serif', boxSizing: 'border-box', outline: 'none', marginBottom: '16px' }}
              />
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Hora
              </label>
              <input
                value={hora}
                onChange={e => setHora(e.target.value)}
                placeholder="Ej. 2 horas antes del partido"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#152445', color: '#fff', fontSize: '15px', fontFamily: 'Archivo, sans-serif', boxSizing: 'border-box', outline: 'none', marginBottom: '16px' }}
              />
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Nota (opcional)
              </label>
              <textarea
                value={nota}
                onChange={e => setNota(e.target.value)}
                placeholder="Cualquier detalle extra..."
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#152445', color: '#fff', fontSize: '14px', fontFamily: 'Archivo, sans-serif', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button
                  onClick={confirmarQuedada}
                  disabled={guardando || !ciudad.trim() || !lugar.trim() || !hora.trim()}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#FFC800', color: '#060D1A', fontSize: '14px', fontFamily: 'Archivo, sans-serif', fontWeight: '700', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}
                >
                  {guardando ? 'Guardando...' : '📍 Proponer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
