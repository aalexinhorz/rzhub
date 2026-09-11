import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SEO, { SITE_URL, DEFAULT_OG_IMAGE } from '../components/SEO'
import { supabase } from '../hooks/useAuth'
import './NoticiaDetalle.css'

// Mismo mapa de colores que Noticias.jsx (mantenerlo alineado ahí es
// más importante que evitar la duplicación de este objeto pequeño).
const COLOR_CATEGORIA = {
  'Última Hora': 'var(--rz-red)',
  Mercado: 'var(--rz-yellow)',
  'Real Zaragoza': 'var(--rz-blue-light)',
  Análisis: '#8b5cf6',
  Opinión: '#14b8a6',
  Previa: '#f97316',
  Crónica: 'var(--rz-green)',
}
const colorCategoria = (cat) => COLOR_CATEGORIA[cat] || 'var(--rz-text-muted)'

function formatFecha(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NoticiaDetalle() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('noticias')
      .select('*')
      .eq('slug', slug)
      .eq('publicada', true)
      .single()
      .then(({ data }) => { setPost(data || null); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div className="noticia-detalle__state">
      <p>Cargando noticia…</p>
    </div>
  )

  if (!post) return (
    <div className="noticia-detalle__state">
      <p>No se encontró la noticia.</p>
      <button className="rz-btn rz-btn--primary" onClick={() => navigate('/noticias')}>Volver a noticias</button>
    </div>
  )

  return (
    <div className="noticia-detalle-page">
      <SEO
        title={`${post.meta_titulo || post.titulo} | RZ Hub`}
        description={post.meta_descripcion || post.excerpt || post.titulo}
        path={`/noticias/${post.slug}`}
        image={post.og_imagen || post.imagen_url || DEFAULT_OG_IMAGE}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: post.titulo,
          description: post.excerpt || undefined,
          image: post.og_imagen || post.imagen_url || undefined,
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          author: post.autor ? { '@type': 'Person', name: post.autor } : undefined,
          articleSection: post.categoria || undefined,
          mainEntityOfPage: `${SITE_URL}/noticias/${post.slug}`,
          publisher: { '@type': 'Organization', name: 'RZ Hub', logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE } },
        }}
      />

      <div className="noticia-detalle">
        <button className="noticia-detalle__back" onClick={() => navigate(-1)}>← Volver</button>

        <div className="noticia-detalle__meta">
          <span className="noticia-detalle__tag" style={{ '--tag-color': colorCategoria(post.categoria) }}>
            {post.categoria || 'Real Zaragoza'}
          </span>
          <span className="noticia-detalle__fecha">{formatFecha(post.created_at)}</span>
          {post.autor && <span className="noticia-detalle__autor">· {post.autor}</span>}
        </div>

        <h1 className="noticia-detalle__titulo">{post.titulo}</h1>

        {post.excerpt && <p className="noticia-detalle__excerpt">{post.excerpt}</p>}

        {post.imagen_url && (
          <div className="noticia-detalle__foto">
            <img src={post.imagen_url} alt="" />
          </div>
        )}

        <div className="noticia-detalle__contenido">{post.contenido}</div>

        <div className="noticia-detalle__footer">
          <button className="rz-btn rz-btn--primary" onClick={() => navigate('/noticias')}>← Ver todas las noticias</button>
        </div>
      </div>
    </div>
  )
}
