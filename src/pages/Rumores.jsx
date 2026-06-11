import { useState, useEffect } from 'react'

const CUENTAS = [
  { usuario: 'MBlanquillo1932', nombre: 'Mundo Blanquillo', color: '#1da1f2' },
]

const RSS2JSON_KEY = 'em9i5los5dhem2nejvr2tolxzoqdjtjplwlvcpuf'
const INTERVALO_MS = 5 * 60 * 1000

function extraerImagen(description) {
  if (!description) return null
  const match = description.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

function esImportante(titulo) {
  const t = titulo?.toLowerCase() || ''
  return t.includes('informa') || t.includes('oficial') || t.includes('🚨') || t.includes('❗')
}

async function fetchCuenta(cuenta) {
  try {
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://nitter.net/${cuenta.usuario}/rss`)}&api_key=${RSS2JSON_KEY}&count=20`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'ok') return []
    return (data.items || [])
      .slice(0, 20)
      .map(item => ({
        titulo: item.title,
        link: item.link?.replace('https://nitter.net', 'https://x.com'),
        fecha: item.pubDate,
        medio: cuenta.nombre,
        medioColor: cuenta.color,
        imagen: extraerImagen(item.description),
      }))
  } catch (e) {
    console.error('Error RSS:', cuenta.usuario, e)
    return []
  }
}

function RumorCard({ noticia }) {
  const importante = esImportante(noticia.titulo)
  const textoCorto = !importante && noticia.titulo?.length > 170
  const textoMostrado = textoCorto ? noticia.titulo.slice(0, 170) + '...' : noticia.titulo
  const fecha = new Date(noticia.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

  return (
    <div style={{
      background: 'white', borderRadius: '8px', overflow: 'hidden',
      border: '1px solid #e0e0e0', marginBottom: '8px',
    }}>
      {noticia.imagen && (
        <a href={noticia.link} target="_blank" rel="noopener noreferrer">
          <img
            src={noticia.imagen}
            alt=""
            style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#f0f0f0', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </a>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ width: '6px', minWidth: '6px', alignSelf: 'stretch', background: '#0B4390' }} />
        <div style={{ flex: 1, padding: '14px 8px' }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '6px', lineHeight: '1.4' }}>
            {textoMostrado}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: noticia.medioColor, color: 'white', borderRadius: '4px', padding: '2px 6px', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '700' }}>
              {noticia.medio}
            </span>
            <span style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#999' }}>{fecha}</span>
            <a href={noticia.link} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#1da1f2', fontWeight: '600', textDecoration: 'none' }}>
              Ver tweet completo →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Rumores() {
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  useEffect(() => {
    cargarNoticias()
    const interval = setInterval(cargarNoticias, INTERVALO_MS)
    return () => clearInterval(interval)
  }, [])

  async function cargarNoticias() {
    try {
      const resultados = await Promise.all(CUENTAS.map(fetchCuenta))
      const todas = resultados.flat().sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      setNoticias(todas)
      setLoading(false)
      setUltimaActualizacion(new Date())
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  const horaActualizacion = ultimaActualizacion
    ? ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: '72px', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: '0 0 8px 0' }}>
          Últimas Noticias
        </h1>
        <p style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#999', marginBottom: '24px' }}>
          Vía @MBlanquillo1932 · {noticias.length} tweets {horaActualizacion && `· Actualizado a las ${horaActualizacion}`}
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999', fontFamily: 'sans-serif' }}>
            Cargando tweets...
          </div>
        ) : noticias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999', fontFamily: 'sans-serif' }}>
            No se pudieron cargar los tweets.
          </div>
        ) : (
          <div>
            {noticias.map((n, i) => (
              <RumorCard key={i} noticia={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}