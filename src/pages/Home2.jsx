import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../hooks/useAuth'
import useLiveStream from '../hooks/useLiveStream'

const TEAM_ID = 2815
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const API_HOST = 'sportapi7.p.rapidapi.com'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'

const PARTIDOS = [
  { rival: 'Utebo', fecha: '29 Jul', sede: 'local', escudo: '/escudos/spain_utebo.football-logos.cc.svg' },
  { rival: 'Barbastro', fecha: '1 Ago', sede: 'visitante', escudo: '/escudos/ud-barbastro-seeklogo.png' },
  { rival: 'FC Andorra', fecha: '6 Ago', sede: 'local', escudo: '/escudos/Logo_FC_Andorra_-_2021 (1).svg' },
  { rival: 'Real Sociedad B', fecha: '8 Ago', sede: 'local', escudo: '/escudos/Real_Sociedad_logo.svg' },
  { rival: 'UD Logroñés', fecha: '14 Ago', sede: 'visitante', escudo: '/escudos/spain_ud-logrones.football-logos.cc.svg' },
  { rival: 'Villarreal B', fecha: '15 Ago', sede: 'visitante', escudo: '/escudos/Villarreal_CF_logo-en.svg' },
  { rival: 'Bilbao Athletic', fecha: '21 Ago', sede: 'local', escudo: '/escudos/Club_Athletic_Bilbao_logo (1).svg' },
  { rival: 'CD Numancia', fecha: '22 Ago', sede: 'neutral', escudo: '/escudos/spain_numancia.football-logos.cc.svg' },
]

const DUPLICADOS_PARTIDOS = [...PARTIDOS, ...PARTIDOS, ...PARTIDOS]

const ESCUDOS_CLUBS = {
  'Gimnàstic de Tarragona': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Nàstic': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Antequera CF': '/escudos/spain_antequera.football-logos.cc.svg',
  'Antequera': '/escudos/spain_antequera.football-logos.cc.svg',
  'Juventud de Torremolinos CF': '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'Torremolinos': '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'FC Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'UD Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'CD Teruel': '/escudos/CD_Teruel_logo.svg',
  'Teruel': '/escudos/CD_Teruel_logo.svg',
  'Atlético Madrileño': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Real Murcia CF': '/escudos/Real_Murcia_CF_logo.svg',
  'Real Murcia': '/escudos/Real_Murcia_CF_logo.svg',
  'CE Europa': '/escudos/Club_Esportiu_Europa.svg',
  'Hércules de Alicante CF': '/escudos/Hercules_CF_crest.svg',
  'Hércules': '/escudos/Hercules_CF_crest.svg',
  'Algeciras CF': '/escudos/spain_algeciras.football-logos.cc.svg',
  'Algeciras': '/escudos/spain_algeciras.football-logos.cc.svg',
  'UE Sant Andreu': '/escudos/ue-sant-andreu-vector-logo.png',
  'CF Rayo Majadahonda': '/escudos/Rayo_Majadahonda_(logo).svg',
  'Rayo Majadahonda': '/escudos/Rayo_Majadahonda_(logo).svg',
  'Real Jaén CF': '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'Real Jaén': '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'AD Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Águilas FC': '/escudos/logo.svg',
  'Real Madrid Castilla': '/escudos/Real_Madrid_CF.svg',
  'Real Madrid B': '/escudos/Real_Madrid_CF.svg',
  'Villarreal B': '/escudos/Villarreal_CF_logo-en.svg',
  'Villarreal CF B': '/escudos/Villarreal_CF_logo-en.svg',
  'SD Huesca': '/escudos/Logo_of_SD_Huesca.svg',
  'Huesca': '/escudos/huesca.png',
  'Athletic Club': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Athletic': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Atlético de Madrid': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Atlético Madrid': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Real Madrid': '/escudos/Real_Madrid_CF.svg',
  'FC Barcelona': '/escudos/FC_Barcelona_(crest) (5).svg',
  'Barcelona': '/escudos/FC_Barcelona_(crest) (5).svg',
  'Real Sociedad': '/escudos/Real_Sociedad_logo.svg',
  'Sevilla FC': '/escudos/Sevilla_FC_logo.svg',
  'Sevilla': '/escudos/Sevilla_FC_logo.svg',
  'Real Betis': '/escudos/Real_betis_logo (1).svg',
  'Betis': '/escudos/Real_betis_logo (1).svg',
  'Getafe CF': '/escudos/Getafe_logo.svg',
  'Getafe': '/escudos/Getafe_logo.svg',
  'Girona FC': '/escudos/Girona_FC_Logo.svg',
  'Girona': '/escudos/Girona_FC_Logo.svg',
  'Osasuna': '/escudos/CA_Osasuna_2024_crest.svg',
  'CA Osasuna': '/escudos/CA_Osasuna_2024_crest.svg',
  'Rayo Vallecano': '/escudos/Rayo_Vallecano_logo (1).svg',
  'Levante': '/escudos/Levante_Unión_Deportiva,_S.A.D._logo.svg',
  'Levante UD': '/escudos/Levante_Unión_Deportiva,_S.A.D._logo.svg',
  'Deportivo Alavés': '/escudos/Deportivo_Alaves_logo_(2020).svg',
  'Alavés': '/escudos/Deportivo_Alaves_logo_(2020).svg',
  'Elche CF': '/escudos/Elche_CF_logo.svg',
  'Elche': '/escudos/Elche_CF_logo.svg',
  'Celta de Vigo': '/escudos/RC_Celta_de_Vigo_logo (1).svg',
  'RC Celta': '/escudos/RC_Celta_de_Vigo_logo (1).svg',
  'Espanyol': '/escudos/RCD_Espanyol_crest.svg',
  'RCD Espanyol': '/escudos/RCD_Espanyol_crest.svg',
  'Mallorca': '/escudos/Rcd_mallorca.svg',
  'RCD Mallorca': '/escudos/Rcd_mallorca.svg',
  'Real Valladolid': '/escudos/Real_Valladolid_CF_crest.svg',
  'Valladolid': '/escudos/valladolid.png',
  'Real Oviedo': '/escudos/Real_Oviedo_logo (1).svg',
  'Oviedo': '/escudos/Real_Oviedo_logo (1).svg',
  'Deportivo de La Coruña': '/escudos/RC_Deportivo_La_Coruña_logo (1).svg',
  'Deportivo': '/escudos/Depor.png',
  'Sporting de Gijón': '/escudos/Real_Sporting_de_Gijon (1).svg',
  'Sporting': '/escudos/sporting.png',
  'SD Eibar': '/escudos/SD_Eibar_logo_2016.svg',
  'Eibar': '/escudos/eibar.png',
  'Burgos CF': '/escudos/burgos-cf.svg',
  'Burgos': '/escudos/burgos.png',
  'Albacete': '/escudos/albacete.png',
  'Albacete BP': '/escudos/Albacete_balompie.svg',
  'Almería': '/escudos/almeria.png',
  'UD Almería': '/escudos/UD_Almería_logo (1).svg',
  'Cádiz': '/escudos/cadiz.png',
  'Cádiz CF': '/escudos/Cádiz_CF_logo (1).svg',
  'CD Castellón': '/escudos/CD Castellon.png',
  'Castellón': '/escudos/Logo_of_CD_Castellón (1).svg',
  'Córdoba CF': '/escudos/Cordoba CF.png',
  'Córdoba': '/escudos/Córdoba_CF_logo.svg',
  'Cultural Leonesa': '/escudos/Cultural leonesa.png',
  'Cultural y Deportiva Leonesa': '/escudos/Logo_of_Cultural_y_Deportiva_Leonesa.svg',
  'Granada CF': '/escudos/Logo_of_Granada_Club_de_Fútbol.svg',
  'Granada': '/escudos/granada.png',
  'Las Palmas': '/escudos/las palmas.png',
  'UD Las Palmas': '/escudos/UD_Las_Palmas_logo (1).svg',
  'Leganés': '/escudos/leganes.png',
  'CD Leganés': '/escudos/Club_Deportivo_Leganés_logo.svg',
  'Málaga CF': '/escudos/Malaga CF.png',
  'Málaga': '/escudos/Málaga_CF (1).svg',
  'Mirandés': '/escudos/mirandes.png',
  'CD Mirandés': '/escudos/CD_Mirandés_logo.svg',
  'Racing de Santander': '/escudos/Racing_de_Santander_logo.svg',
  'Racing': '/escudos/racing.png',
  'FC Andorra': '/escudos/Logo_FC_Andorra_-_2021 (1).svg',
  'Andorra': '/escudos/Logo_FC_Andorra_-_2021 (1).svg',
  'UD Barbastro': '/escudos/ud-barbastro-seeklogo.png',
  'Barbastro': '/escudos/ud-barbastro-seeklogo.png',
  'Ad Ceuta': '/escudos/ad ceuta.png',
  'AD Ceuta': '/escudos/Logo_AD_Ceuta_FC.svg',
  'Ceuta': '/escudos/ad ceuta.png',
  'Valencia CF': '/escudos/Valenciacf (2).svg',
  'Valencia': '/escudos/Valenciacf (2).svg',
  'Villarreal CF': '/escudos/Villarreal CF.png',
  'Venezia': '/escudos/venezia.cc.svg',
  'Libre': '/escudos/agentelibre.svg',
}

const tsdbCache = {}

async function fetchEscudoFromTSDB(club) {
  if (!club) return null
  if (tsdbCache[club] !== undefined) return tsdbCache[club]
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(club)}`
    )
    const data = await res.json()
    const badge = data?.teams?.[0]?.strBadge || null
    tsdbCache[club] = badge
    return badge
  } catch {
    tsdbCache[club] = null
    return null
  }
}

function getEscudoInmediato(club) {
  if (!club) return null
  if (ESCUDOS_CLUBS[club]) return ESCUDOS_CLUBS[club]
  if (tsdbCache[club] !== undefined) return tsdbCache[club]
  return null
}

// Hook para resolver escudo async
function useEscudo(club) {
  const [src, setSrc] = useState(() => getEscudoInmediato(club))

  useEffect(() => {
    if (!club) return
    if (ESCUDOS_CLUBS[club]) { setSrc(ESCUDOS_CLUBS[club]); return }
    if (tsdbCache[club] !== undefined) { setSrc(tsdbCache[club]); return }
    fetchEscudoFromTSDB(club).then(url => setSrc(url))
  }, [club])

  return src
}

const TIPO_CONFIG = {
  alta:          { label: 'FICHAJE',       esEntrada: true },
  baja:          { label: 'SALIDA',        esEntrada: false },
  cesion_salida: { label: 'CEDIDO',        esEntrada: false },
  cesion_vuelta: { label: 'VUELTA CESIÓN', esEntrada: true },
}

const HERRAMIENTAS = [
  { icon: '⊞', titulo: 'Lineup Builder', desc: 'Crea tu alineación ideal y compártela con la comunidad.', ruta: '/lineup' },
  { icon: '↗', titulo: 'Mercado', desc: 'Sigue los fichajes, rumores y valoraciones de los jugadores.', ruta: '/mercado' },
  { icon: '🚌', titulo: 'On Tour', desc: 'Información de desplazamientos, entradas y rutas.', ruta: '/on-tour' },
  { icon: '📅', titulo: 'Calendario', desc: 'Todos los partidos, horarios y sincroniza con tu calendario.', ruta: '/calendario' },
  { icon: '🏆', titulo: 'La Porra', desc: 'Predice resultados y compite con otros zaragocistas.', ruta: '/porra' },
]

function normalizar(str) {
  if (!str) return ''
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function useProximoPartido() {
  const [partido, setPartido] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function fetchPartidos() {
      try {
        const res = await fetch(
          `https://${API_HOST}/api/v1/team/${TEAM_ID}/events/next/0`,
          { headers: { 'x-rapidapi-host': API_HOST, 'x-rapidapi-key': API_KEY } }
        )
        const data = await res.json()
        const events = data?.events || []
        if (events.length > 0) setPartido(events[0])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchPartidos()
  }, [])
  return { partido, loading }
}

function usePartidoEnVivo() {
  const [partido, setPartido] = useState(null)
  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch(
          `https://${API_HOST}/api/v1/team/${TEAM_ID}/events/live`,
          { headers: { 'x-rapidapi-host': API_HOST, 'x-rapidapi-key': API_KEY } }
        )
        if (!res.ok) return
        const data = await res.json()
        const events = data?.events || []
        if (events.length > 0) setPartido(events[0])
      } catch (e) { console.error(e) }
    }
    fetchLive()
    const interval = setInterval(fetchLive, 60000)
    return () => clearInterval(interval)
  }, [])
  return partido
}

function Countdown({ timestamp }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    function calcular() {
      const diff = timestamp * 1000 - Date.now()
      if (diff <= 0) { setTimeLeft('¡Ahora!'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      if (d > 0) setTimeLeft(`${d}d ${h}h`)
      else if (h > 0) setTimeLeft(`${h}h ${m}m`)
      else setTimeLeft(`${m}m`)
    }
    calcular()
    const interval = setInterval(calcular, 60000)
    return () => clearInterval(interval)
  }, [timestamp])
  return <span>{timeLeft}</span>
}

function CarruselPartidos() {
  const trackRef = useRef(null)
  const posRef = useRef(0)
  const rafRef = useRef(null)
  const CARD_W = 190
  const GAP = 10
  const STEP = 0.5
  const TOTAL_W = PARTIDOS.length * (CARD_W + GAP)

  useEffect(() => {
    const animate = () => {
      posRef.current += STEP
      if (posRef.current >= TOTAL_W) posRef.current -= TOTAL_W
      if (trackRef.current) trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{ width: '100%', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)' }}>
      <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', zIndex: 2, background: 'linear-gradient(to right, #062d6b, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', zIndex: 2, background: 'linear-gradient(to left, #062d6b, transparent)', pointerEvents: 'none' }} />
        <div ref={trackRef} style={{ display: 'flex', gap: `${GAP}px`, willChange: 'transform', width: 'max-content', padding: '0 20px' }}>
          {DUPLICADOS_PARTIDOS.map((p, i) => (
            <div key={i} style={{ width: `${CARD_W}px`, flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={p.escudo} alt={p.rival} style={{ width: '30px', height: '30px', objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '12px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.rival}</div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>{p.fecha} · {p.sede === 'local' ? 'Local' : p.sede === 'visitante' ? 'Visit.' : 'Neutral'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Card individual del carrusel de mercado
function MercadoCard({ mov }) {
  const tipo = TIPO_CONFIG[mov.tipo] || TIPO_CONFIG.alta
  const esEntrada = tipo.esEntrada
  const clubExterno = esEntrada ? mov.club_origen : mov.club_destino

  // Colores: entradas = azul+verde, salidas = azul+rojo
  const colorPrimario = esEntrada ? '#0B4390' : '#0B4390'
  const colorSecundario = esEntrada ? '#1a6b3a' : '#8b1a1a'
  const colorBarra = esEntrada ? '#27ae60' : '#e74c3c'
  const colorLabel = esEntrada ? '#4ade80' : '#f87171'

  const escudoSrc = useEscudo(clubExterno)

  return (
    <div style={{
      width: '160px',
      flexShrink: 0,
      borderRadius: '12px',
      overflow: 'hidden',
      background: `linear-gradient(160deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
      border: `1px solid ${colorBarra}44`,
      position: 'relative',
    }}>
      {/* Foto jugador */}
      <div style={{ height: '170px', position: 'relative', overflow: 'hidden' }}>
        <img
          src={mov.foto_url || DEFAULT_PHOTO}
          alt={mov.nombre}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }}
          onError={e => { e.target.src = DEFAULT_PHOTO }}
        />
        {/* Escudo club externo */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          width: '32px', height: '32px',
          background: 'white', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}>
          {escudoSrc ? (
            <img src={escudoSrc} alt={clubExterno} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#333' }}>{clubExterno?.[0] || '?'}</span>
          )}
        </div>
        {/* Gradiente inferior */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: `linear-gradient(to top, ${colorPrimario}, transparent)` }} />
      </div>

      {/* Barra de color */}
      <div style={{ height: '3px', background: colorBarra }} />

      {/* Info */}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '900', fontSize: '13px', color: 'white', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '5px' }}>
          {mov.nombre}
        </div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: '700', color: colorLabel, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
          {tipo.label}
        </div>
        {clubExterno && (
          <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
            {clubExterno}
          </div>
        )}
      </div>
    </div>
  )
}

function CarruselMercado({ movimientos }) {
  const trackRef = useRef(null)
  const posRef = useRef(0)
  const rafRef = useRef(null)
  const pausadoRef = useRef(false)
  const CARD_W = 160
  const GAP = 12
  const STEP = 0.6
  const TOTAL_W = movimientos.length * (CARD_W + GAP)

  useEffect(() => {
    if (movimientos.length === 0) return
    const animate = () => {
      if (!pausadoRef.current) {
        posRef.current += STEP
        if (posRef.current >= TOTAL_W) posRef.current -= TOTAL_W
        if (trackRef.current) trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [movimientos, TOTAL_W])

  if (movimientos.length === 0) return null

  const DUPLICADOS = [...movimientos, ...movimientos, ...movimientos]

  return (
    <div
      style={{ background: '#0d0d0d', padding: '36px 0', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}
      onMouseEnter={() => { pausadoRef.current = true }}
      onMouseLeave={() => { pausadoRef.current = false }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>
          Temporada 26/27
        </p>
        <h3 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: '700', textTransform: 'uppercase', color: 'white', margin: 0, lineHeight: 1 }}>
          Mercado de fichajes
        </h3>
      </div>
      <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '120px', zIndex: 2, background: 'linear-gradient(to right, #0d0d0d, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '120px', zIndex: 2, background: 'linear-gradient(to left, #0d0d0d, transparent)', pointerEvents: 'none' }} />
        <div ref={trackRef} style={{ display: 'flex', gap: `${GAP}px`, willChange: 'transform', width: 'max-content', padding: '4px 24px 8px' }}>
          {DUPLICADOS.map((mov, i) => (
            <MercadoCard key={i} mov={mov} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProximoPartidoCard() {
  const { partido, loading } = useProximoPartido()
  const enVivo = usePartidoEnVivo()
  const p = enVivo || partido

  if (loading) return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '130px' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'Archivo, sans-serif' }}>Cargando...</span>
    </div>
  )
  if (!p) return null

  const esEnVivo = !!enVivo
  const home = p.homeTeam
  const away = p.awayTeam
  const fecha = new Date(p.startTimestamp * 1000)
  const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Archivo, sans-serif' }}>
          {esEnVivo ? '🔴 En directo' : 'Próximo partido'}
        </span>
        {!esEnVivo && p.startTimestamp && (
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffc800', fontFamily: 'Archivo, sans-serif' }}>
            <Countdown timestamp={p.startTimestamp} />
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1 }}>
          <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${home.id}_large.png`} alt={home.name} style={{ width: '34px', height: '34px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
          <span style={{ color: 'white', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '600', textAlign: 'center', lineHeight: 1.2 }}>{home.shortName || home.name}</span>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {esEnVivo ? (
            <div>
              <div style={{ color: 'white', fontFamily: 'Humane, sans-serif', fontSize: '30px', fontWeight: '700', lineHeight: 1 }}>{p.homeScore?.current ?? 0} - {p.awayScore?.current ?? 0}</div>
              <div style={{ color: '#ffc800', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: '700', marginTop: '3px' }}>{p.time?.played || ''}′</div>
            </div>
          ) : (
            <div>
              <div style={{ color: 'white', fontFamily: 'Archivo, sans-serif', fontSize: '14px', fontWeight: '700' }}>VS</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Archivo, sans-serif', fontSize: '10px', marginTop: '3px' }}>{fechaStr} · {horaStr}</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1 }}>
          <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${away.id}_large.png`} alt={away.name} style={{ width: '34px', height: '34px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
          <span style={{ color: 'white', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '600', textAlign: 'center', lineHeight: 1.2 }}>{away.shortName || away.name}</span>
        </div>
      </div>
      {p.tournament && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Archivo, sans-serif', fontSize: '10px' }}>{p.tournament.name}</span>
        </div>
      )}
      <button style={{ marginTop: '10px', width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white', padding: '7px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Archivo, sans-serif' }}>
        Ver previa
      </button>
    </div>
  )
}

export default function Home2() {
  const navigate = useNavigate()
  const live = useLiveStream()
  const [movimientos, setMovimientos] = useState([])

  useEffect(() => {
    async function fetchMercado() {
      const { data: movData } = await supabase.from('mercado').select('*').order('fecha', { ascending: false })
      if (!movData) return
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
    }
    fetchMercado()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Archivo, sans-serif', color: 'white' }}>
      <Helmet>
        <title>RZ Hub | Todo sobre el Real Zaragoza</title>
        <meta name="description" content="La plataforma fan del Real Zaragoza. Crea tu alineación, sigue el mercado, el calendario y mucho más." />
        <meta property="og:title" content="RZ Hub | La web del Real Zaragoza" />
        <meta property="og:description" content="La plataforma fan del Real Zaragoza. Crea tu alineación, sigue el mercado, el calendario y mucho más." />
        <meta property="og:url" content="https://rzhub.es" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rzhub.es" />
      </Helmet>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg, #062d6b 0%, #0B4390 50%, #083070 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(255,200,0,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <CarruselPartidos />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 24px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>

          {/* Columna izquierda */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>La web del zaragocista</p>
            <h1 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(64px, 9vw, 110px)', fontWeight: '700', lineHeight: 0.88, textTransform: 'uppercase', margin: '0 0 20px', letterSpacing: '1px' }}>
              Vive el Real<br />Zaragoza<br /><span style={{ color: '#ffc800' }}>como nunca</span><br />antes
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: '0 0 24px', maxWidth: '400px' }}>
              Todas las herramientas, datos y comunidad que necesitas para seguir al Real Zaragoza allá donde vayas.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '32px' }}>
              {['Alineaciones y análisis en tiempo real', 'Mercado y rumores siempre actualizados', 'Calendario, desplazamientos y entradas', 'Compite en la porra y gana premios', 'Únete a la mayor comunidad zaragocista'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ffc800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0B4390" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/lineup')}
                style={{ background: '#ffc800', color: '#0B4390', border: 'none', borderRadius: '8px', padding: '13px 26px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Crea tu cuenta gratis →
              </button>
              <button onClick={() => navigate('/mercado')}
                style={{ background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '13px 22px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
              >
                ▶ Ver cómo funciona
              </button>
            </div>
          </div>

          {/* Columna derecha — dashboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <ProximoPartidoCard />
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Archivo, sans-serif' }}>Lineup rápido</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Archivo, sans-serif' }}>4-3-3 ↺</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/CAMPO_PARA_WEB.svg" alt="Campo" style={{ width: '100%', objectFit: 'contain', borderRadius: '6px' }} onError={e => { e.target.src = '/CAMPO_PARA_WEB.png' }} />
                </div>
                <button onClick={() => navigate('/lineup')} style={{ marginTop: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white', padding: '7px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Archivo, sans-serif' }}>
                  Crear mi alineación →
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div onClick={() => navigate('/mercado')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Archivo, sans-serif', display: 'block', marginBottom: '10px' }}>Mercado</span>
                {[{ nombre: 'Iván Azón', val: '+12%', color: '#27ae60' }, { nombre: 'Francho', val: '-3%', color: '#e74c3c' }, { nombre: 'M. Mesa', val: '+8%', color: '#27ae60' }].map(j => (
                  <div key={j.nombre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontFamily: 'Archivo, sans-serif' }}>{j.nombre}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: j.color, fontFamily: 'Archivo, sans-serif' }}>{j.val}</span>
                  </div>
                ))}
                <span style={{ fontSize: '10px', color: '#ffc800', fontFamily: 'Archivo, sans-serif' }}>Ver mercado →</span>
              </div>
              <div onClick={() => navigate('/calendario')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Archivo, sans-serif', display: 'block', marginBottom: '10px' }}>Calendario</span>
                {PARTIDOS.slice(0, 3).map(p => (
                  <div key={p.rival} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <img src={p.escudo} alt={p.rival} style={{ width: '14px', height: '14px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', fontFamily: 'Archivo, sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.rival}</span>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Archivo, sans-serif', flexShrink: 0 }}>{p.fecha}</span>
                  </div>
                ))}
                <span style={{ fontSize: '10px', color: '#ffc800', fontFamily: 'Archivo, sans-serif' }}>Ver calendario →</span>
              </div>
              <div onClick={() => navigate('/porra')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Archivo, sans-serif', display: 'block', marginBottom: '10px' }}>La Porra</span>
                {[{ user: 'JuanSebas', pts: '142p' }, { user: 'DavidZgz', pts: '138p' }, { user: 'Pilar17', pts: '136p' }].map((u, i) => (
                  <div key={u.user} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: i === 0 ? '#ffc800' : 'rgba(255,255,255,0.3)', fontWeight: '700', fontFamily: 'Archivo, sans-serif', width: '12px' }}>{i + 1}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontFamily: 'Archivo, sans-serif' }}>{u.user}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Archivo, sans-serif', marginLeft: 'auto' }}>{u.pts}</span>
                  </div>
                ))}
                <span style={{ fontSize: '10px', color: '#ffc800', fontFamily: 'Archivo, sans-serif' }}>Ir a la porra →</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARRUSEL MERCADO ── */}
      <CarruselMercado movimientos={movimientos} />

      {/* ── HERRAMIENTAS ── */}
      <div style={{ background: '#0a0a0a', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 12px', textAlign: 'center' }}>Todo en un único lugar</p>
          <h2 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 48px', lineHeight: 1, color: 'white' }}>
            Herramientas diseñadas<br />para cada zaragocista
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '36px' }}>
            {HERRAMIENTAS.map(h => (
              <div key={h.titulo} onClick={() => navigate(h.ruta)}
                style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px 18px', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffc800'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: '26px', marginBottom: '12px' }}>{h.icon}</div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'white' }}>{h.titulo}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: '16px' }}>{h.desc}</div>
                <span style={{ fontSize: '12px', color: '#ffc800', fontWeight: '600' }}>Explorar →</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('/lineup')}
              style={{ background: 'transparent', color: '#ffc800', border: '2px solid #ffc800', borderRadius: '8px', padding: '13px 32px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffc800'; e.currentTarget.style.color = '#0a0a0a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffc800' }}
            >
              Explorar todas las herramientas →
            </button>
          </div>
        </div>
      </div>

      {/* ── COMUNIDAD ── */}
      <div style={{ background: '#0d1f4a', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '0 0 12px' }}>Comunidad</p>
            <h2 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 20px', lineHeight: 0.95, color: 'white' }}>
              Miles de zaragocistas,<br /><span style={{ color: '#ffc800' }}>una misma pasión</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {['Foros y debates en tiempo real', 'Noticias y análisis de expertos', 'Encuestas, rankings y estadísticas', 'Eventos y quedadas zaragocistas'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ffc800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0B4390" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/comunidad')}
              style={{ background: '#ffc800', color: '#0B4390', border: 'none', borderRadius: '8px', padding: '13px 26px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Archivo, sans-serif' }}>
              Únete a la comunidad →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0B4390', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
                <div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '13px', color: 'white' }}>ZaragocistaNº1</div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Hace 2h</div>
                </div>
              </div>
              <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
                Alineación para hoy frente al Eibar ¿Qué os parece?
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '12px', color: 'white', marginBottom: '10px' }}>Encuesta</div>
              <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 10px' }}>¿Quién será el máximo goleador esta temporada?</p>
              {['Iván Azón', 'Mollejo', 'Bermejo'].map((op, i) => (
                <div key={op} style={{ background: i === 0 ? 'rgba(11,67,144,0.6)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? '#0B4390' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '7px 10px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {i === 0 && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffc800', flexShrink: 0 }} />}
                  <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: '12px', color: 'white' }}>{op}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '28px' }}>🏟️</span>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Próximos eventos zaragocistas</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CALENDARIO SYNC ── */}
      <div style={{ background: '#0B4390', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 12px' }}>Sincroniza y no te pierdas nada</p>
            <h2 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 20px', lineHeight: 0.95, color: 'white' }}>
              Tu calendario,<br />siempre contigo
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: '400px' }}>
              Sincroniza todos los partidos con tu calendario favorito, recibe notificaciones personalizadas y mantente al día estés donde estés.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              {[{ icon: '📅', label: 'Añade partidos a tu calendario' }, { icon: '🔔', label: 'Notificaciones personalizadas' }, { icon: '📱', label: 'Disponible en todos tus dispositivos' }, { icon: '✅', label: 'Datos en tiempo real y verificados' }].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{f.icon}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{f.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/calendario')}
              style={{ background: '#ffc800', color: '#0B4390', border: 'none', borderRadius: '8px', padding: '13px 26px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Archivo, sans-serif' }}>
              Sincronizar calendario →
            </button>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '17px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
              <span>Calendario</span><span style={{ fontSize: '18px' }}>＋</span>
            </div>
            {PARTIDOS.slice(0, 4).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{p.fecha.split(' ')[1]}</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'Humane, sans-serif', lineHeight: 1, color: 'white' }}>{p.fecha.split(' ')[0]}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px', fontFamily: 'Archivo, sans-serif', color: 'white' }}>Real Zaragoza vs {p.rival}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif' }}>{p.sede === 'local' ? 'La Romareda' : 'Visitante'}</div>
                </div>
                <img src={p.escudo} alt={p.rival} style={{ width: '26px', height: '26px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div style={{ background: '#050505', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <img src="/escudos/Real_Zaragoza_logo (3).svg" alt="Real Zaragoza" style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '20px' }} />
          <h2 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 12px', lineHeight: 0.95, color: 'white' }}>
            ¿Listo para vivir la temporada<br /><span style={{ color: '#ffc800' }}>como nunca?</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
            Crea tu cuenta gratis y únete a miles de zaragocistas.
          </p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/lineup')}
              style={{ background: '#ffc800', color: '#0a0a0a', border: 'none', borderRadius: '8px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Archivo, sans-serif' }}>
              Regístrate gratis →
            </button>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[{ icon: '🛡️', label: 'Gratis', sub: 'Siempre' }, { icon: '💳', label: 'Sin tarjeta', sub: 'Sin compromisos' }, { icon: '⚡', label: 'En 30 segundos', sub: 'Empieza ya' }].map(b => (
                <div key={b.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', marginBottom: '2px' }}>{b.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'white', fontFamily: 'Archivo, sans-serif' }}>{b.label}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Archivo, sans-serif' }}>{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: '#030303', borderTop: '1px solid #111', padding: '48px 24px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: '40px', marginBottom: '40px' }}>
            <div>
              <img src="/LOGO_RZHUB.png" alt="RZ Hub" style={{ height: '30px', objectFit: 'contain', marginBottom: '12px' }} />
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, maxWidth: '220px' }}>
                La plataforma definitiva para todos los zaragocistas. Herramientas, datos y comunidad en un único lugar.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                {['𝕏', '📷', '▶', '🎮'].map(icon => (
                  <span key={icon} style={{ fontSize: '15px', cursor: 'pointer', opacity: 0.4 }}>{icon}</span>
                ))}
              </div>
            </div>
            {[
              { titulo: 'Herramientas', links: ['Lineup Builder', 'Mercado', 'On Tour', 'Calendario', 'La Porra'] },
              { titulo: 'Comunidad', links: ['Noticias', 'Foros', 'Eventos', 'Ranking', 'Miembros'] },
              { titulo: 'Información', links: ['Sobre RZ Hub', 'Contacto', 'Ayuda', 'Términos', 'Privacidad'] },
            ].map(col => (
              <div key={col.titulo}>
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px', fontFamily: 'Archivo, sans-serif' }}>{col.titulo}</div>
                {col.links.map(link => (
                  <div key={link} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '9px', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                  >{link}</div>
                ))}
              </div>
            ))}
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px', fontFamily: 'Archivo, sans-serif' }}>Únete a la comunidad</div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: '12px' }}>Recibe noticias, novedades y contenido exclusivo del Real Zaragoza.</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input placeholder="Tu email" style={{ flex: 1, background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '6px', padding: '9px 12px', fontSize: '12px', color: 'white', fontFamily: 'Archivo, sans-serif', outline: 'none' }} />
                <button style={{ background: '#ffc800', border: 'none', borderRadius: '6px', padding: '9px 13px', cursor: 'pointer', fontWeight: '700', color: '#0a0a0a', fontSize: '13px' }}>→</button>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #111', paddingTop: '18px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontFamily: 'Archivo, sans-serif' }}>© 2024 RZ Hub. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </div>
  )
}