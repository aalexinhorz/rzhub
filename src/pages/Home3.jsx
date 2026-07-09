import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../hooks/useAuth'

const RSS2JSON_KEY = 'em9i5los5dhem2nejvr2tolxzoqdjtjplwlvcpuf'

const PARTIDOS_CALENDARIO = [
  { rival: 'Utebo', fecha: '29 Jul', hora: '18:00', sede: 'local', escudo: '/escudos/spain_utebo.football-logos.cc.svg' },
  { rival: 'Barbastro', fecha: '1 Ago', hora: '19:00', sede: 'visitante', escudo: '/escudos/ud-barbastro-seeklogo.png' },
  { rival: 'FC Andorra', fecha: '6 Ago', hora: '20:00', sede: 'local', escudo: '/escudos/Logo_FC_Andorra_-_2021 (1).svg' },
  { rival: 'Real Sociedad B', fecha: '8 Ago', hora: '19:00', sede: 'local', escudo: '/escudos/Real_Sociedad_logo.svg' },
  { rival: 'UD Logroñés', fecha: '14 Ago', hora: '18:30', sede: 'visitante', escudo: '/escudos/spain_ud-logrones.football-logos.cc.svg' },
  { rival: 'Villarreal B', fecha: '15 Ago', hora: '19:00', sede: 'visitante', escudo: '/escudos/Villarreal_CF_logo-en.svg' },
]

const TIPO_CONFIG = {
  alta:          { label: 'FICHAJE',       esEntrada: true,  color: '#27ae60' },
  baja:          { label: 'VENTA',         esEntrada: false, color: '#e74c3c' },
  cesion_salida: { label: 'CEDIDO',        esEntrada: false, color: '#e67e22' },
  cesion_vuelta: { label: 'VUELTA CESIÓN', esEntrada: true,  color: '#2980b9' },
}

const ESCUDOS_CLUBS = {
  'Real Sociedad B': '/escudos/Real_Sociedad_logo.svg',
  'Villarreal B': '/escudos/Villarreal_CF_logo-en.svg',
  'Bilbao Athletic': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Barbastro': '/escudos/ud-barbastro-seeklogo.png',
  'UD Barbastro': '/escudos/ud-barbastro-seeklogo.png',
  'FC Andorra': '/escudos/Logo_FC_Andorra_-_2021 (1).svg',
  'Utebo': '/escudos/spain_utebo.football-logos.cc.svg',
  'UD Logroñés': '/escudos/spain_ud-logrones.football-logos.cc.svg',
  'CD Numancia': '/escudos/spain_numancia.football-logos.cc.svg',
  'Numancia': '/escudos/spain_numancia.football-logos.cc.svg',
  'Real Madrid': '/escudos/Real_Madrid_CF.svg',
  'FC Barcelona': '/escudos/FC_Barcelona_(crest) (5).svg',
  'Barcelona': '/escudos/FC_Barcelona_(crest) (5).svg',
  'Atlético de Madrid': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Atlético Madrid': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Real Sociedad': '/escudos/Real_Sociedad_logo.svg',
  'Athletic Club': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Sevilla FC': '/escudos/Sevilla_FC_logo.svg',
  'Sevilla': '/escudos/Sevilla_FC_logo.svg',
  'Real Betis': '/escudos/Real_betis_logo (1).svg',
  'Betis': '/escudos/Real_betis_logo (1).svg',
  'Girona FC': '/escudos/Girona_FC_Logo.svg',
  'Girona': '/escudos/Girona_FC_Logo.svg',
  'Osasuna': '/escudos/CA_Osasuna_2024_crest.svg',
  'Rayo Vallecano': '/escudos/Rayo_Vallecano_logo (1).svg',
  'Getafe CF': '/escudos/Getafe_logo.svg',
  'Getafe': '/escudos/Getafe_logo.svg',
  'Celta de Vigo': '/escudos/RC_Celta_de_Vigo_logo (1).svg',
  'RC Celta': '/escudos/RC_Celta_de_Vigo_logo (1).svg',
  'Espanyol': '/escudos/RCD_Espanyol_crest.svg',
  'RCD Espanyol': '/escudos/RCD_Espanyol_crest.svg',
  'Mallorca': '/escudos/Rcd_mallorca.svg',
  'RCD Mallorca': '/escudos/Rcd_mallorca.svg',
  'Alavés': '/escudos/Deportivo_Alaves_logo_(2020).svg',
  'Levante UD': '/escudos/Levante_Unión_Deportiva,_S.A.D._logo.svg',
  'Valencia CF': '/escudos/Valenciacf (2).svg',
  'Valencia': '/escudos/Valenciacf (2).svg',
  'SD Huesca': '/escudos/Logo_of_SD_Huesca.svg',
  'Huesca': '/escudos/huesca.png',
  'SD Eibar': '/escudos/SD_Eibar_logo_2016.svg',
  'Eibar': '/escudos/eibar.png',
  'Burgos CF': '/escudos/burgos-cf.svg',
  'Burgos': '/escudos/burgos.png',
  'Real Oviedo': '/escudos/Real_Oviedo_logo (1).svg',
  'Oviedo': '/escudos/Real_Oviedo_logo (1).svg',
  'Sporting de Gijón': '/escudos/Real_Sporting_de_Gijon (1).svg',
  'Sporting': '/escudos/sporting.png',
  'Real Valladolid': '/escudos/Real_Valladolid_CF_crest.svg',
  'Valladolid': '/escudos/valladolid.png',
  'Deportivo de La Coruña': '/escudos/RC_Deportivo_La_Coruña_logo (1).svg',
  'Deportivo': '/escudos/Depor.png',
  'Almería': '/escudos/almeria.png',
  'UD Almería': '/escudos/UD_Almería_logo (1).svg',
  'Cádiz CF': '/escudos/Cádiz_CF_logo (1).svg',
  'Cádiz': '/escudos/cadiz.png',
  'Granada CF': '/escudos/Logo_of_Granada_Club_de_Fútbol.svg',
  'Granada': '/escudos/granada.png',
  'Albacete BP': '/escudos/Albacete_balompie.svg',
  'Albacete': '/escudos/albacete.png',
  'CD Castellón': '/escudos/Logo_of_CD_Castellón (1).svg',
  'Castellón': '/escudos/Logo_of_CD_Castellón (1).svg',
  'CD Mirandés': '/escudos/CD_Mirandés_logo.svg',
  'Mirandés': '/escudos/mirandes.png',
  'CD Leganés': '/escudos/Club_Deportivo_Leganés_logo.svg',
  'Leganés': '/escudos/leganes.png',
  'Córdoba CF': '/escudos/Córdoba_CF_logo.svg',
  'Córdoba': '/escudos/Córdoba_CF_logo.svg',
  'Málaga CF': '/escudos/Málaga_CF (1).svg',
  'Málaga': '/escudos/Málaga_CF (1).svg',
  'Racing de Santander': '/escudos/Racing_de_Santander_logo.svg',
  'Racing': '/escudos/racing.png',
  'FC Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'AD Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Real Murcia CF': '/escudos/Real_Murcia_CF_logo.svg',
  'Real Murcia': '/escudos/Real_Murcia_CF_logo.svg',
  'Hércules': '/escudos/Hercules_CF_crest.svg',
  'Algeciras CF': '/escudos/spain_algeciras.football-logos.cc.svg',
  'Algeciras': '/escudos/spain_algeciras.football-logos.cc.svg',
  'Gimnàstic de Tarragona': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Nàstic': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Real Jaén': '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'AD Ceuta': '/escudos/Logo_AD_Ceuta_FC.svg',
  'Ceuta': '/escudos/ad ceuta.png',
  'Andorra': '/escudos/Logo_FC_Andorra_-_2021 (1).svg',
  'UD Las Palmas': '/escudos/UD_Las_Palmas_logo (1).svg',
  'Las Palmas': '/escudos/las palmas.png',
  'Venezia': '/escudos/venezia.cc.svg',
  'CD Teruel': '/escudos/CD_Teruel_logo.svg',
  'Rayo Majadahonda': '/escudos/Rayo_Majadahonda_(logo).svg',
  'Libre': '/escudos/agentelibre.svg',
}

const tsdbCache = {}

async function fetchEscudoFromTSDB(club) {
  if (!club) return null
  if (tsdbCache[club] !== undefined) return tsdbCache[club]
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(club)}`)
    const data = await res.json()
    const badge = data?.teams?.[0]?.strBadge || null
    tsdbCache[club] = badge
    return badge
  } catch {
    tsdbCache[club] = null
    return null
  }
}

function useEscudo(club) {
  const [src, setSrc] = useState(ESCUDOS_CLUBS[club] || null)
  useEffect(() => {
    if (!club) return
    if (ESCUDOS_CLUBS[club]) { setSrc(ESCUDOS_CLUBS[club]); return }
    if (tsdbCache[club] !== undefined) { setSrc(tsdbCache[club]); return }
    fetchEscudoFromTSDB(club).then(url => setSrc(url))
  }, [club])
  return src
}

function normalizar(str) {
  if (!str) return ''
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function extraerImagen(description) {
  if (!description) return null
  const match = description.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'

const F = 'Archivo, sans-serif'

function BarraNoticias({ tweets }) {
  const trackRef = useRef(null)
  const posRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (tweets.length === 0) return
    const animate = () => {
      posRef.current += 0.5
      const totalW = trackRef.current ? trackRef.current.scrollWidth / 2 : 0
      if (posRef.current >= totalW) posRef.current = 0
      if (trackRef.current) trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tweets])

  if (tweets.length === 0) return null

  const DUPES = [...tweets, ...tweets]

  return (
    <div style={{ background: '#1a1a1a', borderBottom: '1px solid #333', overflow: 'hidden', position: 'relative', height: '34px', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', zIndex: 2, background: 'linear-gradient(to right, #1a1a1a, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', zIndex: 2, background: 'linear-gradient(to left, #1a1a1a, transparent)', pointerEvents: 'none' }} />
      <div ref={trackRef} style={{ display: 'flex', gap: '48px', willChange: 'transform', width: 'max-content', padding: '0 24px', alignItems: 'center' }}>
        {DUPES.map((t, i) => {
          const itemStyle = {
            fontFamily: F,
            fontSize: '11px',
            color: '#ccc',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }
          return (
            <a key={i} href={t.link} target="_blank" rel="noopener noreferrer" style={itemStyle}>
              <span style={{ color: '#ffc800', fontWeight: '700', fontSize: '10px', background: '#0B4390', padding: '1px 5px', borderRadius: '3px' }}>MB</span>
              {t.titulo?.slice(0, 90)}{(t.titulo?.length || 0) > 90 ? '...' : ''}
            </a>
          )
        })}
      </div>
    </div>
  )
}

function FichajeCard({ mov }) {
  const tipo = TIPO_CONFIG[mov.tipo] || TIPO_CONFIG.alta
  const clubExterno = tipo.esEntrada ? mov.club_origen : mov.club_destino
  const escudo = useEscudo(clubExterno)

  return (
    <a href="/mercado" style={{ textDecoration: 'none', flexShrink: 0, width: '110px' }}>
      <div style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '8px', overflow: 'hidden', background: '#1a1a2e', marginBottom: '6px' }}>
        <img
          src={mov.foto_url || DEFAULT_PHOTO}
          alt={mov.nombre}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }}
          onError={e => { e.target.src = DEFAULT_PHOTO }}
        />
        {escudo && (
          <div style={{ position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            <img src={escudo} alt={clubExterno} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: tipo.color }} />
      </div>
      <div style={{ fontFamily: F, fontWeight: '800', fontSize: '11px', color: '#111', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '2px' }}>
        {mov.nombre.split(' ').slice(-1)[0]}
      </div>
      <div style={{ fontFamily: F, fontSize: '10px', fontWeight: '700', color: tipo.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {tipo.label}
      </div>
    </a>
  )
}

function NoticiaCard({ noticia }) {
  const fecha = new Date(noticia.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return (
    <a href={noticia.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div
        style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e8e8e8', transition: 'box-shadow 0.15s', cursor: 'pointer', height: '100%' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
      >
        {noticia.imagen ? (
          <div style={{ height: '130px', overflow: 'hidden', background: '#f0f0f0' }}>
            <img src={noticia.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
          </div>
        ) : (
          <div style={{ height: '70px', background: 'linear-gradient(135deg, #0B4390, #083070)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/escudos/Real_Zaragoza_logo (3).svg" alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', opacity: 0.3 }} />
          </div>
        )}
        <div style={{ padding: '10px' }}>
          <div style={{ fontFamily: F, fontWeight: '700', fontSize: '12px', color: '#111', lineHeight: 1.4, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {noticia.titulo}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ background: '#1da1f2', color: 'white', borderRadius: '3px', padding: '2px 5px', fontFamily: F, fontSize: '9px', fontWeight: '700' }}>
              @MBlanquillo
            </span>
            <span style={{ fontFamily: F, fontSize: '10px', color: '#999' }}>{fecha}</span>
          </div>
        </div>
      </div>
    </a>
  )
}

export default function Home3() {
  const navigate = useNavigate()
  const [tweets, setTweets] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loadingTweets, setLoadingTweets] = useState(true)
  const [loadingMov, setLoadingMov] = useState(true)

  useEffect(() => {
    async function cargarTweets() {
      try {
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://nitter.net/MBlanquillo1932/rss')}&api_key=${RSS2JSON_KEY}&count=20`
        const res = await fetch(url)
        const data = await res.json()
        if (data.status === 'ok') {
          setTweets((data.items || []).slice(0, 20).map(item => ({
            titulo: item.title,
            link: item.link?.replace('https://nitter.net', 'https://x.com'),
            fecha: item.pubDate,
            imagen: extraerImagen(item.description),
          })))
        }
      } catch (e) { console.error(e) }
      finally { setLoadingTweets(false) }
    }

    async function cargarMercado() {
      const { data: movData } = await supabase.from('mercado').select('*').order('fecha', { ascending: false })
      if (!movData) { setLoadingMov(false); return }
      const sinFoto = movData.filter(m => !m.foto_url)
      if (sinFoto.length > 0) {
        const { data: players } = await supabase.from('players').select('name, photo')
        if (players) {
          movData.forEach(mov => {
            if (!mov.foto_url) {
              const player = players.find(p => normalizar(p.name) === normalizar(mov.nombre))
              if (player) mov.foto_url = player.photo
            }
          })
        }
      }
      setMovimientos(movData)
      setLoadingMov(false)
    }

    cargarTweets()
    cargarMercado()
  }, [])

  const destacado = tweets.find(t => t.imagen)
  const tweetsRecientes = tweets.slice(0, 6)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0', fontFamily: F, color: '#111' }}>
      <Helmet>
        <title>RZ Hub | Todo sobre el Real Zaragoza</title>
        <meta name="description" content="La plataforma fan del Real Zaragoza." />
        <link rel="canonical" href="https://rzhub.es" />
      </Helmet>

      <BarraNoticias tweets={tweets} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

          {/* ── COLUMNA IZQUIERDA ── */}
          <div>

            {/* EL NOTICIERO */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ fontFamily: F, fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#111', letterSpacing: '1px' }}>El Noticiero</h2>
                <a href="/rumores" style={{ fontFamily: F, fontSize: '11px', color: '#0B4390', fontWeight: '700', textDecoration: 'none', border: '1px solid #0B4390', borderRadius: '20px', padding: '3px 10px' }}>
                  Todas las noticias
                </a>
              </div>
              {loadingTweets ? (
                <div style={{ height: '100px', background: '#e0e0e0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px', fontFamily: F }}>Cargando...</div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {tweets.slice(0, 8).map((t, i) => (
                    <a key={i} href={t.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0, width: '160px' }}>
                      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0', height: '100%' }}>
                        {t.imagen ? (
                          <div style={{ height: '80px', overflow: 'hidden', background: '#f0f0f0' }}>
                            <img src={t.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                          </div>
                        ) : (
                          <div style={{ height: '50px', background: 'linear-gradient(135deg, #0B4390, #083070)' }} />
                        )}
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontFamily: F, fontSize: '11px', fontWeight: '600', color: '#111', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {t.titulo}
                          </div>
                          <div style={{ fontFamily: F, fontSize: '10px', color: '#999', marginTop: '4px' }}>
                            {new Date(t.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* FICHAJES DEL DÍA */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ fontFamily: F, fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#111', letterSpacing: '1px' }}>Fichajes del día</h2>
                <a href="/mercado" style={{ fontFamily: F, fontSize: '11px', color: '#0B4390', fontWeight: '700', textDecoration: 'none', border: '1px solid #0B4390', borderRadius: '20px', padding: '3px 10px' }}>
                  Todos los fichajes
                </a>
              </div>
              {loadingMov ? (
                <div style={{ height: '100px', background: '#e0e0e0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px', fontFamily: F }}>Cargando...</div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {movimientos.slice(0, 12).map((mov, i) => (
                    <FichajeCard key={i} mov={mov} />
                  ))}
                </div>
              )}
            </div>

            {/* ARTÍCULO DESTACADO */}
            {destacado && (
              <div style={{ marginBottom: '24px' }}>
                <a href={destacado.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div
                    style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0', display: 'grid', gridTemplateColumns: '220px 1fr', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <img src={destacado.imagen} alt="" style={{ width: '220px', height: '150px', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ background: '#0B4390', color: 'white', borderRadius: '3px', padding: '2px 7px', fontFamily: F, fontSize: '10px', fontWeight: '700' }}>ARTÍCULO DESTACADO</span>
                        <span style={{ background: '#1da1f2', color: 'white', borderRadius: '3px', padding: '2px 7px', fontFamily: F, fontSize: '10px', fontWeight: '700' }}>@MBlanquillo</span>
                      </div>
                      <div style={{ fontFamily: F, fontWeight: '800', fontSize: '15px', color: '#111', lineHeight: 1.4, marginBottom: '8px' }}>
                        {destacado.titulo}
                      </div>
                      <div style={{ fontFamily: F, fontSize: '11px', color: '#999' }}>
                        {new Date(destacado.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            )}

            {/* LINEUP + TIERLIST */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div
                onClick={() => navigate('/lineup')}
                style={{ background: '#0B4390', borderRadius: '8px', padding: '18px', cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                <div style={{ fontFamily: F, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>⊞ LINEUP</div>
                <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '32px', fontWeight: '700', color: 'white', textTransform: 'uppercase', lineHeight: 1, marginBottom: '6px' }}>LINEUP BUILDER</div>
                <div style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: '10px' }}>Construye tus alineaciones y planifica el mercado del Real Zaragoza</div>
                <div style={{ fontFamily: F, fontSize: '12px', color: '#ffc800', fontWeight: '700' }}>Ir al Lineup →</div>
              </div>
              <div
                onClick={() => navigate('/tierlist')}
                style={{ background: '#111', borderRadius: '8px', padding: '18px', cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                <div style={{ fontFamily: F, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>🏆 TIERLIST</div>
                <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '32px', fontWeight: '700', color: 'white', textTransform: 'uppercase', lineHeight: 1, marginBottom: '6px' }}>POWER RANKING</div>
                <div style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: '10px' }}>Nuestro top 10 de jugadores más calientes del mercado del Zaragoza</div>
                <div style={{ fontFamily: F, fontSize: '12px', color: '#ffc800', fontWeight: '700' }}>Ver Tier List →</div>
              </div>
            </div>

            {/* NOTICIAS RECIENTES */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ fontFamily: F, fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#111', letterSpacing: '1px' }}>Noticias recientes</h2>
                <a href="/rumores" style={{ fontFamily: F, fontSize: '11px', color: '#0B4390', fontWeight: '700', textDecoration: 'none', border: '1px solid #0B4390', borderRadius: '20px', padding: '3px 10px' }}>
                  Ver todas →
                </a>
              </div>
              {loadingTweets ? (
                <div style={{ height: '200px', background: '#e0e0e0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px', fontFamily: F }}>Cargando...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {tweetsRecientes.map((t, i) => (
                    <NoticiaCard key={i} noticia={t} />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* FICHAJES VERANO */}
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <div style={{ background: '#0B4390', padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: F, fontWeight: '700', fontSize: '11px', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Fichajes Verano 2026</span>
                <a href="/mercado" style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Ver all →</a>
              </div>
              <div style={{ padding: '4px 0' }}>
                {loadingMov ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '12px', fontFamily: F }}>Cargando...</div>
                ) : movimientos.slice(0, 6).map((mov, i) => {
                  const tipo = TIPO_CONFIG[mov.tipo] || TIPO_CONFIG.alta
                  const clubExterno = tipo.esEntrada ? mov.club_origen : mov.club_destino
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderBottom: i < 5 ? '1px solid #f5f5f5' : 'none' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0' }}>
                        <img src={mov.foto_url || DEFAULT_PHOTO} alt={mov.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} onError={e => { e.target.src = DEFAULT_PHOTO }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontWeight: '700', fontSize: '12px', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mov.nombre}</div>
                        <div style={{ fontFamily: F, fontSize: '10px', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clubExterno || '—'}</div>
                      </div>
                      <span style={{ fontFamily: F, fontSize: '10px', fontWeight: '700', color: tipo.color, textTransform: 'uppercase', flexShrink: 0 }}>
                        {tipo.esEntrada ? '+ FICHAJE' : '- VENTA'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ACTUALIZACIONES DE MERCADO */}
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <div style={{ background: '#111', padding: '9px 12px' }}>
                <span style={{ fontFamily: F, fontWeight: '700', fontSize: '11px', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Actualizaciones de mercado</span>
              </div>
              <div>
                {loadingTweets ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '12px', fontFamily: F }}>Cargando...</div>
                ) : tweets.slice(0, 4).map((t, i) => (
                  <a key={i} href={t.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      style={{ padding: '10px 12px', borderBottom: i < 3 ? '1px solid #f5f5f5' : 'none', display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'white' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fafafa' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
                    >
                      {t.imagen && (
                        <img src={t.imagen} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: '11px', fontWeight: '600', color: '#111', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '3px' }}>
                          {t.titulo}
                        </div>
                        <div style={{ fontFamily: F, fontSize: '10px', color: '#1da1f2', fontWeight: '600' }}>@MBlanquillo1932</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* CALENDARIO */}
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontFamily: F, fontWeight: '700', fontSize: '13px', color: '#111' }}>Calendario</span>
                <a href="/calendario" style={{ fontFamily: F, fontSize: '10px', color: '#0B4390', fontWeight: '700', textDecoration: 'none', background: '#f0f4ff', borderRadius: '20px', padding: '2px 8px' }}>
                  Completo →
                </a>
              </div>
              {PARTIDOS_CALENDARIO.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: i < PARTIDOS_CALENDARIO.length - 1 ? '1px solid #f5f5f5' : 'none', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <div style={{ width: '32px', height: '32px', background: p.sede === 'local' ? '#0B4390' : '#e74c3c', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={p.escudo} alt={p.rival} style={{ width: '20px', height: '20px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F, fontWeight: '700', fontSize: '11px', color: '#111' }}>Real Zaragoza</div>
                    <div style={{ fontFamily: F, fontSize: '10px', color: '#999' }}>vs {p.rival}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: F, fontSize: '11px', fontWeight: '700', color: '#111' }}>{p.fecha}</div>
                    <div style={{ fontFamily: F, fontSize: '10px', color: '#999' }}>{p.hora}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}