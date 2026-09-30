import { useEffect, useState } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import useAuth, { supabase } from '../hooks/useAuth'
import './Album.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

function useCatalogo() {
  const [cromos, setCromos] = useState([])
  useEffect(() => {
    supabase.from('album_cromos').select('*').order('categoria').order('orden')
      .then(({ data }) => setCromos(data || []))
  }, [])
  return cromos
}

function useColeccion(user) {
  const [coleccion, setColeccion] = useState({})
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refrescar() {
    if (!user) { setLoading(false); return }
    const [{ data: filas }, { data: estadoData }] = await Promise.all([
      supabase.from('album_colecciones').select('cromo_id, cantidad').eq('user_id', user.id),
      supabase.from('album_estado').select('ultimo_sobre').eq('user_id', user.id).maybeSingle(),
    ])
    const mapa = {}
    filas?.forEach(f => { mapa[f.cromo_id] = f.cantidad })
    setColeccion(mapa)
    setEstado(estadoData || null)
    setLoading(false)
  }

  useEffect(() => { refrescar() }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return { coleccion, estado, loading, refrescar }
}

function yaAbiertoHoy(estado) {
  if (!estado?.ultimo_sobre) return false
  const hoy = new Date().toDateString()
  return new Date(estado.ultimo_sobre).toDateString() === hoy
}

function CromoCard({ cromo, cantidad }) {
  const conseguido = cantidad > 0
  return (
    <div className={`album-cromo${conseguido ? '' : ' album-cromo--pendiente'}`}>
      <div className="album-cromo__foto">
        {conseguido
          ? <img src={cromo.foto || DEFAULT_PHOTO} alt="" />
          : <span className="album-cromo__interrogante">?</span>}
      </div>
      <p className="album-cromo__nombre">{conseguido ? cromo.nombre : '???'}</p>
      {conseguido && cromo.dorsal && <span className="album-cromo__dorsal">#{cromo.dorsal}</span>}
      {conseguido && cantidad > 1 && <span className="album-cromo__repe">×{cantidad}</span>}
    </div>
  )
}

// Simula la apertura de un sobre físico: 1) sobre cerrado que el
// usuario "rasga" con un click (bandazo + destello de luz + el
// sobre se desintegra), 2) los 5 cromos boca abajo, que se revelan
// uno a uno con un giro 3D al tocarlos — mismo patrón que Panini
// Collection/FUT en vez de mostrarlos todos de golpe.
function SobreOverlay({ datos, fase, flipped, onRasgar, onFlip, onRevelarTodas, onCerrar }) {
  const todasReveladas = flipped.every(Boolean)

  return (
    <div className="album-reveal" onClick={todasReveladas ? onCerrar : undefined}>
      <div className="album-reveal__panel" onClick={e => e.stopPropagation()}>
        {fase !== 'revelando' ? (
          <div className="album-sobre-zona">
            <p className="rz-eyebrow rz-eyebrow--yellow" style={{ textAlign: 'center' }}>
              {fase === 'rasgando' ? 'Abriendo…' : 'Toca el sobre para abrirlo'}
            </p>
            <div className={`album-sobre${fase === 'rasgando' ? ' album-sobre--rasgando' : ''}`} onClick={fase === 'cerrado' ? onRasgar : undefined}>
              <span className="album-sobre__escudo">RZ</span>
              <span className="album-sobre__texto">RZ HUB<br />TEMPORADA 26/27</span>
              <span className="album-sobre__destello" aria-hidden="true" />
            </div>
          </div>
        ) : (
          <>
            <p className="rz-eyebrow rz-eyebrow--yellow" style={{ textAlign: 'center' }}>Tu sobre de hoy</p>
            <div className="album-reveal__grid">
              {datos.map((c, i) => (
                <div key={i} className="album-carta" onClick={() => onFlip(i)}>
                  <div className={`album-carta__inner${flipped[i] ? ' is-flipped' : ''}`}>
                    <div className="album-carta__cara album-carta__dorso">
                      <span>RZ</span>
                    </div>
                    <div className={`album-carta__cara album-carta__frente${c.out_categoria === 'leyenda' ? ' es-leyenda' : ''}`}>
                      <div className="album-carta__foto">
                        <img src={c.out_foto || DEFAULT_PHOTO} alt="" />
                      </div>
                      <p className="album-carta__nombre">{c.out_nombre}</p>
                      {c.out_cantidad > 1 && <span className="album-cromo__repe">×{c.out_cantidad}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!todasReveladas ? (
              <button className="album-reveal__saltar" onClick={onRevelarTodas}>Revelar todas</button>
            ) : (
              <button className="rz-btn rz-btn--primary" onClick={onCerrar}>Guardar en el álbum</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Album() {
  const { user, signInWithGoogle } = useAuth()
  const cromos = useCatalogo()
  const { coleccion, estado, loading, refrescar } = useColeccion(user)
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState(null)
  const [datosSobre, setDatosSobre] = useState(null)
  const [faseSobre, setFaseSobre] = useState(null) // null | 'cerrado' | 'rasgando' | 'revelando'
  const [flipped, setFlipped] = useState([])

  const plantilla = cromos.filter(c => c.categoria === 'plantilla')
  const leyendas = cromos.filter(c => c.categoria === 'leyenda')
  const totalConseguidos = cromos.filter(c => coleccion[c.id] > 0).length
  const bloqueado = yaAbiertoHoy(estado)

  async function abrirSobre() {
    setAbriendo(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('album_abrir_sobre')
    setAbriendo(false)
    if (err) { setError(err.message); return }
    setDatosSobre(data)
    setFlipped(new Array(data.length).fill(false))
    setFaseSobre('cerrado')
    refrescar()
  }

  function rasgarSobre() {
    setFaseSobre('rasgando')
    setTimeout(() => setFaseSobre('revelando'), 750)
  }

  function flipCarta(i) {
    setFlipped(prev => prev.map((v, idx) => idx === i ? true : v))
  }

  function cerrarSobre() {
    setFaseSobre(null)
    setDatosSobre(null)
    setFlipped([])
  }

  return (
    <div className="album-page">
      <SEO
        title="Álbum de Cromos del Real Zaragoza | RZ Hub"
        description="Colecciona los cromos digitales de la plantilla del Real Zaragoza y de la Edición Leyenda. Abre un sobre gratis cada día."
        keywords="álbum cromos Real Zaragoza, cromos digitales Real Zaragoza, panini Real Zaragoza"
        path="/album"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Álbum de Cromos | RZ Hub',
          url: `${SITE_URL}/album`,
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          description: 'Álbum de cromos digitales del Real Zaragoza, con plantilla actual y Edición Leyenda.',
        }}
      />

      <div className="album-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow">Colecciona la plantilla al completo</p>
        <h1 className="album-page__title">Álbum de Cromos</h1>
        <p className="album-page__subtitle">Un sobre gratis cada día. Consigue toda la plantilla y la Edición Leyenda.</p>
      </div>

      <div className="album-page__body">
        <div className="album-page__container">
          {!user ? (
            <div className="album-login">
              <p>Inicia sesión para empezar a coleccionar cromos.</p>
              <button onClick={signInWithGoogle} className="rz-btn rz-btn--primary">Iniciar sesión con Google</button>
            </div>
          ) : loading ? (
            <p className="album-page__state">Cargando álbum…</p>
          ) : (
            <>
              <div className="album-panel">
                <div className="album-panel__progreso">
                  <p className="album-panel__progreso-num">{totalConseguidos} / {cromos.length}</p>
                  <p className="album-panel__progreso-label">cromos conseguidos</p>
                  <div className="album-panel__barra">
                    <div className="album-panel__barra-relleno" style={{ width: `${cromos.length ? (totalConseguidos / cromos.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <button className="rz-btn rz-btn--primary album-panel__boton" onClick={abrirSobre} disabled={bloqueado || abriendo}>
                  {abriendo ? 'Abriendo…' : bloqueado ? 'Ya has abierto tu sobre de hoy' : 'Abrir sobre (5 cromos)'}
                </button>
                {error && <p className="album-panel__error">{error}</p>}
              </div>

              <section className="album-seccion">
                <h2 className="album-seccion__titulo">Plantilla 26/27</h2>
                <div className="album-grid">
                  {plantilla.map(c => <CromoCard key={c.id} cromo={c} cantidad={coleccion[c.id] || 0} />)}
                </div>
              </section>

              <section className="album-seccion">
                <h2 className="album-seccion__titulo">Edición Leyenda</h2>
                <div className="album-grid">
                  {leyendas.map(c => <CromoCard key={c.id} cromo={c} cantidad={coleccion[c.id] || 0} />)}
                </div>
              </section>
            </>
          )}
        </div>

        <Footer />
      </div>

      {faseSobre && (
        <SobreOverlay
          datos={datosSobre}
          fase={faseSobre}
          flipped={flipped}
          onRasgar={rasgarSobre}
          onFlip={flipCarta}
          onRevelarTodas={() => setFlipped(prev => prev.map(() => true))}
          onCerrar={cerrarSobre}
        />
      )}
    </div>
  )
}
