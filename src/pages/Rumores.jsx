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
        descripcion: item.description?.replace(/<[^>]*>/g, '').slice(0, 200),
      }))
  } catch (e) {
    console.error('Error RSS:', cuenta.usuario, e)
    return []
  }
}

async function analizarNoticias(noticias) {
  if (noticias.length === 0) return []
  const titulos = noticias.map((n, i) => `${i}. ${n.titulo}`).join('\n')
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Analiza estos tweets del Real Zaragoza y para cada uno extrae:
- tipo: "fichaje" | "salida" | "renovacion" | "noticia"
- jugador: nombre del jugador mencionado o null

Responde SOLO con JSON array sin markdown:
[{"index":0,"tipo":"fichaje","jugador":"Nombre Apellido"},{"index":1,"tipo":"noticia","jugador":null}]

Tweets:
${titulos}`
      }]
    })
  })
  const data = await res.json()
  try {
    return JSON.parse(data.content[0].text)
  } catch {
    return []
  }
}

const TIPO_COLORS = {
  fichaje: '#27ae60',
  salida: '#c0392b',
  renovacion: '#2980b9',
  noticia: '#7f8c8d',
}

const TIPO_LABELS = {
  fichaje: 'FICHAJE',
  salida: 'SALIDA',
  renovacion: 'RENOVACIÓN',
  noticia: 'NOTICIA',
}

function RumorCard({ noticia, analisis }) {
  const tipo = analisis?.tipo || 'noticia'
  const jugador = analisis?.jugador
  const color = TIPO_COLORS[tipo]
  const fecha = new Date(noticia.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

  return (
    <a href={noticia.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: '8px', overflow: 'hidden',
        border: '1px solid #e0e0e0', marginBottom: '8px',
        transition: 'box-shadow 0.15s', cursor: 'pointer',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        {noticia.imagen && (
          <img
            src={noticia.imagen}
            alt=""
            style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#f0f0f0', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '6px', minWidth: '6px', alignSelf: 'stretch', background: color }} />
          <div style={{ flex: 1, padding: '14px 8px' }}>
            {jugador && (
              <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '22px', fontWeight: '700', color: '#0B4390', textTransform: 'uppercase', lineHeight: 1, marginBottom: '4px' }}>
                {jugador}
              </div>
            )}
            <div style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '6px', lineHeight: '1.4' }}>
              {noticia.titulo}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ background: noticia.medioColor, color: 'white', borderRadius: '4px', padding: '2px 6px', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '700' }}>
                {noticia.medio}
              </span>
              <span style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#999' }}>{fecha}</span>
            </div>
          </div>
          <div style={{ padding: '0 16px', flexShrink: 0 }}>
            <div style={{ background: color, color: 'white', borderRadius: '6px', padding: '4px 10px', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
              {TIPO_LABELS[tipo]}
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

export default function Rumores() {
  const [noticias, setNoticias] = useState([])
  const [analisis, setAnalisis] = useState([])
  const [loading, setLoading] = useState(true)
  const [analizando, setAnalizando] = useState(false)
  const [filtro, setFiltro] = useState('todos')
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
      if (todas.length > 0) {
        setAnalizando(true)
        const analisisResult = await analizarNoticias(todas)
        setAnalisis(analisisResult)
        setAnalizando(false)
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
      setAnalizando(false)
    }
  }

  const noticiasFiltradas = noticias.filter((_n, i) => {
    if (filtro === 'todos') return true
    const a = analisis.find(a => a.index === i)
    return a?.tipo === filtro
  })

  const contadores = {
    fichaje: analisis.filter(a => a.tipo === 'fichaje').length,
    salida: analisis.filter(a => a.tipo === 'salida').length,
    renovacion: analisis.filter(a => a.tipo === 'renovacion').length,
  }

  const horaActualizacion = ultimaActualizacion
    ? ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: '72px', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: '0 0 8px 0' }}>
          Rumores
        </h1>
        <p style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#999', marginBottom: '24px' }}>
          Vía @MBlanquillo1932 · {analizando ? '🤖 Analizando con IA...' : `${noticias.length} tweets`} {horaActualizacion && `· Actualizado a las ${horaActualizacion}`}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { key: 'todos', label: `Todos (${noticias.length})` },
            { key: 'fichaje', label: `Fichajes (${contadores.fichaje})`, color: '#27ae60' },
            { key: 'salida', label: `Salidas (${contadores.salida})`, color: '#c0392b' },
            { key: 'renovacion', label: `Renovaciones (${contadores.renovacion})`, color: '#2980b9' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)} style={{
              padding: '8px 16px', borderRadius: '24px', border: 'none', cursor: 'pointer',
              background: filtro === f.key ? (f.color || '#0B4390') : 'white',
              color: filtro === f.key ? 'white' : '#333',
              fontFamily: 'sans-serif', fontWeight: '600', fontSize: '13px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>
              {f.label}
            </button>
          ))}
        </div>

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
            {noticiasFiltradas.map((n, i) => (
              <RumorCard
                key={i}
                noticia={n}
                analisis={analisis.find(a => a.index === noticias.indexOf(n))}
              />
            ))}
            {noticiasFiltradas.length === 0 && (
              <p style={{ fontFamily: 'sans-serif', color: '#999', textAlign: 'center', padding: '40px' }}>
                No hay tweets en esta categoría.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}