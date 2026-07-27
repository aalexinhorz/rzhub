import { useRef, useState, useEffect } from 'react'
import PlayerSlot from './PlayerSlot'
import { drawLineupCanvas } from '../lib/lineupCanvas'

// Interpola linealmente entre [min, max] según el ancho real del campo
// (no del viewport). clamp(min, Xvw, max) parecía razonable en pantalla,
// pero html2canvas no siempre resuelve "vw" igual que el navegador real
// al capturar la alineación como imagen, descuadrando cards y título.
// Con un número en px ya resuelto en JS no hay nada que reinterpretar.
function scaleByFieldWidth(fieldWidth, min, max, refMin = 320, refMax = 620) {
  if (!fieldWidth) return max
  const t = Math.min(1, Math.max(0, (fieldWidth - refMin) / (refMax - refMin)))
  return min + (max - min) * t
}

// Para que el input de edición del nombre ocupe solo lo que el texto
// realmente pesa (y así la formación pueda seguir en la misma fila
// mientras quepa, en vez de bajar siempre por tener un input a 100%).
let measureCanvas
function measureTextWidth(text, font) {
  if (!measureCanvas) measureCanvas = document.createElement('canvas')
  const ctx = measureCanvas.getContext('2d')
  ctx.font = font
  return ctx.measureText(text).width
}

export default function Field({ slotsLayout, slots, subs, teamName, setTeamName, formation, allPlayers, onSelectPlayer, onRemovePlayer, onSelectSub, onRemoveSub, onAddCustomPlayer, onGuardar, user }) {
  const fieldRef = useRef(null)
  const [editingName, setEditingName] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [nombreGuardado, setNombreGuardado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [fieldWidth, setFieldWidth] = useState(0)

  useEffect(() => {
    if (!fieldRef.current) return
    const observer = new ResizeObserver(entries => {
      setFieldWidth(entries[0].contentRect.width)
    })
    observer.observe(fieldRef.current)
    return () => observer.disconnect()
  }, [])

  const titleFontSize = scaleByFieldWidth(fieldWidth, 24, 44)

  // html2canvas y dom-to-image-more "capturan" el DOM reimplementando (o
  // delegando a un <foreignObject> SVG) su propio layout/texto, y ambas
  // se comportan de forma distinta e inconsistente entre Chrome, Safari
  // de escritorio y Safari de iPhone — nunca coincidía de forma fiable
  // con lo que ya se veía en pantalla. drawLineupCanvas dibuja la
  // alineación a mano con Canvas 2D (drawImage/fillText/arc), que sí es
  // consistente entre navegadores.
  async function capturarCanvas() {
    return drawLineupCanvas({ slotsLayout, slots, subs, teamName, formation })
  }

  async function capturarPNG() {
    const canvas = await capturarCanvas()
    return canvas.toDataURL('image/png')
  }

  async function capturarBlob() {
    const canvas = await capturarCanvas()
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  }

  async function handleDownload() {
    if (!fieldRef.current) return
    try {
      const dataUrl = await capturarPNG()
      const link = document.createElement('a')
      link.download = `${teamName || 'alineacion'}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error al descargar:', error)
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
    // vez de esperar a que termine la captura antes de invocar write().
    const esMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
    const soportaImagen = !!(navigator.clipboard?.write && window.ClipboardItem)

    const copiaPromise = soportaImagen
      ? navigator.clipboard
          .write([
            new ClipboardItem({
              'image/png': capturarBlob(),
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

      {/* Botones encima del campo — los tres reparten el mismo ancho */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '12px', gap: '8px' }}>
        {guardado ? (
          <div style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 12px', borderRadius: '8px', background: 'rgba(39,174,96,0.15)', color: '#27ae60', fontWeight: '700', fontSize: '13px', fontFamily: 'Archivo, sans-serif', border: '1px solid rgba(39,174,96,0.3)', textAlign: 'center' }}>
            ✅ ¡Guardado en la comunidad!
          </div>
        ) : (
          <button onClick={abrirModal} style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,200,0,0.4)', background: 'rgba(255,200,0,0.08)', color: '#ffc800', fontWeight: '700', fontSize: '13px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,200,0,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,200,0,0.08)'}
          >
            Guardar en comunidad
          </button>
        )}
        <button onClick={handleDownload} style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '13px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          ⬇ Descargar
        </button>
        <button onClick={handleCompartirX} style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(29,155,240,0.4)', background: 'rgba(29,155,240,0.08)', color: '#1da1f2', fontWeight: '700', fontSize: '13px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
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

        {/* Título — padding generoso para no solapar cards. Nombre y
            formación van en la misma fila (flex-wrap): si el nombre del
            equipo no deja hueco para la formación, esta baja sola a una
            segunda línea de forma automática. */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px 16px 0px 16px', zIndex: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {editingName ? (
            <input autoFocus value={teamName} onChange={e => setTeamName(e.target.value)}
              onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              style={{
                fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: `${titleFontSize}px`, textTransform: 'uppercase', color: '#ffffff', border: 'none', borderBottom: '2px solid #ffffff', outline: 'none', background: 'transparent', letterSpacing: '0px', lineHeight: '0.9',
                // Ancho pegado al texto real (no 100%) para que la
                // formación solo baje de línea cuando de verdad no cabe.
                width: `${Math.max(60, Math.ceil(measureTextWidth((teamName || '').toUpperCase(), `700 ${titleFontSize}px Humane, sans-serif`)) + 16)}px`,
                maxWidth: '100%',
              }} />
          ) : (
            <h2 onClick={() => setEditingName(true)} title="Clic para editar"
              style={{ color: '#ffffff', fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: `${titleFontSize}px`, textTransform: 'uppercase', margin: 0, letterSpacing: '0px', cursor: 'text', userSelect: 'none', lineHeight: '0.9' }}>
              {teamName}
            </h2>
          )}
          <div style={{ display: 'inline-block', background: '#FFC800', color: '#060D1A', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', fontFamily: 'Archivo, sans-serif', flexShrink: 0 }}>
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
              fieldWidth={fieldWidth}
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