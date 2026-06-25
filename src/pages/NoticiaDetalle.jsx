import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const WP_BASE = 'https://palmadasalvientoback.great-site.net/wp-json/wp/v2'

function formatFecha(dateStr) {
  const fecha = new Date(dateStr)
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NoticiaDetalle() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`${WP_BASE}/posts?slug=${slug}&_embed`)
        if (!res.ok) throw new Error('Error')
        const data = await res.json()
        if (data.length === 0) throw new Error('No encontrado')
        setPost(data[0])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#666', fontSize: '15px' }}>Cargando noticia...</p>
    </div>
  )

  if (error || !post) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#f8f9fa' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#666', fontSize: '15px' }}>No se encontró la noticia.</p>
      <button onClick={() => navigate('/noticias')} style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        Volver a noticias
      </button>
    </div>
  )

  const imgUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null
  const autor = post._embedded?.author?.[0]?.name || ''
  const categoria = post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Noticias'

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* Volver */}
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#0B4390', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: '0 0 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Volver
        </button>

        {/* Categoría + fecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ background: '#0B4390', color: 'white', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {categoria}
          </span>
          <span style={{ color: '#999', fontFamily: 'sans-serif', fontSize: '13px' }}>{formatFecha(post.date)}</span>
          {autor && <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '13px' }}>· {autor}</span>}
        </div>

        {/* Título */}
        <h1
          style={{ margin: '0 0 24px', fontFamily: 'sans-serif', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '900', color: '#111', lineHeight: '1.2' }}
          dangerouslySetInnerHTML={{ __html: post.title?.rendered }}
        />

        {/* Imagen destacada */}
        {imgUrl && (
          <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
            <img src={imgUrl} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '460px' }} />
          </div>
        )}

        {/* Contenido */}
        <div
          style={{ fontFamily: 'sans-serif', fontSize: 'clamp(15px, 2vw, 17px)', color: '#222', lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: post.content?.rendered }}
        />

        {/* Volver al final */}
        <div style={{ marginTop: '48px', borderTop: '1px solid #e0e0e0', paddingTop: '24px' }}>
          <button
            onClick={() => navigate('/noticias')}
            style={{ background: '#0B4390', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
          >
            ← Ver todas las noticias
          </button>
        </div>

      </div>

      {/* Estilos para el contenido de WordPress */}
      <style>{`
        .wp-content p { margin: 0 0 20px; }
        .wp-content h2 { font-size: clamp(20px, 3vw, 26px); font-weight: 800; color: #111; margin: 32px 0 12px; }
        .wp-content h3 { font-size: clamp(17px, 2.5vw, 22px); font-weight: 700; color: #111; margin: 28px 0 10px; }
        .wp-content a { color: #0B4390; font-weight: 600; }
        .wp-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
        .wp-content blockquote { border-left: 4px solid #f5c400; margin: 24px 0; padding: 12px 20px; background: #fffbea; color: #333; font-style: italic; border-radius: 0 8px 8px 0; }
        .wp-content ul, .wp-content ol { padding-left: 24px; margin: 0 0 20px; }
        .wp-content li { margin-bottom: 8px; }
        .wp-content strong { color: #111; }
      `}</style>
    </div>
  )
}