import { useState, useEffect } from 'react'
import { supabase } from '../hooks/useAuth'

const ESCUDO_ZARAGOZA = '/escudos/Real_Zaragoza_logo (3).svg'
const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'

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
  'FC Andorra': '/escudos/fc andorra.png',
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

const TIPO_CONFIG = {
  alta:          { label: 'Alta',          color: '#27ae60', esEntrada: true },
  baja:          { label: 'Baja',          color: '#e74c3c', esEntrada: false },
  cesion_salida: { label: 'Cedido',        color: '#e74c3c', esEntrada: false },
  cesion_vuelta: { label: 'Vuelta cesión', color: '#27ae60', esEntrada: true },
}

function normalizar(str) {
  if (!str) return ''
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

const POSICION_COLORS = {
  POR: { bg: 'rgba(255,152,0,0.15)',  border: '#ff9800', text: '#ff9800' },
  DEF: { bg: 'rgba(33,150,243,0.15)', border: '#2196f3', text: '#2196f3' },
  MED: { bg: 'rgba(76,175,80,0.15)',  border: '#4caf50', text: '#4caf50' },
  DEL: { bg: 'rgba(233,30,99,0.15)',  border: '#e91e63', text: '#e91e63' },
}

function ClubInfo({ club, isZaragoza, label, color }) {
  const nombre = isZaragoza ? 'Real Zaragoza' : (club || 'Libre')
  const esLibre = !isZaragoza && club === 'Libre'

  const [escudoSrc, setEscudoSrc] = useState(
    isZaragoza ? ESCUDO_ZARAGOZA :
    esLibre ? '/escudos/agentelibre.svg' :
    (ESCUDOS_CLUBS[club] || null)
  )
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (isZaragoza || esLibre) return
    if (ESCUDOS_CLUBS[club]) {
      setEscudoSrc(ESCUDOS_CLUBS[club])
      return
    }
    if (!club) return
    if (tsdbCache[club] !== undefined) {
      setEscudoSrc(tsdbCache[club])
      return
    }
    setCargando(true)
    fetchEscudoFromTSDB(club).then(url => {
      setEscudoSrc(url)
      setCargando(false)
    })
  }, [club, isZaragoza, esLibre])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
      <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cargando ? (
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f0f0f0', opacity: 0.6 }} />
        ) : escudoSrc ? (
          <img src={escudoSrc} alt={nombre} style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#999', fontWeight: '700' }}>
            {nombre[0]}
          </div>
        )}
      </div>
      <span style={{ fontSize: '12px', fontWeight: '600', color: color || '#333', fontFamily: 'Archivo, sans-serif', textAlign: 'center', lineHeight: 1.2 }}>
        {nombre}
      </span>
      <span style={{ fontSize: '10px', color: '#bbb', fontFamily: 'Archivo, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
  )
}

function MovimientoRow({ mov, isMobile }) {
  const tipo = TIPO_CONFIG[mov.tipo] || TIPO_CONFIG.alta
  const esEntrada = tipo.esEntrada
  const colors = POSICION_COLORS[mov.posicion] || { bg: 'rgba(255,255,255,0.05)', border: '#444', text: '#aaa' }

  const clubOrigen = esEntrada ? mov.club_origen : null
  const clubDestino = esEntrada ? null : mov.club_destino
  const origenEsZaragoza = !esEntrada
  const destinoEsZaragoza = esEntrada

  if (isMobile) {
    return (
      <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', border: '2px solid #e0e0e0' }}>
            <img src={mov.foto_url || DEFAULT_PHOTO} alt={mov.nombre} crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%', display: 'block' }}
              onError={e => { e.target.src = DEFAULT_PHOTO }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '17px', color: '#111', marginBottom: '5px' }}>
              {mov.nombre}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', fontFamily: 'Archivo, sans-serif', textTransform: 'uppercase', background: tipo.color, color: 'white' }}>
                {tipo.label}
              </span>
              {mov.posicion && (
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', fontFamily: 'Archivo, sans-serif', background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {mov.posicion}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <ClubInfo club={origenEsZaragoza ? 'Real Zaragoza' : clubOrigen} isZaragoza={origenEsZaragoza} label="Origen" color={origenEsZaragoza ? '#0B4390' : '#333'} />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tipo.color} strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
          <ClubInfo club={destinoEsZaragoza ? 'Real Zaragoza' : clubDestino} isZaragoza={destinoEsZaragoza} label="Destino" color={destinoEsZaragoza ? '#0B4390' : '#333'} />
        </div>
        {mov.fecha && (
          <div style={{ textAlign: 'right', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: '#bbb', fontFamily: 'Archivo, sans-serif' }}>
              {new Date(mov.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', background: 'white', borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#fafafa' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
    >
      <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', border: '2px solid #e0e0e0' }}>
        <img src={mov.foto_url || DEFAULT_PHOTO} alt={mov.nombre} crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%', display: 'block' }}
          onError={e => { e.target.src = DEFAULT_PHOTO }} />
      </div>
      <div style={{ minWidth: '180px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '16px', color: '#111', marginBottom: '5px' }}>
          {mov.nombre}
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', fontFamily: 'Archivo, sans-serif', textTransform: 'uppercase', background: tipo.color, color: 'white' }}>
            {tipo.label}
          </span>
          {mov.posicion && (
            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', fontFamily: 'Archivo, sans-serif', background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
              {mov.posicion}
            </span>
          )}
        </div>
      </div>
      <ClubInfo club={origenEsZaragoza ? 'Real Zaragoza' : clubOrigen} isZaragoza={origenEsZaragoza} label="Origen" color={origenEsZaragoza ? '#0B4390' : '#333'} />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={tipo.color} strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
      <ClubInfo club={destinoEsZaragoza ? 'Real Zaragoza' : clubDestino} isZaragoza={destinoEsZaragoza} label="Destino" color={destinoEsZaragoza ? '#0B4390' : '#333'} />
      <div style={{ marginLeft: 'auto', flexShrink: 0, textAlign: 'right' }}>
        {mov.fecha && (
          <span style={{ fontSize: '13px', color: '#bbb', fontFamily: 'Archivo, sans-serif', whiteSpace: 'nowrap' }}>
            {new Date(mov.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function Mercado() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const isMobile = useIsMobile()

  useEffect(() => { fetchMovimientos() }, [])

  async function fetchMovimientos() {
    const { data: movData } = await supabase.from('mercado').select('*').order('fecha', { ascending: false })
    if (!movData) { setLoading(false); return }

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
    setLoading(false)
  }

  const altas = movimientos.filter(m => m.tipo === 'alta' || m.tipo === 'cesion_vuelta')
  const bajas = movimientos.filter(m => m.tipo === 'baja' || m.tipo === 'cesion_salida')
  const filtrados = filtro === 'altas' ? altas : filtro === 'bajas' ? bajas : movimientos

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', color: '#111', fontFamily: 'Archivo, sans-serif', paddingBottom: '80px' }}>
      <div style={{ backgroundColor: '#0B4390', padding: '60px 24px 50px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '300', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>
          Real Zaragoza · Temporada 26/27
        </p>
        <h1 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(64px, 16vw, 130px)', fontWeight: '700', lineHeight: 0.9, margin: '0 0 24px', letterSpacing: '6px', textTransform: 'uppercase', color: 'white' }}>
          MERCADO
        </h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.4)', borderRadius: '10px', padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '40px', fontWeight: '700', color: '#27ae60', lineHeight: 1 }}>{altas.length}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Altas</div>
          </div>
          <div style={{ background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: '10px', padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '40px', fontWeight: '700', color: '#e74c3c', lineHeight: 1 }}>{bajas.length}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Bajas</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {[['todos', 'Todos'], ['altas', 'Entradas'], ['bajas', 'Salidas']].map(([key, label]) => (
          <button key={key} onClick={() => setFiltro(key)} style={{
            flex: 1, padding: '14px', background: 'none', border: 'none',
            borderBottom: filtro === key ? '2px solid #0B4390' : '2px solid transparent',
            color: filtro === key ? '#0B4390' : '#999',
            fontFamily: 'Archivo, sans-serif', fontSize: '14px',
            fontWeight: filtro === key ? '700' : '400', cursor: 'pointer',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '24px auto 0', padding: '0 16px' }}>
        {loading && <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>Cargando...</p>}
        {!loading && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ccc' }}>
            <p style={{ fontSize: '14px', fontWeight: '300' }}>No hay movimientos todavía</p>
          </div>
        )}
        {!loading && filtrados.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
            {filtrados.map(mov => <MovimientoRow key={mov.id} mov={mov} isMobile={isMobile} />)}
          </div>
        )}
      </div>
    </div>
  )
}