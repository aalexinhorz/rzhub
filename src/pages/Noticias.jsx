import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import './Noticias.css'

// Colores por categoría — las que ya usan los redactores en Redaccion.jsx
// (Real Zaragoza, Mercado, Análisis, Opinión, Previa, Crónica) más
// "Última Hora", que es la que se asigna a los tweets auto-publicados
// cuando huelen a anuncio oficial/urgente.
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

// Quita diacríticos (acentos) tras normalize('NFD') para comparar sin
// tildes. Construido con fromCharCode (en vez de un literal \uXXXX en
// el regex) para que el rango de "combining marks" quede inequívoco.
const RANGO_DIACRITICOS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g')
function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(RANGO_DIACRITICOS, '')
}

function formatFecha(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function NoticiaCard({ n }) {
  return (
    <Link to={`/noticias/${n.slug}`} className="noticia-card">
      {n.imagen_url && (
        <div className="noticia-card__foto">
          <img
            src={n.imagen_url}
            alt=""
            loading="lazy"
            onError={e => { e.target.closest('.noticia-card__foto').style.display = 'none' }}
          />
        </div>
      )}
      <div className="noticia-card__body">
        <div className="noticia-card__meta">
          <span className="noticia-card__tag" style={{ '--tag-color': colorCategoria(n.categoria) }}>
            {n.categoria || 'Real Zaragoza'}
          </span>
          <span className="noticia-card__fecha">{formatFecha(n.created_at)}</span>
        </div>
        <h3 className="noticia-card__titulo">{n.titulo}</h3>
        {n.excerpt && <p className="noticia-card__excerpt">{n.excerpt}</p>}
        {n.autor && <p className="noticia-card__autor">{n.autor}</p>}
      </div>
    </Link>
  )
}

export default function Noticias() {
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todas')

  useEffect(() => {
    supabase
      .from('noticias')
      .select('*')
      .eq('publicada', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setNoticias(data || []); setLoading(false) })
  }, [])

  const categorias = ['Todas', ...new Set(noticias.map(n => n.categoria).filter(Boolean))]

  const busquedaNorm = normalizar(busqueda)
  const filtradas = noticias.filter(n => {
    if (categoriaActiva !== 'Todas' && n.categoria !== categoriaActiva) return false
    if (busquedaNorm && !normalizar(n.titulo).includes(busquedaNorm)) return false
    return true
  })

  return (
    <div className="noticias-page">
      <SEO
        title="Noticias del Real Zaragoza | Actualidad Zaragocista | RZ Hub"
        description="Las últimas noticias del Real Zaragoza: fichajes, resultados, entrevistas y actualidad del club, actualizadas cada día."
        keywords="noticias Real Zaragoza, actualidad Real Zaragoza, prensa Real Zaragoza, última hora Real Zaragoza, hemeroteca Real Zaragoza"
        path="/noticias"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Noticias del Real Zaragoza',
          url: `${SITE_URL}/noticias`,
          description: 'Últimas noticias y actualidad del Real Zaragoza publicadas en RZ Hub.',
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="noticias-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow noticias-page__eyebrow">Real Zaragoza · Temporada 26/27</p>
        <h1 className="noticias-page__title">Noticias</h1>
        <p className="noticias-page__subtitle">Toda la actualidad del Real Zaragoza: crónicas, mercado y última hora, en un solo sitio.</p>
      </div>

      <div className="noticias-page__body">
        <div className="noticias-page__container">
          <div className="noticias-toolbar">
            <div className="noticias-buscador">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Buscar noticias..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            <div className="noticias-chips">
              {categorias.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`noticias-chip${categoriaActiva === cat ? ' is-active' : ''}`}
                  style={cat !== 'Todas' ? { '--chip-color': colorCategoria(cat) } : undefined}
                  onClick={() => setCategoriaActiva(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="noticias-page__state">Cargando noticias…</p>
          ) : filtradas.length === 0 ? (
            <p className="noticias-page__state">
              {noticias.length === 0 ? 'Todavía no hay noticias publicadas.' : 'No hay noticias que coincidan con la búsqueda.'}
            </p>
          ) : (
            <div className="noticias-grid">
              {filtradas.map(n => <NoticiaCard key={n.id} n={n} />)}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
