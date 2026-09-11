import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../hooks/useAuth'
import './NoticiasHome.css'

// Mismo mapa que Noticias.jsx/NoticiaDetalle.jsx — si se toca ahí,
// tocarlo también aquí.
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
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// Prueba: sección estática (sin carrusel/autoscroll) con las últimas
// noticias — que ahora incluyen tanto artículos de redactores como los
// tweets auto-publicados por la Edge Function fetch-tweets-rumores.
// Sustituye aquí a <MarketCarousel /> a modo de prueba.
export default function NoticiasHome() {
  const [noticias, setNoticias] = useState([])

  useEffect(() => {
    supabase
      .from('noticias')
      .select('slug, titulo, categoria, imagen_url, created_at')
      .eq('publicada', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setNoticias(data || []))
  }, [])

  if (noticias.length === 0) return null

  return (
    <section className="noticias-home">
      <div className="noticias-home__head">
        <div>
          <p className="noticias-home__eyebrow">Temporada 26/27</p>
          <h3 className="noticias-home__title">Últimas Noticias</h3>
        </div>
        <Link to="/noticias" className="noticias-home__ver-todas">Ver todas →</Link>
      </div>

      <div className="noticias-home__grid">
        {noticias.map(n => (
          <Link key={n.slug} to={`/noticias/${n.slug}`} className="noticias-home__card">
            {n.imagen_url && (
              <div className="noticias-home__foto">
                <img src={n.imagen_url} alt="" loading="lazy" onError={e => { e.target.closest('.noticias-home__foto').style.display = 'none' }} />
              </div>
            )}
            <div className="noticias-home__body">
              <div className="noticias-home__meta">
                <span className="noticias-home__tag" style={{ '--tag-color': colorCategoria(n.categoria) }}>
                  {n.categoria || 'Real Zaragoza'}
                </span>
                <span className="noticias-home__fecha">{formatFecha(n.created_at)}</span>
              </div>
              <h4 className="noticias-home__card-titulo">{n.titulo}</h4>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
