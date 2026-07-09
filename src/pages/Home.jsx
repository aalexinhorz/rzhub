import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import useLiveStream from '../hooks/useLiveStream'

const TEAM_ID = 2815
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const API_HOST = 'sportapi7.p.rapidapi.com'

const ESCUDOS_CLUBS = {
  'Gimnàstic de Tarragona': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Nàstic': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Antequera CF': '/escudos/spain_antequera.football-logos.cc.svg',
  'Antequera': '/escudos/spain_antequera.football-logos.cc.svg',
  'FC Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'UD Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'CD Teruel': '/escudos/CD_Teruel_logo.svg',
  'Teruel': '/escudos/CD_Teruel_logo.svg',
  'Real Murcia CF': '/escudos/Real_Murcia_CF_logo.svg',
  'Real Murcia': '/escudos/Real_Murcia_CF_logo.svg',
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
  'Real Madrid Castilla': '/escudos/Real_Madrid_CF.svg',
  'Real Madrid B': '/escudos/Real_Madrid_CF.svg',
  'Villarreal B': '/escudos/Villarreal_CF_logo-en.svg',
  'Villarreal CF B': '/escudos/Villarreal_CF_logo-en.svg',
  'SD Huesca': '/escudos/Logo_of_SD_Huesca.svg',
  'Huesca': '/escudos/huesca.png',
  'Athletic Club': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Athletic': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Bilbao Athletic': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Atlético de Madrid': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Atlético Madrid': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Real Madrid': '/escudos/Real_Madrid_CF.svg',
  'FC Barcelona': '/escudos/FC_Barcelona_(crest) (5).svg',
  'Barcelona': '/escudos/FC_Barcelona_(crest) (5).svg',
  'Real Sociedad': '/escudos/Real_Sociedad_logo.svg',
  'Real Sociedad B': '/escudos/Real_Sociedad_logo.svg',
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
  'AD Ceuta': '/escudos/Logo_AD_Ceuta_FC.svg',
  'Ceuta': '/escudos/ad ceuta.png',
  'Valencia CF': '/escudos/Valenciacf (2).svg',
  'Valencia': '/escudos/Valenciacf (2).svg',
  'Villarreal CF': '/escudos/Villarreal CF.png',
  'Venezia': '/escudos/venezia.cc.svg',
  'UD Logroñés': '/escudos/spain_ud-logrones.football-logos.cc.svg',
  'Logroñés': '/escudos/spain_ud-logrones.football-logos.cc.svg',
  'Utebo': '/escudos/spain_utebo.football-logos.cc.svg',
  'CD Numancia': '/escudos/spain_numancia.football-logos.cc.svg',
  'Numancia': '/escudos/spain_numancia.football-logos.cc.svg',
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

function EscudoPartido({ rival, fallback }) {
  const [src, setSrc] = useState(ESCUDOS_CLUBS[rival] || fallback || null)

  useEffect(() => {
    if (ESCUDOS_CLUBS[rival]) { setSrc(ESCUDOS_CLUBS[rival]); return }
    if (tsdbCache[rival] !== undefined) { setSrc(tsdbCache[rival] || fallback); return }
    fetchEscudoFromTSDB(rival).then(url => setSrc(url || fallback))
  }, [rival, fallback])

  if (!src) return <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>{rival[0]}</div>

  return (
    <img src={src} alt={rival} style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
      onError={e => { e.target.style.display = 'none' }} />
  )
}

const PARTIDOS = [
  { rival: 'Utebo', fecha: '29 Jul', sede: 'local', tipo: 'Amistoso', escudo: '/escudos/spain_utebo.football-logos.cc.svg' },
  { rival: 'Barbastro', fecha: '1 Ago', sede: 'visitante', tipo: 'Amistoso', escudo: '/escudos/ud-barbastro-seeklogo.png' },
  { rival: 'FC Andorra', fecha: '6 Ago', sede: 'local', tipo: 'Amistoso', escudo: '/escudos/Logo_FC_Andorra_-_2021 (1).svg' },
  { rival: 'Real Sociedad B', fecha: '8 Ago', sede: 'local', tipo: 'Amistoso', escudo: '/escudos/Real_Sociedad_logo.svg' },
  { rival: 'UD Logroñés', fecha: '14 Ago', sede: 'visitante', tipo: 'Amistoso', escudo: '/escudos/spain_ud-logrones.football-logos.cc.svg' },
  { rival: 'Villarreal B', fecha: '15 Ago', sede: 'visitante', tipo: 'Amistoso', escudo: '/escudos/Villarreal_CF_logo-en.svg' },
  { rival: 'Bilbao Athletic', fecha: '21 Ago', sede: 'local', tipo: 'Amistoso', escudo: '/escudos/Club_Athletic_Bilbao_logo (1).svg' },
  { rival: 'CD Numancia', fecha: '22 Ago', sede: '', tipo: 'Amistoso', escudo: '/escudos/spain_numancia.football-logos.cc.svg' },
]

const DUPLICADOS = [...PARTIDOS, ...PARTIDOS, ...PARTIDOS]

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
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`)
      else if (h > 0) setTimeLeft(`${h}h ${m}m`)
      else setTimeLeft(`${m}m`)
    }
    calcular()
    const interval = setInterval(calcular, 60000)
    return () => clearInterval(interval)
  }, [timestamp])
  return <span>{timeLeft}</span>
}

function PartidoWidget() {
  const { partido: proximo, loading } = useProximoPartido()
  const enVivo = usePartidoEnVivo()
  const partido = enVivo || proximo

  if (loading) return (
    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center', maxWidth: '420px', width: '100%' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif', fontSize: '13px' }}>Cargando partido...</p>
    </div>
  )
  if (!partido) return null

  const esEnVivo = !!enVivo
  const home = partido.homeTeam
  const away = partido.awayTeam
  const fecha = new Date(partido.startTimestamp * 1000)
  const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px 20px', maxWidth: '420px', width: '100%', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {esEnVivo ? '🔴 En directo' : 'Próximo partido'}
        </span>
        {!esEnVivo && partido.startTimestamp && (
          <span style={{ color: '#f5c400', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '700' }}>
            <Countdown timestamp={partido.startTimestamp} />
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${home.id}_large.png`} alt={home.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
          <span style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>{home.shortName || home.name}</span>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {esEnVivo ? (
            <div>
              <div style={{ color: 'white', fontFamily: 'Humane, sans-serif', fontSize: '36px', fontWeight: '700', lineHeight: 1 }}>{partido.homeScore?.current ?? 0} - {partido.awayScore?.current ?? 0}</div>
              <div style={{ color: '#f5c400', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>{partido.time?.played || ''}′</div>
            </div>
          ) : (
            <div>
              <div style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '700' }}>VS</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', fontSize: '11px', marginTop: '4px' }}>{fechaStr} · {horaStr}</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${away.id}_large.png`} alt={away.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
          <span style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>{away.shortName || away.name}</span>
        </div>
      </div>
      {partido.tournament && (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif', fontSize: '11px' }}>{partido.tournament.name}</span>
        </div>
      )}
    </div>
  )
}

function LiveBanner({ live }) {
  if (!live) return null
  return (
    <a href={`https://www.youtube.com/watch?v=${live.id}`} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,0,0,0.12)', border: '1px solid rgba(255,0,0,0.4)', borderRadius: '12px', padding: '12px 18px', maxWidth: '420px', width: '100%', textDecoration: 'none', backdropFilter: 'blur(10px)' }}
    >
      <span style={{ fontSize: '20px', animation: 'pulse-live 2s infinite' }}>🔴</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: '#ff5555', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>RZ Hub en directo</div>
        <div style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{live.titulo}</div>
      </div>
      <style>{`@keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </a>
  )
}

function CarruselPartidos() {
  const trackRef = useRef(null)
  const posRef = useRef(0)
  const rafRef = useRef(null)
  const CARD_W = 200
  const GAP = 10
  const STEP = 0.4
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
    <div style={{ width: '100%', paddingTop: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <p style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '300', fontSize: '12px', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '0 0 10px', paddingLeft: '20px' }}>
        Próximos partidos
      </p>
      <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', zIndex: 2, background: 'linear-gradient(to right, #0B4390, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', zIndex: 2, background: 'linear-gradient(to left, #0B4390, transparent)', pointerEvents: 'none' }} />
        <div ref={trackRef} style={{ display: 'flex', gap: `${GAP}px`, willChange: 'transform', width: 'max-content' }}>
          {DUPLICADOS.map((p, i) => (
            <div key={i} style={{ width: `${CARD_W}px`, flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
              <EscudoPartido rival={p.rival} fallback={p.escudo} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '13px', color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.rival}</div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '300', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{p.fecha}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: p.sede === 'local' ? '#f5c400' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', fontWeight: '300', color: 'rgba(255,255,255,0.35)', fontFamily: 'Archivo, sans-serif' }}>{p.sede === 'local' ? 'Local' : p.sede === 'visitante' ? 'Visitante' : 'Neutral'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const live = useLiveStream()

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#0B4390', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <Helmet>
        <title>RZ Hub | Todo sobre el Real Zaragoza</title>
        <meta name="description" content="La plataforma fan del Real Zaragoza. Crea tu alineación, sigue el mercado, el calendario y mucho más." />
        <meta property="og:title" content="RZ Hub | La web del Real Zaragoza" />
        <meta property="og:description" content="La plataforma fan del Real Zaragoza. Crea tu alineación, sigue el mercado, el calendario y mucho más." />
        <meta property="og:url" content="https://rzhub.es" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rzhub.es" />
      </Helmet>

      <CarruselPartidos />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px 20px', flex: 1 }}>
        <img src="/LOGO_RZHUB.png" alt="RZ Hub - Real Zaragoza" style={{ width: '280px', maxWidth: '85vw' }} />

        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(14px, 4vw, 18px)', textAlign: 'center', maxWidth: '480px', margin: 0, fontFamily: 'sans-serif', lineHeight: '1.5' }}>
          La web para todos los zaragocistas. Crea tu alineación, valora jugadores y mucho más.
        </p>

        <LiveBanner live={live} />

        <PartidoWidget />

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '500px' }}>
          <button onClick={() => navigate('/lineup')} className="home-btn home-btn-primary"
            style={{ background: '#f5c400', color: '#0B4390', border: 'none', borderRadius: '8px', padding: '14px 20px', fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '700', cursor: 'pointer', flex: 1, minWidth: '130px', transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease' }}>
            Crear alineación
          </button>
          <button onClick={() => navigate('/mercado')} className="home-btn home-btn-outline"
            style={{ background: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '14px 20px', fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600', cursor: 'pointer', flex: 1, minWidth: '130px', transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease' }}>
            Mercado
          </button>
          <button onClick={() => navigate('/rumores')} className="home-btn home-btn-outline"
            style={{ background: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '14px 20px', fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600', cursor: 'pointer', flex: 1, minWidth: '130px', transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease' }}>
            Noticias
          </button>
          <button onClick={() => navigate('/on-tour')} className="home-btn home-btn-outline"
            style={{ background: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '14px 20px', fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600', cursor: 'pointer', flex: 1, minWidth: '130px', transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease' }}>
            On Tour
          </button>
          <button onClick={() => navigate('/calendario')} className="home-btn home-btn-outline"
            style={{ background: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '14px 20px', fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: '600', cursor: 'pointer', flex: 1, minWidth: '130px', transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease' }}>
            Calendario
          </button>
        </div>

        <style>{`
          .home-btn-primary:hover { background: #ffd633; transform: scale(1.05); }
          .home-btn-primary:active { transform: scale(1.02); }
          .home-btn-outline:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.7); transform: scale(1.05); }
          .home-btn-outline:active { transform: scale(1.02); }
        `}</style>
      </div>
    </div>
  )
}