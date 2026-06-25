import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'

function generarSlug(titulo) {
  return titulo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 80)
}

export default function Redaccion() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [noticias, setNoticias] = useState([])
  const [vista, setVista] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [contenido, setContenido] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [categoria, setCategoria] = useState('Noticias')
  const [publicada, setPublicada] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (profile !== null && !profile.es_redactor) { navigate('/'); return }
  }, [user, profile, loading])

  useEffect(() => {
    if (user && profile?.es_redactor) fetchNoticias()
  }, [user, profile])

  async function fetchNoticias() {
    const { data } = await supabase
      .from('noticias')
      .select('*')
      .eq('autor_id', user.id)
      .order('created_at', { ascending: false })
    setNoticias(data || [])
  }

  function nuevaNoticia() {
    setEditando(null)
    setTitulo('')
    setExcerpt('')
    setContenido('')
    setImagenUrl('')
    setCategoria('Noticias')
    setPublicada(false)
    setVista('editor')
  }

  function editarNoticia(noticia) {
    setEditando(noticia)
    setTitulo(noticia.titulo)
    setExcerpt(noticia.excerpt || '')
    setContenido(noticia.contenido || '')
    setImagenUrl(noticia.imagen_url || '')
    setCategoria(noticia.categoria || 'Noticias')
    setPublicada(noticia.publicada || false)
    setVista('editor')
  }

  async function guardar(pub) {
    if (!titulo.trim()) { setMensaje('El título es obligatorio'); return }
    setGuardando(true)
    setMensaje('')
    const slug = editando?.slug || generarSlug(titulo) + '-' + Date.now()
    const datos = {
      titulo: titulo.trim(),
      slug,
      excerpt: excerpt.trim(),
      contenido: contenido.trim(),
      imagen_url: imagenUrl.trim(),
      categoria: categoria.trim(),
      autor: profile?.username || profile?.name || user.email,
      autor_id: user.id,
      publicada: pub,
      updated_at: new Date().toISOString(),
    }
    let error
    if (editando) {
      const res = await supabase.from('noticias').update(datos).eq('id', editando.id)
      error = res.error
    } else {
      const res = await supabase.from('noticias').insert(datos)
      error = res.error
    }
    if (error) {
      setMensaje('Error al guardar: ' + error.message)
    } else {
      setMensaje(pub ? '✅ Noticia publicada' : '✅ Borrador guardado')
      await fetchNoticias()
      setTimeout(() => { setMensaje(''); setVista('lista') }, 1500)
    }
    setGuardando(false)
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta noticia?')) return
    await supabase.from('noticias').delete().eq('id', id)
    fetchNoticias()
  }

  if (loading || profile === null) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#999' }}>Cargando...</p>
    </div>
  )

  if (!profile.es_redactor) return null

  const categorias = ['Noticias', 'Mercado', 'Análisis', 'Opinión', 'Previa', 'Crónica']

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(48px, 8vw, 72px)', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: 0 }}>
            Redacción
          </h1>
          {vista === 'lista' ? (
            <button onClick={nuevaNoticia} style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              + Nueva noticia
            </button>
          ) : (
            <button onClick={() => setVista('lista')} style={{ background: 'none', border: '2px solid #0B4390', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#0B4390', cursor: 'pointer' }}>
              ← Volver
            </button>
          )}
        </div>

        {vista === 'lista' && (
          <div>
            {noticias.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ fontFamily: 'sans-serif', color: '#999', fontSize: '15px', margin: 0 }}>No has escrito ninguna noticia todavía.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {noticias.map(n => (
                  <div key={n.id} style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ background: n.publicada ? '#e8f5e9' : '#fff3e0', color: n.publicada ? '#2e7d32' : '#e65100', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {n.publicada ? 'Publicada' : 'Borrador'}
                        </span>
                        <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '12px' }}>{n.categoria}</span>
                      </div>
                      <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '700', color: '#111' }}>{n.titulo}</p>
                      <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: '12px', color: '#999' }}>{new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => editarNoticia(n)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '6px', padding: '8px 16px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#333' }}>
                        Editar
                      </button>
                      <button onClick={() => eliminar(n.id)} style={{ background: '#fdecea', border: 'none', borderRadius: '6px', padding: '8px 16px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#c62828' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {vista === 'editor' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

            {mensaje && (
              <div style={{ background: mensaje.includes('Error') ? '#fdecea' : '#e8f5e9', color: mensaje.includes('Error') ? '#c62828' : '#2e7d32', padding: '12px 16px', borderRadius: '8px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
                {mensaje}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Título *</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Titular de la noticia" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px', fontFamily: 'sans-serif', fontWeight: '700', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Categoría</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', background: 'white' }}>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>URL imagen destacada</label>
                <input value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            {imagenUrl && (
              <div style={{ marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px' }}>
                <img src={imagenUrl} alt="preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '200px', display: 'block' }} onError={e => e.target.style.display = 'none'} />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Entradilla (resumen corto)</label>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Breve resumen que aparece en la portada..." rows={3} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', resize: 'vertical', lineHeight: '1.6' }} />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Contenido</label>
              <textarea value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Escribe aquí el artículo completo..." rows={16} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', resize: 'vertical', lineHeight: '1.8' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => guardar(false)} disabled={guardando} style={{ flex: 1, minWidth: '140px', padding: '14px', borderRadius: '8px', border: '2px solid #0B4390', background: 'white', color: '#0B4390', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: '700', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                Guardar borrador
              </button>
              <button onClick={() => guardar(true)} disabled={guardando} style={{ flex: 2, minWidth: '160px', padding: '14px', borderRadius: '8px', border: 'none', background: '#0B4390', color: 'white', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: '700', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : '🚀 Publicar noticia'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}