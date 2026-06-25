import { useState, useEffect, useRef } from 'react'
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
  const fileInputRef = useRef(null)
  const slugEditadoManualmente = useRef(false)
  const [noticias, setNoticias] = useState([])
  const [vista, setVista] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [contenido, setContenido] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState('')
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [categoria, setCategoria] = useState('Real Zaragoza')
  const [publicada, setPublicada] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [slugPersonalizado, setSlugPersonalizado] = useState('')
  const [metaTitulo, setMetaTitulo] = useState('')
  const [metaDescripcion, setMetaDescripcion] = useState('')
  const [ogImagen, setOgImagen] = useState('')
  const [seoAbierto, setSeoAbierto] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (profile !== null && !profile.es_redactor) { navigate('/'); return }
  }, [user, profile, loading])

  useEffect(() => {
    if (user && profile?.es_redactor) fetchNoticias()
  }, [user, profile])

  useEffect(() => {
    if (!editando && !slugEditadoManualmente.current) {
      setSlugPersonalizado(generarSlug(titulo))
    }
  }, [titulo])

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
    setImagenFile(null)
    setImagenPreview('')
    setCategoria('Real Zaragoza')
    setPublicada(false)
    setSlugPersonalizado('')
    setMetaTitulo('')
    setMetaDescripcion('')
    setOgImagen('')
    setSeoAbierto(false)
    slugEditadoManualmente.current = false
    setVista('editor')
  }

  function editarNoticia(noticia) {
    setEditando(noticia)
    setTitulo(noticia.titulo)
    setExcerpt(noticia.excerpt || '')
    setContenido(noticia.contenido || '')
    setImagenUrl(noticia.imagen_url || '')
    setImagenFile(null)
    setImagenPreview(noticia.imagen_url || '')
    setCategoria(noticia.categoria || 'Real Zaragoza')
    setPublicada(noticia.publicada || false)
    setSlugPersonalizado(noticia.slug || '')
    setMetaTitulo(noticia.meta_titulo || '')
    setMetaDescripcion(noticia.meta_descripcion || '')
    setOgImagen(noticia.og_imagen || '')
    setSeoAbierto(false)
    slugEditadoManualmente.current = true
    setVista('editor')
  }

  function handleSlugManual(e) {
    slugEditadoManualmente.current = true
    setSlugPersonalizado(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  function handleImagenFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
    setImagenUrl('')
  }

  async function subirImagen() {
    if (!imagenFile) return imagenUrl
    setSubiendoImagen(true)
    const ext = imagenFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('noticias-imagenes')
      .upload(path, imagenFile, { upsert: true })
    if (error) {
      setMensaje('Error al subir imagen: ' + error.message)
      setSubiendoImagen(false)
      return null
    }
    const { data: urlData } = supabase.storage.from('noticias-imagenes').getPublicUrl(path)
    setSubiendoImagen(false)
    return urlData.publicUrl
  }

  async function guardar(pub) {
    if (!titulo.trim()) { setMensaje('El título es obligatorio'); return }
    setGuardando(true)
    setMensaje('')

    let urlFinal = imagenUrl
    if (imagenFile) {
      urlFinal = await subirImagen()
      if (!urlFinal) { setGuardando(false); return }
    }

    const slugFinal = slugPersonalizado.trim() || (editando?.slug || generarSlug(titulo) + '-' + Date.now())

    const datos = {
      titulo: titulo.trim(),
      slug: slugFinal,
      excerpt: excerpt.trim(),
      contenido: contenido.trim(),
      imagen_url: urlFinal,
      categoria: categoria.trim(),
      autor: profile?.username || profile?.name || user.email,
      autor_id: user.id,
      publicada: pub,
      meta_titulo: metaTitulo.trim() || titulo.trim(),
      meta_descripcion: metaDescripcion.trim() || excerpt.trim(),
      og_imagen: ogImagen.trim() || urlFinal,
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

  const categorias = ['Real Zaragoza', 'Mercado', 'Análisis', 'Opinión', 'Previa', 'Crónica']
  const metaTituloPreview = metaTitulo || titulo || 'Título del artículo'
  const metaDescPreview = metaDescripcion || excerpt || 'Descripción del artículo para motores de búsqueda.'

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {mensaje && (
              <div style={{ background: mensaje.includes('Error') ? '#fdecea' : '#e8f5e9', color: mensaje.includes('Error') ? '#c62828' : '#2e7d32', padding: '12px 16px', borderRadius: '8px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600' }}>
                {mensaje}
              </div>
            )}

            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Título *</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Titular de la noticia" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px', fontFamily: 'sans-serif', fontWeight: '700', boxSizing: 'border-box', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Categoría</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', background: 'white' }}>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Imagen destacada</label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => fileInputRef.current.click()} style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    📁 Subir desde dispositivo
                  </button>
                  <span style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#aaa', alignSelf: 'center' }}>o pega una URL:</span>
                  <input value={imagenUrl} onChange={e => { setImagenUrl(e.target.value); setImagenFile(null); setImagenPreview(e.target.value) }} placeholder="https://..." style={{ flex: 1, minWidth: '200px', padding: '10px 12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagenFile} style={{ display: 'none' }} />
                {imagenPreview && (
                  <div style={{ borderRadius: '8px', overflow: 'hidden', maxHeight: '220px', position: 'relative' }}>
                    <img src={imagenPreview} alt="preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '220px', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                    <button onClick={() => { setImagenFile(null); setImagenUrl(''); setImagenPreview('') }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Entradilla (resumen corto)</label>
                <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Breve resumen que aparece en la portada..." rows={3} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', resize: 'vertical', lineHeight: '1.6' }} />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Contenido</label>
                <textarea value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Escribe aquí el artículo completo..." rows={16} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', resize: 'vertical', lineHeight: '1.8' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => guardar(false)} disabled={guardando || subiendoImagen} style={{ flex: 1, minWidth: '140px', padding: '14px', borderRadius: '8px', border: '2px solid #0B4390', background: 'white', color: '#0B4390', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: '700', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  Guardar borrador
                </button>
                <button onClick={() => guardar(true)} disabled={guardando || subiendoImagen} style={{ flex: 2, minWidth: '160px', padding: '14px', borderRadius: '8px', border: 'none', background: '#0B4390', color: 'white', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: '700', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  {guardando || subiendoImagen ? 'Subiendo...' : '🚀 Publicar noticia'}
                </button>
              </div>
            </div>

            {/* Panel SEO */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <button onClick={() => setSeoAbierto(!seoAbierto)} style={{ width: '100%', padding: '18px 24px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🔍</span>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: '#111' }}>SEO</span>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>Meta título, descripción, slug y Open Graph</span>
                </div>
                <span style={{ color: '#aaa', fontSize: '18px', transform: seoAbierto ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
              </button>

              {seoAbierto && (
                <div style={{ padding: '0 24px 28px', borderTop: '1px solid #f0f0f0' }}>

                  <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '16px 18px', margin: '20px 0 24px' }}>
                    <p style={{ margin: '0 0 8px', fontFamily: 'sans-serif', fontSize: '11px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase' }}>Vista previa en Google</p>
                    <p style={{ margin: '0 0 2px', fontFamily: 'sans-serif', fontSize: '18px', color: '#1a0dab', fontWeight: '400', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {metaTituloPreview}
                    </p>
                    <p style={{ margin: '0 0 4px', fontFamily: 'sans-serif', fontSize: '13px', color: '#006621' }}>
                      rzhub.es/noticias/{slugPersonalizado || generarSlug(titulo) || 'slug-del-articulo'}
                    </p>
                    <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '13px', color: '#545454', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {metaDescPreview}
                    </p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Meta título</span>
                      <span style={{ color: metaTituloPreview.length > 60 ? '#e65100' : '#aaa' }}>{metaTituloPreview.length}/60</span>
                    </label>
                    <input value={metaTitulo} onChange={e => setMetaTitulo(e.target.value)} placeholder={titulo || 'Meta título para Google...'} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
                    <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: '12px', color: '#aaa' }}>Si no lo rellenas se usará el título del artículo. Recomendado: menos de 60 caracteres.</p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Meta descripción</span>
                      <span style={{ color: metaDescPreview.length > 160 ? '#e65100' : '#aaa' }}>{metaDescPreview.length}/160</span>
                    </label>
                    <textarea value={metaDescripcion} onChange={e => setMetaDescripcion(e.target.value)} placeholder={excerpt || 'Descripción para Google...'} rows={3} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', resize: 'vertical', lineHeight: '1.6' }} />
                    <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: '12px', color: '#aaa' }}>Si no la rellenas se usará la entradilla. Recomendado: menos de 160 caracteres.</p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Slug (URL del artículo)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid #ddd', padding: '0 12px', overflow: 'hidden' }}>
                      <span style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#aaa', whiteSpace: 'nowrap' }}>rzhub.es/noticias/</span>
                      <input value={slugPersonalizado} onChange={handleSlugManual} placeholder={generarSlug(titulo) || 'slug-del-articulo'} style={{ flex: 1, padding: '12px 0', border: 'none', fontSize: '14px', fontFamily: 'sans-serif', background: 'transparent', outline: 'none' }} />
                    </div>
                    <p style={{ margin: '4px 0 0', fontFamily: 'sans-serif', fontSize: '12px', color: '#aaa' }}>Se genera automáticamente del título. Solo letras, números y guiones.</p>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Imagen Open Graph (redes sociales)</label>
                    <input value={ogImagen} onChange={e => setOgImagen(e.target.value)} placeholder="URL de la imagen al compartir en redes (por defecto se usa la imagen destacada)" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '14px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }} />
                    {(ogImagen || imagenPreview) && (
                      <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', maxHeight: '160px' }}>
                        <img src={ogImagen || imagenPreview} alt="OG preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '160px', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}