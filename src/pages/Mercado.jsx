import { useState, useEffect } from 'react'
import { supabase } from '../hooks/useAuth'

const ESCUDO_ZARAGOZA = '/escudos/Real_Zaragoza_logo (3).svg'
const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'

const ESCUDOS_CLUBS = {
  'FC Andorra': '/escudos/fc andorra.png',
  'Andorra': '/escudos/fc andorra.png',
  'Athletic Club': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Athletic': '/escudos/Club_Athletic_Bilbao_logo (1).svg',
  'Real Sociedad': '/escudos/Real Sociedad.png',
  'AD Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Atlético Madrileño': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Villarreal B': '/escudos/Villarreal_CF_logo-en.svg',
  'Villarreal CF B': '/escudos/Villarreal_CF_logo-en.svg',
  'SD Huesca': '/escudos/Logo_of_SD_Huesca.svg',
  'Huesca': '/escudos/Logo_of_SD_Huesca.svg',
  'Real Murcia CF': '/escudos/Real_Murcia_CF_logo.svg',
  'Real Murcia': '/escudos/Real_Murcia_CF_logo.svg',
  'CE Europa': '/escudos/Club_Esportiu_Europa.svg',
  'Hércules de Alicante CF': '/escudos/Hercules_CF_crest.svg',
  'Hércules': '/escudos/Hercules_CF_crest.svg',
  'Algeciras CF': '/escudos/spain_algeciras.football-logos.cc.svg',
  'Algeciras': '/escudos/spain_algeciras.football-logos.cc.svg',
  'UE Sant Andreu': '/escudos/ue-sant-andreu-vector-logo.png',
  'Gimnàstic de Tarragona': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Nàstic': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'FC Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'UD Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'CD Teruel': '/escudos/CD_Teruel_logo.svg',
  'Teruel': '/escudos/CD_Teruel_logo.svg',
  'CF Rayo Majadahonda': '/escudos/Rayo_Majadahonda_(logo).svg',
  'Rayo Majadahonda': '/escudos/Rayo_Majadahonda_(logo).svg',
  'Real Jaén CF': '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'Real Jaén': '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'Juventud de Torremolinos CF': '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'Torremolinos': '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'Antequera CF': '/escudos/spain_antequera.football-logos.cc.svg',
  'Antequera': '/escudos/spain_antequera.football-logos.cc.svg',
  'Águilas FC': '/escudos/logo.svg',
  'Real Madrid Castilla': '/escudos/Real_Madrid_CF.svg',
  'Real Madrid B': '/escudos/Real_Madrid_CF.svg',
  'Albacete': '/escudos/albacete.png',
  'Almería': '/escudos/almeria.png',
  'Burgos': '/escudos/burgos.png',
  'Cádiz': '/escudos/cadiz.png',
  'CD Castellón': '/escudos/CD Castellon.png',
  'Córdoba CF': '/escudos/Cordoba CF.png',
  'Cultural Leonesa': '/escudos/Cultural leonesa.png',
  'Depor': '/escudos/Depor.png',
  'Deportivo': '/escudos/Depor.png',
  'Eibar': '/escudos/eibar.png',
  'Granada': '/escudos/granada.png',
  'Las Palmas': '/escudos/las palmas.png',
  'Leganés': '/escudos/leganes.png',
  'Málaga CF': '/escudos/Malaga CF.png',
  'Mirandés': '/escudos/mirandes.png',
  'Racing': '/escudos/racing.png',
  'Sporting': '/escudos/sporting.png',
  'Valladolid': '/escudos/valladolid.png',
  'Ad Ceuta': '/escudos/ad ceuta.png',
  'Ceuta': '/escudos/ad ceuta.png',
}

function normalizar(str) {
  if (!str) return ''
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function getEscudo(club) {
  if (!club) return null
  return ESCUDOS_CLUBS[club] || null
}

function ClubInfo({ club, label, isZaragoza, color }) {
  const escudo = isZaragoza ? ESCUDO_ZARAGOZA : getEscudo(club)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {escudo ? (
          <img src={escudo} alt={isZaragoza ? 'Real Zaragoza' : club} style={{ width: '36px', height: '36px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#999', fontWeight: '700' }}>
            {(club || 'L')[0]}
          </div>
        )}
      </div>
      <span style={{ fontSize: '11px', color: '#999', fontFamily: 'Archivo, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: color || '#333', fontFamily: 'Archivo, sans-serif', textAlign: 'center' }}>
        {isZaragoza ? 'Real Zaragoza' : (club || 'Libre')}
      </span>
    </div>
  )
}

const POSICION_COLORS = {
  POR: { bg: 'rgba(255,152,0,0.15)', border: '#ff9800', text: '#ff9800' },
  DEF: { bg: 'rgba(33,150,243,0.15)', border: '#2196f3', text: '#2196f3' },
  MED: { bg: 'rgba(76,175,80,0.15)', border: '#4caf50', text: '#4caf50' },
  DEL: { bg: 'rgba(233,30,99,0.15)', border: '#e91e63', text: '#e91e63' },
}

function MovimientoRow({ mov }) {
  const esAlta = mov.tipo === 'alta'
  const colors = POSICION_COLORS[mov.posicion] || { bg: 'rgba(255,255,255,0.05)', border: '#444', text: '#aaa' }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '16px 20px', background: 'white',
      borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#fafafa' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
    >
      <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', border: '2px solid #e0e0e0' }}>
        <img
          src={mov.foto_url || DEFAULT_PHOTO}
          alt={mov.nombre}
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%', display: 'block' }}
          onError={e => { e.target.src = DEFAULT_PHOTO }}
        />
      </div>

      <div style={{ minWidth: '160px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '16px', color: '#111', marginBottom: '4px' }}>
          {mov.nombre}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
            fontFamily: 'Archivo, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase',
            background: esAlta ? '#27ae60' : '#e74c3c', color: 'white',
          }}>
            {esAlta ? 'Fichaje' : 'Salida'}
          </span>
          {mov.posicion && (
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
              fontFamily: 'Archivo, sans-serif', letterSpacing: '0.5px',
              background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
            }}>
              {mov.posicion}
            </span>
          )}
        </div>
      </div>

      <ClubInfo
        club={esAlta ? mov.club_origen : 'Real Zaragoza'}
        label="Origen"
        isZaragoza={!esAlta}
        color={!esAlta ? '#0B4390' : '#333'}
      />

      <div style={{ flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={esAlta ? '#27ae60' : '#e74c3c'} strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>

      <ClubInfo
        club={esAlta ? 'Real Zaragoza' : mov.club_destino}
        label="Destino"
        isZaragoza={esAlta}
        color={esAlta ? '#0B4390' : '#333'}
      />

      <div style={{ minWidth: '80px', textAlign: 'right', flexShrink: 0 }}>
        {mov.fecha && (
          <span style={{ fontSize: '13px', color: '#999', fontFamily: 'Archivo, sans-serif', fontWeight: '300' }}>
            {new Date(mov.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Mercado() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => { fetchMovimientos() }, [])

  async function fetchMovimientos() {
    const { data: movData } = await supabase
      .from('mercado')
      .select('*')
      .order('fecha', { ascending: false })

    if (!movData) { setLoading(false); return }

    const sinFoto = movData.filter(m => !m.foto_url)
    if (sinFoto.length > 0) {
      const { data: players } = await supabase
        .from('players')
        .select('name, photo')

      if (players) {
        movData.forEach(mov => {
          if (!mov.foto_url) {
            const player = players.find(p =>
              normalizar(p.name) === normalizar(mov.nombre)
            )
            if (player) mov.foto_url = player.photo
          }
        })
      }
    }

    setMovimientos(movData)
    setLoading(false)
  }

  const altas = movimientos.filter(m => m.tipo === 'alta')
  const bajas = movimientos.filter(m => m.tipo === 'baja')
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
        {[['todos', 'Todos'], ['altas', 'Fichajes'], ['bajas', 'Salidas']].map(([key, label]) => (
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
            {filtrados.map(mov => <MovimientoRow key={mov.id} mov={mov} />)}
          </div>
        )}
      </div>
    </div>
  )
}