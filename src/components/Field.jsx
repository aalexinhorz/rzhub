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

  async function capturarCanvas() {
    const img = fieldRef.current.querySelector('img')
    // Esperar el evento real de carga del PNG en vez de un timeout fijo:
    // con conexiones lentas 300ms no bastan y html2canvas capturaba el
    // fondo del campo en blanco (y el título en blanco encima quedaba
    // invisible sobre ese fondo).
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = '/CAMPO_PARA_WEB.png'
    })
    // Sin esto, html2canvas puede capturar antes de que las fuentes
    // personalizadas (Archivo/Humane) terminen de cargar y usa una
    // fuente de sistema con métricas distintas, descuadrando los
    // textos de las cards.
    await document.fonts.ready
    const canvas = await html2canvas(fieldRef.current, {
      scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false,
    })
    img.src = '/CAMPO_PARA_WEB.svg'
    return canvas
  }

  async function handleDownload() {
    if (!fieldRef.current) return
    try {
      const canvas = await capturarCanvas()
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

  function abrirCompositorMobile(texto, urlWeb) {
    // No hay forma de saber desde el navegador si la app de X está
    // instalada: probamos su esquema nativo y, si la pestaña sigue visible
    // pasado un margen (la app no se abrió), caemos a la versión web.
    const urlApp = `twitter://post?message=${texto}`
    let volvioAlNavegador = false
    const marcarVuelta = () => { if (document.hidden) volvioAlNavegador = true }
    document.addEventListener('visibilitychange', marcarVuelta)
    window.location.href = urlApp
    setTimeout(() => {
      document.removeEventListener('visibilitychange', marcarVuelta)
      if (!volvioAlNavegador) window.location.href = urlWeb
    }, 1500)
  }

  async function handleCompartirX() {
    if (!fieldRef.current) return
    // X no permite adjuntar imágenes vía intent link, solo texto: abrimos
    // el compositor con el texto listo y copiamos la imagen al
    // portapapeles para que el usuario solo tenga que pegarla (Ctrl/Cmd+V).
    //
    // Safari (y cada vez más Chrome) exige que clipboard.write() se llame
    // de forma SÍNCRONA dentro del gesto de clic, sin ningún await previo;
    // por eso el ClipboardItem recibe la promesa del blob directamente en
    // vez de esperar a que html2canvas termine antes de invocar write().
    const esMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
    const soportaImagen = !!(navigator.clipboard?.write && window.ClipboardItem)

    const copiaPromise = soportaImagen
      ? navigator.clipboard
          .write([
            new ClipboardItem({
              'image/png': capturarCanvas().then(canvas => new Promise(resolve => canvas.toBlob(resolve, 'image/png'))),
            }),
          ])
          .then(() => true)
          .catch(e => {
            console.error('No se pudo copiar la imagen al portapapeles:', e)
            return false
          })
      : Promise.resolve(false)

    const texto = encodeURIComponent(`Mi alineación ideal: ${teamName || 'El XI del Real Zaragoza'} ⚽💙\n#RealZaragoza #RZHub\n(Alineación Copiada 📋​) Pégala aquí 👇 `)
    const urlWeb = `https://twitter.com/intent/tweet?text=${texto}`

    if (esMobile) {
      // El salto a la app por esquema personalizado (twitter://) solo
      // funciona si se dispara de forma SÍNCRONA dentro del toque del
      // usuario, sin ningún await antes: si esperamos aunque sea a
      // comprobar el permiso, el móvil lo bloquea y el primer toque no
      // hace nada. Por eso aquí no se espera a la copia antes de saltar.
      abrirCompositorMobile(texto, urlWeb)
      const copiada = await copiaPromise
      if (!copiada) {
        alert('No se pudo copiar la imagen al portapapeles. Descárgala con el botón "Descargar" y adjúntala tú mismo en el tweet.')
      }
      return
    }

    // Desktop: sí esperamos la confirmación real de la copia antes de
    // abrir la pestaña, para no llevar al usuario a X sin la imagen lista.
    const copiada = await copiaPromise

    if (copiada) {
      window.open(urlWeb, '_blank')
    } else {
      alert('No se pudo copiar la imagen al portapapeles, así que no te llevamos a X. Descárgala con el botón "Descargar" y adjúntala tú mismo en el tweet.')
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: '12px', gap: '8px' }}>
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
        <button onClick={handleCompartirX} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(29,155,240,0.4)', background: 'rgba(29,155,240,0.08)', color: '#1da1f2', fontWeight: '700', fontSize: '13px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(29,155,240,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(29,155,240,0.08)'}
        >
          𝕏 Compartir
        </button>
      </div>

      {/* Campo */}
      <div ref={fieldRef} style={{ width: '100%', aspectRatio: '540 / 675', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        <img src="/CAMPO_PARA_WEB.svg" alt="campo" crossOrigin="anonymous"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />

        {/* Título — padding generoso para no solapar cards */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px 16px 0px 16px', zIndex: 10 }}>
          {editingName ? (
            <input autoFocus value={teamName} onChange={e => setTeamName(e.target.value)}
              onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(24px, 5vw, 44px)', textTransform: 'uppercase', color: '#ffffff', border: 'none', borderBottom: '2px solid #ffffff', outline: 'none', background: 'transparent', width: '100%', letterSpacing: '0px', lineHeight: '0.9' }} />
          ) : (
            <h2 onClick={() => setEditingName(true)} title="Clic para editar"
              style={{ color: '#ffffff', fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(24px, 5vw, 44px)', textTransform: 'uppercase', margin: 0, letterSpacing: '0px', cursor: 'text', userSelect: 'none', lineHeight: '0.9' }}>
              {teamName}
            </h2>
          )}
          <div style={{ display: 'inline-block', background: '#FFC800', color: '#060D1A', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', fontFamily: 'Archivo, sans-serif' }}>
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
          <div onClick={e => e.stopPropagation()} style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '90%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ background: '#0D4491', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#152445', color: '#fff', fontSize: '15px', fontFamily: 'Archivo, sans-serif', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FFC800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#060D1A' }}>
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
                <button onClick={confirmarGuardar} disabled={guardando || !nombreGuardado.trim()} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#FFC800', color: '#060D1A', fontSize: '14px', fontFamily: 'Archivo, sans-serif', fontWeight: '700', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
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