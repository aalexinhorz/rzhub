import { useState, useEffect, useRef } from 'react'
import { supabase } from '../hooks/useAuth'
import useAuth from '../hooks/useAuth'

const ESCUDOS = {
  'Gimnàstic de Tarragona': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Antequera CF': '/escudos/spain_antequera.football-logos.cc.svg',
  'Juventud de Torremolinos CF': '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'FC Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'UD Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'CD Teruel': '/escudos/CD_Teruel_logo.svg',
  'Atlético Madrileño': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Real Murcia CF': '/escudos/Real_Murcia_CF_logo.svg',
  'CE Europa': '/escudos/Club_Esportiu_Europa.svg',
  'Villarreal CF B': '/escudos/Villarreal_CF_logo-en.svg',
  'SD Huesca': '/escudos/Logo_of_SD_Huesca.svg',
  'Real Jaén CF': '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'CF Rayo Majadahonda': '/escudos/Rayo_Majadahonda_(logo).svg',
  'AD Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Águilas FC': '/escudos/logo.svg',
  'Real Madrid Castilla': '/escudos/Real_Madrid_CF.svg',
  'Hércules de Alicante CF': '/escudos/Hercules_CF_crest.svg',
  'Algeciras CF': '/escudos/spain_algeciras.football-logos.cc.svg',
  'UE Sant Andreu': '/escudos/ue-sant-andreu-vector-logo.png',
}

const ESCUDO_ZARAGOZA = '/escudos/Real_Zaragoza_logo (3).svg'

function formatMes(fecha) {
  const d = new Date(fecha)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
}

function formatHora(kickoff) {
  const d = new Date(kickoff)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function isCerrada(kickoff) {
  return new Date() >= new Date(kickoff)
}

function getPartidoActivo(partidos) {
  const ahora = new Date()
  const proximos = partidos.filter(p => new Date(p.kickoff) > ahora)
  if (proximos.length > 0) return proximos[0]
  const pasados = [...partidos].reverse()
  return pasados[0] || null
}

export default function Porra() {
  const { user, profile } = useAuth()
  const [partidos, setPartidos] = useState([])
  const [predicciones, setPredicciones] = useState({})
  const [ranking, setRanking] = useState([])
  const [tab, setTab] = useState('clasificacion')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [form, setForm] = useState({ goles_zaragoza: '', goles_rival: '', goleadores: '' })
  const [partidoActivo, setPartidoActivo] = useState(null)
  const carruselRef = useRef(null)

  useEffect(() => {
    fetchPartidos()
    fetchRanking()
  }, [])

  useEffect(() => {
    if (user) fetchPredicciones()
  }, [user])

  useEffect(() => {
    if (partidos.length > 0 && !partidoActivo) {
      const activo = getPartidoActivo(partidos)
      setPartidoActivo(activo)
    }
  }, [partidos])

  useEffect(() => {
    if (partidoActivo && carruselRef.current) {
      const idx = partidos.findIndex(p => p.id === partidoActivo.id)
      const el = carruselRef.current.children[idx]
      if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [partidoActivo, partidos])

  useEffect(() => {
    if (partidoActivo && predicciones[partidoActivo.id]) {
      const pred = predicciones[partidoActivo.id]
      setForm({
        goles_zaragoza: pred.goles_zaragoza,
        goles_rival: pred.goles_rival,
        goleadores: pred.goleadores?.join(', ') || '',
      })
    } else {
      setForm({ goles_zaragoza: '', goles_rival: '', goleadores: '' })
    }
  }, [partidoActivo, predicciones])

  async function fetchPartidos() {
    const { data } = await supabase.from('porra_partidos').select('*').order('kickoff', { ascending: true })
    setPartidos(data || [])
    setLoading(false)
  }

  async function fetchPredicciones() {
    const { data } = await supabase.from('porra_predicciones').select('*').eq('user_id', user.id)
    const map = {}
    data?.forEach(p => { map[p.partido_id] = p })
    setPredicciones(map)
  }

  async function fetchRanking() {
    const { data } = await supabase
      .from('porra_puntos')
      .select('*, profiles:user_id(username, avatar_url)')
      .order('puntos_total', { ascending: false })
      .limit(50)
    setRanking(data || [])
  }

  async function guardarPrediccion() {
    if (!user) return alert('Debes iniciar sesión para participar')
    if (!partidoActivo) return
    if (form.goles_zaragoza === '' || form.goles_rival === '') return alert('Rellena el marcador')
    setGuardando(true)
    const payload = {
      user_id: user.id,
      partido_id: partidoActivo.id,
      goles_zaragoza: parseInt(form.goles_zaragoza),
      goles_rival: parseInt(form.goles_rival),
      goleadores: form.goleadores ? form.goleadores.split(',').map(g => g.trim()).filter(Boolean) : [],
    }
    const existing = predicciones[partidoActivo.id]
    if (existing) {
      await supabase.from('porra_predicciones').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('porra_predicciones').insert(payload)
    }
    await fetchPredicciones()
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  const cerrada = partidoActivo ? isCerrada(partidoActivo.kickoff) : false
  const pred = partidoActivo ? predicciones[partidoActivo.id] : null
  const escudoRival = partidoActivo ? (ESCUDOS[partidoActivo.rival] || null) : null

  const inputStyle = {
    width: '56px', padding: '10px', textAlign: 'center',
    borderRadius: '8px', border: '2px solid #2a2a2a',
    background: '#1a1a1a', color: 'white',
    fontFamily: 'Humane, sans-serif', fontSize: '32px', fontWeight: '700',
    outline: 'none', lineHeight: 1,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'Archivo, sans-serif', paddingBottom: '80px' }}>

      {/* HERO */}
      <div style={{ backgroundColor: '#0B4390', padding: '40px 24px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h1 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(60px, 15vw, 120px)', fontWeight: '700', lineHeight: 0.9, margin: '0 0 8px', letterSpacing: '4px', textTransform: 'uppercase' }}>
          LA PORRA
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontWeight: '300' }}>
          Real Zaragoza · 1ª RFEF 26/27
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[['5 PTS', 'Resultado exacto'], ['3 PTS', 'Todos los goleadores']].map(([pts, label]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'Humane, sans-serif', fontSize: '28px', fontWeight: '700', color: '#f5c400', lineHeight: 1 }}>{pts}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CARRUSEL PARTIDOS */}
      <div style={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '0', overflowX: 'auto' }}>
        <div ref={carruselRef} style={{ display: 'flex', gap: '0', minWidth: 'max-content' }}>
          {partidos.map((p, i) => {
            const activo = partidoActivo?.id === p.id
            const cerradaP = isCerrada(p.kickoff)
            const tienePred = !!predicciones[p.id]
            return (
              <button key={p.id} onClick={() => setPartidoActivo(p)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: '12px 14px', minWidth: '72px', cursor: 'pointer',
                background: activo ? '#0B4390' : 'transparent',
                border: 'none', borderBottom: activo ? '3px solid #f5c400' : '3px solid transparent',
                position: 'relative', transition: 'all 0.15s',
              }}>
                {tienePred && !cerradaP && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#27ae60' }} />
                )}
                {!cerradaP && activo && (
                  <div style={{ position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)', background: '#f5c400', color: '#000', fontSize: '8px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    ACTIVA
                  </div>
                )}
                <div style={{ width: '36px', height: '36px', marginTop: !cerradaP && activo ? '12px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ESCUDOS[p.rival] ? (
                    <img src={ESCUDOS[p.rival]} alt={p.rival} style={{ width: '32px', height: '32px', objectFit: 'contain', opacity: cerradaP && !activo ? 0.4 : 1 }} onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666', fontWeight: '700' }}>
                      {p.rival[0]}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: activo ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', fontWeight: '300', whiteSpace: 'nowrap' }}>
                  {formatMes(p.fecha)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* PANEL IZQUIERDO — Partido activo */}
        <div style={{ flex: '1', minWidth: '280px' }}>
          {loading && <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>}

          {partidoActivo && (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: '#0B4390', padding: '16px 20px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '300', marginBottom: '4px' }}>
                  Jornada {partidoActivo.jornada} · {cerrada ? 'Cerrada' : 'Abierta'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700' }}>
                  {partidoActivo.sede === 'local' ? `Real Zaragoza vs ${partidoActivo.rival}` : `${partidoActivo.rival} vs Real Zaragoza`}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', fontWeight: '300' }}>
                  {new Date(partidoActivo.kickoff).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · {formatHora(partidoActivo.kickoff)}h
                </div>
              </div>

              {/* Escudos y marcador */}
              <div style={{ padding: '24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <img src={partidoActivo.sede === 'local' ? ESCUDO_ZARAGOZA : (escudoRival || '')} alt="" style={{ width: '52px', height: '52px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontWeight: '600' }}>
                      {partidoActivo.sede === 'local' ? 'Zaragoza' : partidoActivo.rival}
                    </span>
                  </div>

                  {/* Marcador predicción o resultado */}
                  {partidoActivo.finalizado ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '52px', fontWeight: '700', lineHeight: 1, color: 'white' }}>
                        {partidoActivo.goles_zaragoza} - {partidoActivo.goles_rival}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>Resultado final</div>
                    </div>
                  ) : cerrada ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '52px', fontWeight: '700', lineHeight: 1, color: 'rgba(255,255,255,0.3)' }}>? - ?</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>En juego</div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '28px', fontWeight: '300', lineHeight: 1, color: 'rgba(255,255,255,0.3)' }}>VS</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <img src={partidoActivo.sede === 'local' ? (escudoRival || '') : ESCUDO_ZARAGOZA} alt="" style={{ width: '52px', height: '52px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontWeight: '600' }}>
                      {partidoActivo.sede === 'local' ? partidoActivo.rival : 'Zaragoza'}
                    </span>
                  </div>
                </div>

                {/* Formulario o predicción */}
                {!user ? (
                  <div style={{ textAlign: 'center', padding: '16px', background: '#1a1a1a', borderRadius: '10px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Inicia sesión para participar</p>
                  </div>
                ) : cerrada ? (
                  pred ? (
                    <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Tu predicción</div>
                      <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '48px', fontWeight: '700', color: 'white', lineHeight: 1 }}>
                        {pred.goles_zaragoza} - {pred.goles_rival}
                      </div>
                      {pred.goleadores?.length > 0 && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>⚽ {pred.goleadores.join(', ')}</div>
                      )}
                      {pred.puntos > 0 && (
                        <div style={{ marginTop: '12px', display: 'inline-block', background: 'rgba(245,196,0,0.15)', border: '1px solid #f5c400', borderRadius: '20px', padding: '4px 16px', fontSize: '14px', color: '#f5c400', fontWeight: '700' }}>
                          +{pred.puntos} puntos
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', background: '#1a1a1a', borderRadius: '10px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 }}>No participaste en este partido</p>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: '300' }}>
                        Tu predicción
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <input type="number" min="0" max="20" value={form.goles_zaragoza}
                          onChange={e => setForm(f => ({ ...f, goles_zaragoza: e.target.value }))}
                          style={inputStyle} placeholder="0" />
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '28px', fontFamily: 'Humane, sans-serif', fontWeight: '700' }}>-</span>
                        <input type="number" min="0" max="20" value={form.goles_rival}
                          onChange={e => setForm(f => ({ ...f, goles_rival: e.target.value }))}
                          style={inputStyle} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '300', display: 'block', marginBottom: '8px' }}>
                        Goleadores (opcional, separados por coma)
                      </label>
                      <input type="text" value={form.goleadores}
                        onChange={e => setForm(f => ({ ...f, goleadores: e.target.value }))}
                        placeholder="Ej: Escobar, Gabilondo"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#1a1a1a', color: 'white', fontFamily: 'Archivo, sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <button onClick={guardarPrediccion} disabled={guardando} style={{
                      width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                      background: guardado ? '#27ae60' : '#0B4390',
                      color: 'white', fontFamily: 'Archivo, sans-serif',
                      fontSize: '15px', fontWeight: '700', cursor: guardando ? 'wait' : 'pointer',
                      transition: 'background 0.3s',
                    }}>
                      {guardado ? '✓ ¡Guardado!' : guardando ? 'Guardando...' : pred ? 'Actualizar predicción' : 'Enviar predicción'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ganador jornada anterior */}
          {ranking.length > 0 && (
            <div style={{ marginTop: '16px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '300', marginBottom: '8px' }}>
                Líder de la temporada
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {ranking[0].profiles?.avatar_url ? (
                  <img src={ranking[0].profiles.avatar_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0B4390', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700' }}>{(ranking[0].profiles?.username || '?')[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '28px', fontWeight: '700', color: '#f5c400', lineHeight: 1 }}>
                    {ranking[0].profiles?.username || 'Usuario'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{ranking[0].puntos_total} puntos</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL DERECHO — Ranking */}
        <div style={{ flex: '1', minWidth: '280px' }}>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Humane, sans-serif', fontSize: '28px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Clasificación
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['clasificacion', 'Ranking'], ['predicciones', 'Mis picks']].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)} style={{
                    padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    background: tab === key ? '#0B4390' : '#1a1a1a',
                    color: tab === key ? 'white' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'Archivo, sans-serif', fontSize: '12px', fontWeight: '600',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'clasificacion' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px', padding: '10px 20px', borderBottom: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>POS</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>USUARIO</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textAlign: 'right' }}>PUNTOS</span>
                </div>
                {ranking.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px', fontSize: '14px' }}>Aún no hay puntuaciones.</p>
                )}
                {ranking.map((entry, i) => (
                  <div key={entry.user_id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px', alignItems: 'center', padding: '12px 20px', borderBottom: i < ranking.length - 1 ? '1px solid #1a1a1a' : 'none', background: user?.id === entry.user_id ? 'rgba(11,67,144,0.15)' : 'transparent' }}>
                    <span style={{ fontFamily: 'Humane, sans-serif', fontSize: '22px', fontWeight: '700', color: i === 0 ? '#f5c400' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                      {i + 1}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {entry.profiles?.avatar_url ? (
                        <img src={entry.profiles.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0B4390', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', fontWeight: '700' }}>{(entry.profiles?.username || '?')[0].toUpperCase()}</span>
                        </div>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: user?.id === entry.user_id ? '700' : '500', color: user?.id === entry.user_id ? '#f5c400' : 'white' }}>
                        {entry.profiles?.username || 'Usuario'}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'Humane, sans-serif', fontSize: '24px', fontWeight: '700', color: '#f5c400', textAlign: 'right' }}>
                      {entry.puntos_total}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'predicciones' && (
              <div>
                {!user ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px', fontSize: '14px' }}>Inicia sesión para ver tus predicciones</p>
                ) : Object.keys(predicciones).length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px', fontSize: '14px' }}>Aún no has hecho ninguna predicción</p>
                ) : (
                  partidos.filter(p => predicciones[p.id]).map((p, i, arr) => {
                    const pred = predicciones[p.id]
                    const cerradaP = isCerrada(p.kickoff)
                    return (
                      <div key={p.id} onClick={() => setPartidoActivo(p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none', cursor: 'pointer', background: partidoActivo?.id === p.id ? 'rgba(11,67,144,0.15)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {ESCUDOS[p.rival] && <img src={ESCUDOS[p.rival]} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />}
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.rival}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '300' }}>J{p.jornada} · {formatMes(p.fecha)}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'Humane, sans-serif', fontSize: '22px', fontWeight: '700', color: cerradaP ? 'rgba(255,255,255,0.4)' : 'white' }}>
                            {pred.goles_zaragoza}-{pred.goles_rival}
                          </span>
                          {pred.puntos > 0 && (
                            <span style={{ fontSize: '11px', background: 'rgba(245,196,0,0.15)', border: '1px solid #f5c400', borderRadius: '10px', padding: '2px 8px', color: '#f5c400', fontWeight: '700' }}>
                              +{pred.puntos}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}