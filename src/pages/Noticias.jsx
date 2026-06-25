import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../hooks/useAuth'

function formatFecha(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Noticias() {
  const navigate = useNavigate()
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriaActiva, setCategoriaActiva] = useState('Todas')

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('noticias')
        .select('*')
        .eq('publicada', true)
        .order('created_at', { ascending: false })
      setNoticias(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const categorias = ['Todas', ...new Set(noticias.map(n => n.categoria).filter(Boolean))]
  const filtradas = categoriaActiva === 'Todas' ? noticias : noticias.filter(n => n.categoria === categoriaActiva)

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>

        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(56px, 10vw, 96px)', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: '0 0 8px' }}>
          Noticias
        </h1>
        <div style={{ borderBottom: '3px solid #0B4390', marginBottom: '28px' }} />

        {/* Filtro categorías */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ background: categoriaActiva === cat ? '#0B4390' : 'white', color: categoriaActiva === cat ? 'white' : '#0B4390', border: '2px solid #0B4390', borderRadius: '20px', padding: '6px 16px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ fontFamily: 'sans-serif', color: '#999', textAlign: 'center', padding: '48px' }}>Cargando noticias...</p>
        ) : filtradas.length === 0 ? (
          <p style={{ fontFamily: 'sans-serif', color: '#999', textAlign: 'center', padding: '48px' }}>No hay noticias publicadas todavía.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filtradas.map(n => (
              <div key={n.id} onClick={() => navigate(`/noticias/${n.slug}`)}
                style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                {n.imagen_url && (
                  <div style={{ height: '180px', overflow: 'hidden' }}>
                    <img src={n.imagen_url} alt={n.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ padding: '16px 18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ background: '#0B4390', color: 'white', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      {n.categoria}
                    </span>
                    <span style={{ color: '#bbb', fontFamily: 'sans-serif', fontSize: '12px' }}>{formatFecha(n.created_at)}</span>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#111', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.titulo}
                  </h3>
                  {n.excerpt && (
                    <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '13px', color: '#666', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.excerpt}
                    </p>
                  )}
                  {n.autor && <p style={{ margin: '10px 0 0', fontFamily: 'sans-serif', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>{n.autor}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}