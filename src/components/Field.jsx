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
  const [capturing, setCapturing] = useState(false)

  async function handleDownload() {
    if (!fieldRef.current) return
    setCapturing(true)

    try {
      window.scrollTo(0, 0)
      await new Promise(r => setTimeout(r, 100))

      // Clonar el campo
      const original = fieldRef.current
      const clone = original.cloneNode(true)

      const fieldW = original.getBoundingClientRect().width

      // Posicionar el clon fuera de pantalla
      clone.style.position = 'fixed'
      clone.style.top = '-9999px'
      clone.style.left = '0'
      clone.style.width = `${fieldW}px`
      clone.style.overflow = 'hidden'
      clone.style.borderRadius = '12px'
      document.body.appendChild(clone)

      // Cambiar imagen de campo a PNG en el clon
      const cloneImg = clone.querySelector('img')
      if (cloneImg) cloneImg.src = '/CAMPO_PARA_WEB.png'

      // Ocultar suplentes en el clon
      clone.querySelectorAll('[data-sub-row]').forEach(el => { el.style.display = 'none' })

      // Fijar tamaños de tarjetas en el clon
      const cardWpx = Math.round(fieldW * 0.13)
      const cardHpx = Math.round(fieldW * 0.11)
      const slotWpx = Math.round(fieldW * 0.15)

      clone.querySelectorAll('[data-card]').forEach(el => { el.style.width = `${cardWpx}px` })
      clone.querySelectorAll('[data-card-photo]').forEach(el => {
        el.style.height = `${cardHpx}px`
        el.style.overflow = 'hidden'
        el.style.position = 'relative'
      })
      clone.querySelectorAll('[data-slot-container]').forEach(el => { el.style.width = `${slotWpx}px` })
      clone.querySelectorAll('[data-card-container]').forEach(el => {
        el.style.width = `${cardWpx}px`
        el.style.overflow = 'hidden'
      })

      // Forzar overflow hidden en todas las fotos del clon
      clone.querySelectorAll('img').forEach(img => {
        if (img !== cloneImg) {
          img.style.maxWidth = '100%'
          img.style.maxHeight = '100%'
          img.style.objectFit = 'cover'
          img.style.objectPosition = '50% 15%'
        }
      })

      await new Promise(r => setTimeout(r, 500))

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: fieldW,
        height: original.getBoundingClientRect().height,
      })

      document.body.removeChild(clone)

      const link = document.createElement('a')
      link.download = `${teamName || 'alineacion'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

    } catch (error) {
      console.error('Error al descargar:', error)
    } finally {
      setCapturing(false)
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
        {guardado ? (
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '24px', background: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif' }}>
            ✅ ¡Guardado en la comunidad!
          </div>
        ) : (
          <button onClick={abrirModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px', border: '2px solid #27ae60', background: 'white', color: '#27ae60', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
            💾 Guardar en comunidad
          </button>
        )}
        {window.innerWidth > 640 && (
          <button onClick={handleDownload} disabled={capturing} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px', border: '2px solid #0B4390', background: 'white', color: '#0B4390', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif', cursor: capturing ? 'wait' : 'pointer', opacity: capturing ? 0.7 : 1 }}>
            {capturing ? '⏳ Generando...' : '⬇ Descargar'}
          </button>
        )}
      </div>

      <div ref={fieldRef} style={{ width: '100%', aspectRatio: '540 / 675', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        <img src="/CAMPO_PARA_WEB.svg" alt="campo" crossOrigin="anonymous"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 20px 0px 20px', zIndex: 10 }}>
          {editingName ? (
            <input autoFocus value={teamName} onChange={e => setTeamName(e.target.value)}
              onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(32px, 7vw, 62px)', textTransform: 'uppercase', color: '#0B4390', border: 'none', borderBottom: '2px solid #0B4390', outline: 'none', background: 'transparent', width: '100%', letterSpacing: '0px', lineHeight: '0.85' }} />
          ) : (
            <h2 onClick={() => setEditingName(true)} title="Clic para editar"
              style={{ color: '#0B4390', fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(32px, 7vw, 62px)', textTransform: 'uppercase', margin: 0, letterSpacing: '0px', cursor: 'text', userSelect: 'none', lineHeight: '0.85' }}>
              {teamName}
            </h2>
          )}
          <div style={{ display: 'inline-block', background: '#0B4390', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 10px', borderRadius: '4px', marginTop: '6px', fontFamily: 'sans-serif' }}>
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
              capturing={capturing}
            />
          ))}
        </div>
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#0B4390', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', fontFamily: 'sans-serif' }}>Guardar alineación</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ fontSize: '12px', color: '#888', fontFamily: 'sans-serif', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Nombre de la alineación
              </label>
              <input
                autoFocus
                value={nombreGuardado}
                onChange={e => setNombreGuardado(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmarGuardar()}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '10px 12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f5c400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0B4390' }}>
                    {nombreUsuario.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
                <span style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#555' }}>
                  Se publicará como <strong>{nombreUsuario.split(' ')[0]}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#666', fontSize: '14px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={confirmarGuardar} disabled={guardando || !nombreGuardado.trim()} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#0B4390', color: 'white', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: 'bold', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
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