import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import PlayerSlot from './PlayerSlot'

export default function Field({ slotsLayout, slots, subs, teamName, setTeamName, formation, allPlayers, onSelectPlayer, onRemovePlayer, onSelectSub, onRemoveSub, onAddCustomPlayer, onGuardar, user }) {
  const fieldRef = useRef(null)
  const [editingName, setEditingName] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [nombreGuardado, setNombreGuardado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  async function handleDownload() {
    if (!fieldRef.current) return
    try {
      const img = fieldRef.current.querySelector('img')
      img.src = '/CAMPO_PARA_WEB.png'
      await new Promise(r => setTimeout(r, 300))
      const canvas = await html2canvas(fieldRef.current, {
        scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false,
      })
      img.src = '/CAMPO_PARA_WEB.svg'
      const link = document.createElement('a')
      link.download = `${teamName || 'alineacion'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error al descargar:', error)
      const img = fieldRef.current?.querySelector('img')
      if (img) img.src = '/CAMPO_PARA_WEB.svg'
    }
  }

  function abrirModal() {
    if (!user) { alert('Debes iniciar sesión para guardar en la comunidad.'); return }
    setNombreGuardado(teamName)
    setShowModal(true)
  }

  async function confirmarGuardar() {
    setGuardando(true)
    await onGuardar(nombreGuardado)
    setGuardando(false)
    setShowModal(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const nombreUsuario = user?.user_metadata?.name || user?.email || ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '620px', flexShrink: 0 }}>

      {/* Botones encima del campo */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px', gap: '8px' }}>
        {guardado ? (
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 18px', borderRadius: '8px', background: 'rgba(39,174,96,0.15)', color: '#27ae60', fontWeight: '700', fontSize: '13px', fontFamily: 'Archivo, sans-serif', border: '1px solid rgba(39,174,96,0.3)' }}>
            ✅ ¡Guardado en la comunidad!
          </div>
        ) : (
          <button onClick={abrirModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,200,0,0.4)', background: 'rgba(255,200,0,0.08)', color: '#ffc800', fontWeight: '700', fontSize: '13px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,200,0,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,200,0,0.08)'}
          >
            💾 Guardar en comunidad
          </button>
        )}
        {window.innerWidth > 640 && (
          <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '13px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            ⬇ Descargar
          </button>
        )}
      </div>

      {/* Campo */}
      <div ref={fieldRef} style={{ width: '100%', aspectRatio: '540 / 675', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        <img src="/CAMPO_PARA_WEB.svg" alt="campo" crossOrigin="anonymous"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 20px 0px 20px', zIndex: 10 }}>
          {editingName ? (
            <input autoFocus value={teamName} onChange={e => setTeamName(e.target.value)}
              onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(32px, 7vw, 62px)', textTransform: 'uppercase', color: '#ffffff', border: 'none', borderBottom: '2px solid #ffffff', outline: 'none', background: 'transparent', width: '100%', letterSpacing: '0px', lineHeight: '0.85' }} />
          ) : (
            <h2 onClick={() => setEditingName(true)} title="Clic para editar"
              style={{ color: '#ffffff', fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(32px, 7vw, 62px)', textTransform: 'uppercase', margin: 0, letterSpacing: '0px', cursor: 'text', userSelect: 'none', lineHeight: '0.85' }}>
              {teamName}
            </h2>
          )}
          <div style={{ display: 'inline-block', background: '#FFC800', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 10px', borderRadius: '4px', marginTop: '6px', fontFamily: 'sans-serif' }}>
            {formation}
          </div>
        </div>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}>
          {slotsLayout.map(slot => (
            <PlayerSlot
              key={slot.id}
              slot={slot}
              player={slots[slot.id] || null}
              sub1={subs[slot.id]?.[0] || null}
              sub2={subs[slot.id]?.[1] || null}
              allPlayers={allPlayers}
              onSelectPlayer={onSelectPlayer}
              onRemovePlayer={onRemovePlayer}
              onSelectSub={onSelectSub}
              onRemoveSub={onRemoveSub}
              onAddCustomPlayer={onAddCustomPlayer}
            />
          ))}
        </div>
      </div>

      {/* Modal guardar */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '90%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ background: '#0B4390', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: 'Archivo, sans-serif' }}>Guardar alineación</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                Nombre de la alineación
              </label>
              <input
                autoFocus
                value={nombreGuardado}
                onChange={e => setNombreGuardado(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmarGuardar()}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ffc800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0B4390' }}>
                    {nombreUsuario.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
                <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  Se publicará como <strong style={{ color: '#fff' }}>{nombreUsuario.split(' ')[0]}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={confirmarGuardar} disabled={guardando || !nombreGuardado.trim()} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#ffc800', color: '#0a0a0a', fontSize: '14px', fontFamily: 'Archivo, sans-serif', fontWeight: '700', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
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