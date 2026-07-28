import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'

const BUCKET = 'matchphotos'
const EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function RedaccionFotos() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [rival, setRival] = useState('')
  const [fecha, setFecha] = useState('')
  const [sede, setSede] = useState('visitante')
  const [archivos, setArchivos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const puedeSubir = profile?.es_fotografo || profile?.es_redactor

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (profile !== null && !puedeSubir) { navigate('/'); return }
  }, [user, profile, loading])

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
    if (archivos.length === 0) { setMensaje('Selecciona al menos una foto'); return }

    setSubiendo(true)
    setMensaje('')

    const rivalSlug = slugify(rival)
    const prefix = `${fecha}_${sede}_${rivalSlug}_`

    const { data: existentes } = await supabase.storage.from(BUCKET).list('', { search: prefix })
    let seq = (existentes || []).length

    let subidas = 0
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

    setSubiendo(false)
    setProgreso(null)
    setArchivos([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    setMensaje(`✅ ${subidas} foto${subidas === 1 ? '' : 's'} subida${subidas === 1 ? '' : 's'} correctamente`)
  }

  if (loading || profile === null) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#999' }}>Cargando...</p>
    </div>
  )

  if (!puedeSubir) return null

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(40px, 8vw, 60px)', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: 0 }}>
            Subir fotos
          </h1>
          <Link to="/fotogaleria" style={{ background: 'none', border: '2px solid #0B4390', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#0B4390', textDecoration: 'none' }}>
            Ver fotogalería →
          </Link>
        </div>

        {mensaje && (
          <div style={{ background: mensaje.includes('Error') || mensaje.includes('Falta') ? '#fdecea' : '#e8f5e9', color: mensaje.includes('Error') || mensaje.includes('Falta') ? '#c62828' : '#2e7d32', padding: '12px 16px', borderRadius: '8px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>
            {mensaje}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

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
            <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Fotos</label>
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
            {subiendo ? `Subiendo ${progreso?.actual || 0}/${progreso?.total || archivos.length}...` : `🚀 Subir ${archivos.length || ''} foto${archivos.length === 1 ? '' : 's'}`.trim()}
          </button>
        </div>

      </div>
    </div>
  )
}
