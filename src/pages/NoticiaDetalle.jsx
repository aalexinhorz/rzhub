import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../hooks/useAuth'

function formatFecha(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NoticiaDetalle() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('noticias')
        .select('*')
        .eq('slug', slug)
        .eq('publicada', true)
        .single()
      setPost(data || null)
      setLoading(false)
    }
    fetch()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#666' }}>Cargando noticia...</p>
    </div>
  )

  if (!post) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#f8f9fa' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#666' }}>No se encontró la noticia.</p>
      <button onClick={() => navigate('/noticias')} style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        Volver a noticias
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 20px 64px' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#0B4390', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: '0 0 24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Volver
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ background: '#0B4390', color: 'white', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>
            {post.categoria}
          </span>
          <span style={{ color: '#999', fontFamily: 'sans-serif', fontSize: '13px' }}>{formatFecha(post.created_at)}</span>
          {post.autor && <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '13px' }}>· {post.autor}</span>}
        </div>

        <h1 style={{ margin: '0 0 24px', fontFamily: 'sans-serif', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '900', color: '#111', lineHeight: '1.2' }}>
          {post.titulo}
        </h1>

        {post.excerpt && (
          <p style={{ margin: '0 0 28px', fontFamily: 'sans-serif', fontSize: '18px', color: '#444', lineHeight: '1.6', fontStyle: 'italic', borderLeft: '4px solid #f5c400', paddingLeft: '16px' }}>
            {post.excerpt}
          </p>
        )}

        {post.imagen_url && (
          <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
            <img src={post.imagen_url} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '460px' }} />
          </div>
        )}

        <div style={{ fontFamily: 'sans-serif', fontSize: 'clamp(15px, 2vw, 17px)', color: '#222', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
          {post.contenido}
        </div>

        <div style={{ marginTop: '48px', borderTop: '1px solid #e0e0e0', paddingTop: '24px' }}>
          <button onClick={() => navigate('/noticias')} style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            ← Ver todas las noticias
          </button>
        </div>
      </div>
    </div>
  )
}