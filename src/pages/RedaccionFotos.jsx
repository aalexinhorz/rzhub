import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'
import useMatchPhotos, { EQUIPOS, BUCKET, fetchMatchAuthor, useMatchAuthor } from '../hooks/useMatchPhotos'
import SEO from '../components/SEO'

const EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function formatFecha(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function GaleriaItem({ match, onEditar, onEliminar }) {
  const autor = useMatchAuthor(match.key)

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <img src={match.photos[0].url} alt="" style={{ width: '72px', height: '54px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ background: '#e3ecfa', color: '#0B4390', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
            {EQUIPOS[match.equipo]}
          </span>
          <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '12px' }}>{match.photos.length} foto{match.photos.length === 1 ? '' : 's'}</span>
        </div>
        <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '700', color: '#111' }}>vs {match.rival}</p>
        <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: '12px', color: '#999' }}>
          {formatFecha(match.matchDate)} · {match.sede === 'local' ? 'Casa' : 'Fuera'}{autor ? ` · Fotos por ${autor}` : ''}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onEditar(match, autor)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '6px', padding: '8px 16px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#333' }}>
          Editar
        </button>
        <button onClick={() => onEliminar(match)} style={{ background: '#fdecea', border: 'none', borderRadius: '6px', padding: '8px 16px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#c62828' }}>
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default function RedaccionFotos() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { matches, loading: cargandoGalerias, refetch } = useMatchPhotos()

  const [vista, setVista] = useState('lista')
  const [editando, setEditando] = useState(null)

  const [equipo, setEquipo] = useState('primer-equipo')
  const [rival, setRival] = useState('')
  const [fecha, setFecha] = useState('')
  const [sede, setSede] = useState('visitante')
  const [autor, setAutor] = useState('')
  const [archivos, setArchivos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const [fotosExistentes, setFotosExistentes] = useState([])
  const [ordenCambiado, setOrdenCambiado] = useState(false)
  const [guardandoOrden, setGuardandoOrden] = useState(false)
  const [borrandoId, setBorrandoId] = useState(null)
  const dragIndexRef = useRef(null)

  const puedeSubir = profile?.es_fotografo || profile?.es_redactor

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (profile !== null && !puedeSubir) { navigate('/'); return }
  }, [user, profile, loading])

  function nuevaGaleria() {
    setEditando(null)
    setEquipo('primer-equipo')
    setRival('')
    setFecha('')
    setSede('visitante')
    setAutor('')
    setArchivos([])
    setFotosExistentes([])
    setOrdenCambiado(false)
    setMensaje('')
    setVista('formulario')
  }

  async function editarGaleria(match, autorConocido) {
    setEditando(match)
    setEquipo(match.equipo)
    setRival(match.rival)
    setFecha(match.matchDate)
    setSede(match.sede)
    setAutor(autorConocido ?? (await fetchMatchAuthor(match.key)) ?? '')
    setArchivos([])
    setFotosExistentes(match.photos)
    setOrdenCambiado(false)
    setMensaje('')
    setVista('formulario')
  }

  async function eliminarFotoExistente(photo) {
    if (!confirm('¿Eliminar esta foto de la galería?')) return
    setBorrandoId(photo.id)
    const { error } = await supabase.storage.from(BUCKET).remove([photo.id])
    setBorrandoId(null)
    if (error) { alert('Error al eliminar la foto: ' + error.message); return }
    setFotosExistentes(prev => prev.filter(p => p.id !== photo.id))
    refetch()
  }

  function handleDragStart(i) {
    dragIndexRef.current = i
  }

  function handleDragOver(e, i) {
    e.preventDefault()
    const from = dragIndexRef.current
    if (from === null || from === i) return
    setFotosExistentes(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(i, 0, moved)
      return next
    })
    dragIndexRef.current = i
    setOrdenCambiado(true)
  }

  function handleDragEnd() {
    dragIndexRef.current = null
  }

  async function guardarOrden() {
    setGuardandoOrden(true)
    const rivalSlug = slugify(rival)
    const prefix = `${fecha}_${equipo}_${sede}_${rivalSlug}_`

    // Movemos primero a nombres temporales para no pisar unas fotos con
    // otras si dos posiciones se intercambian entre sí.
    const temporales = []
    for (let i = 0; i < fotosExistentes.length; i++) {
      const p = fotosExistentes[i]
      const ext = p.id.split('.').pop()
      const tmpName = `__tmp_${Date.now()}_${i}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).move(p.id, tmpName)
      if (error) { alert('Error al reordenar: ' + error.message); setGuardandoOrden(false); return }
      temporales.push({ tmpName, ext })
    }

    const reordenadas = []
    for (let i = 0; i < temporales.length; i++) {
      const { tmpName, ext } = temporales[i]
      const finalName = `${prefix}${String(i + 1).padStart(2, '0')}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).move(tmpName, finalName)
      if (error) { alert('Error al reordenar: ' + error.message); setGuardandoOrden(false); return }
      const { publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(finalName).data
      reordenadas.push({ id: finalName, url: publicUrl, seq: i + 1 })
    }

    setFotosExistentes(reordenadas)
    setOrdenCambiado(false)
    setGuardandoOrden(false)
    refetch()
  }

  async function eliminarGaleria(match) {
    if (!confirm(`¿Eliminar la galería de ${EQUIPOS[match.equipo]} vs ${match.rival}? Se borrarán las ${match.photos.length} fotos.`)) return

    const paths = [...match.photos.map(p => p.id), `_meta/${match.key}.json`]
    const { error } = await supabase.storage.from(BUCKET).remove(paths)
    if (error) { alert('Error al eliminar: ' + error.message); return }

    refetch()
  }

  function handleArchivos(e) {
    const files = Array.from(e.target.files || []).filter(f => EXTENSIONS.has(f.name.split('.').pop().toLowerCase()))
    setArchivos(files.map(file => ({ file, preview: URL.createObjectURL(file) })))
    setMensaje('')
  }

  function quitarArchivo(i) {
    setArchivos(prev => prev.filter((_, idx) => idx !== i))
  }

  async function subirFotos() {
    if (!rival.trim()) { setMensaje('Falta el nombre del rival'); return }
    if (!fecha) { setMensaje('Falta la fecha del partido'); return }
    if (archivos.length === 0 && !autor.trim()) { setMensaje('Selecciona al menos una foto o escribe un autor'); return }

    setSubiendo(true)
    setMensaje('')

    const rivalSlug = slugify(rival)
    const prefix = `${fecha}_${equipo}_${sede}_${rivalSlug}_`
    const metaKey = `${fecha}__${equipo}__${rivalSlug}`

    let subidas = 0
    if (archivos.length > 0) {
      const { data: existentes } = await supabase.storage.from(BUCKET).list('', { search: prefix })
      let seq = (existentes || []).length

      for (const { file } of archivos) {
        seq += 1
        setProgreso({ actual: subidas + 1, total: archivos.length })

        const ext = file.name.split('.').pop().toLowerCase()
        const destName = `${prefix}${String(seq).padStart(2, '0')}.${ext}`

        const { error } = await supabase.storage.from(BUCKET).upload(destName, file, { contentType: file.type, upsert: true })
        if (error) {
          setMensaje(`Error subiendo ${file.name}: ${error.message}`)
          setSubiendo(false)
          setProgreso(null)
          return
        }
        subidas += 1
      }
    }

    if (autor.trim()) {
      const metaBlob = new Blob([JSON.stringify({ author: autor.trim() })], { type: 'application/json' })
      await supabase.storage.from(BUCKET).upload(`_meta/${metaKey}.json`, metaBlob, { contentType: 'application/json', upsert: true })
    }

    setSubiendo(false)
    setProgreso(null)
    setArchivos([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    setMensaje(`✅ ${subidas > 0 ? `${subidas} foto${subidas === 1 ? '' : 's'} subida${subidas === 1 ? '' : 's'}` : 'Autor actualizado'} correctamente`)
    refetch()
    setTimeout(() => { setMensaje(''); setVista('lista') }, 1200)
  }

  if (loading || profile === null) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#999' }}>Cargando...</p>
    </div>
  )

  if (!puedeSubir) return null

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f8f9fa' }}>
      <SEO title="Subir fotos | RZ Hub" description="Panel de subida de fotos de RZ Hub." path="/redaccion-fotos" noindex />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(40px, 8vw, 60px)', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: 0 }}>
            Fotos
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            {vista === 'lista' ? (
              <>
                <Link to="/fotogaleria" style={{ background: 'none', border: '2px solid #0B4390', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#0B4390', textDecoration: 'none' }}>
                  Ver fotogalería →
                </Link>
                <button onClick={nuevaGaleria} style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  + Nueva galería
                </button>
              </>
            ) : (
              <button onClick={() => setVista('lista')} style={{ background: 'none', border: '2px solid #0B4390', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#0B4390', cursor: 'pointer' }}>
                ← Volver
              </button>
            )}
          </div>
        </div>

        {mensaje && (
          <div style={{ background: mensaje.includes('Error') || mensaje.includes('Falta') ? '#fdecea' : '#e8f5e9', color: mensaje.includes('Error') || mensaje.includes('Falta') ? '#c62828' : '#2e7d32', padding: '12px 16px', borderRadius: '8px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>
            {mensaje}
          </div>
        )}

        {vista === 'lista' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cargandoGalerias ? (
              <p style={{ fontFamily: 'sans-serif', color: '#999', textAlign: 'center', padding: '32px' }}>Cargando...</p>
            ) : matches.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ fontFamily: 'sans-serif', color: '#999', fontSize: '15px', margin: 0 }}>Todavía no hay ninguna fotogalería.</p>
              </div>
            ) : (
              matches.map(m => (
                <GaleriaItem key={m.key} match={m} onEditar={editarGaleria} onEliminar={eliminarGaleria} />
              ))
            )}
          </div>
        )}

        {vista === 'formulario' && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

          {editando && (
            <p style={{ margin: '0 0 20px', fontFamily: 'sans-serif', fontSize: '13px', color: '#888' }}>
              Añadiendo fotos o actualizando el autor de una galería existente. Si cambias equipo, rival, fecha o sede se creará una galería nueva en vez de modificar esta.
            </p>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Equipo</label>
            <select value={equipo} onChange={e => setEquipo(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', background: 'white' }}>
              {Object.entries(EQUIPOS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Rival *</label>
              <input value={rival} onChange={e => setRival(e.target.value)} placeholder="Ej: Gimnàstic de Tarragona" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Fecha del partido *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Sede</label>
              <select value={sede} onChange={e => setSede(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', background: 'white' }}>
                <option value="visitante">Fuera</option>
                <option value="local">Casa</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Autor de las fotos</label>
            <input value={autor} onChange={e => setAutor(e.target.value)} placeholder="Ej: Telmo Miñano" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
            <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: '12px', color: '#aaa' }}>Se muestra en la fotogalería. Puedes dejarlo vacío.</p>
          </div>

          {fotosExistentes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Fotos ya subidas ({fotosExistentes.length}) — arrastra para reordenar
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
                {fotosExistentes.map((p, i) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', cursor: 'grab', opacity: borrandoId === p.id ? 0.4 : 1, border: '2px solid transparent' }}
                  >
                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                    <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', fontFamily: 'sans-serif', fontWeight: '700', padding: '1px 6px', borderRadius: '4px' }}>{i + 1}</span>
                    <button
                      onClick={() => eliminarFotoExistente(p)}
                      disabled={borrandoId === p.id}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {ordenCambiado && (
                <button onClick={guardarOrden} disabled={guardandoOrden} style={{ marginTop: '12px', background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', cursor: guardandoOrden ? 'default' : 'pointer', opacity: guardandoOrden ? 0.7 : 1 }}>
                  {guardandoOrden ? 'Guardando orden...' : '✓ Guardar orden'}
                </button>
              )}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>{fotosExistentes.length > 0 ? 'Añadir más fotos' : 'Fotos'}</label>
            <button onClick={() => fileInputRef.current.click()} style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              📁 Elegir fotos
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleArchivos} style={{ display: 'none' }} />

            {archivos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', marginTop: '16px' }}>
                {archivos.map(({ preview }, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                    <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => quitarArchivo(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={subirFotos} disabled={subiendo} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#0B4390', color: 'white', fontSize: '15px', fontFamily: 'sans-serif', fontWeight: '700', cursor: subiendo ? 'default' : 'pointer', opacity: subiendo ? 0.7 : 1 }}>
            {subiendo
              ? (progreso ? `Subiendo ${progreso.actual}/${progreso.total}...` : 'Guardando...')
              : archivos.length > 0
                ? `🚀 Subir ${archivos.length} foto${archivos.length === 1 ? '' : 's'}`
                : '💾 Guardar autor'}
          </button>
        </div>
        )}

      </div>
    </div>
  )
}
