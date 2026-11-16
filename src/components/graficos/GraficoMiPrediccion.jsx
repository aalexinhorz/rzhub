import { useEffect, useMemo, useRef, useState } from 'react'
import useAuth, { supabase } from '../../hooks/useAuth'
import { cargarImagen, contextoGrafico, ESCALA, slug, urlParaCanvas } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoMiPrediccion } from '../../lib/graficoMiPrediccion'
import { useImagenesPartido } from '../../lib/graficosPartidos'
import { leerLocal, useGuardarLocal } from '../../lib/graficosHooks'
import { colorEquipo, oscurecer } from '../../lib/colorEscudo'
import { ESTADIO_ZARAGOZA, horaMadrid, limpiarEstadio, nombresPartido } from '../../lib/partidoSeo'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "Mi predicción": tu pronóstico de la Porra con tu usuario de la
// web (foto, @usuario, puesto y puntos). Sale solo de lo que pronosticaste
// en la Porra; si aún no lo has hecho, se rellena a mano.
const INICIAL = { partidoId: '', titulo: 'Mi predicción', golesZaragoza: '', golesRival: '', goleadores: '', colorRival: '', cta: '¿Y tú? Haz tu pronóstico en rzhub.es/porra' }

const corto = n => {
  const p = (n || '').trim().split(/\s+/)
  return p.length > 1 ? p[p.length - 1] : p[0] || ''
}

export default function GraficoMiPrediccion({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const { user, profile } = useAuth()
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_mi_prediccion', INICIAL))
  useGuardarLocal('redaccion_grafico_mi_prediccion', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const [carga, setCarga] = useState({ partidos: [], mias: {}, ranking: [], estadios: {} })

  useEffect(() => {
    if (!user) return
    let activo = true
    const desde = new Date(Date.now() - 45 * 86400_000).toISOString()
    Promise.all([
      supabase.from('porra_partidos').select('id, rival, sede, jornada, competicion, kickoff, abierto, finalizado')
        .gte('kickoff', desde).order('kickoff').limit(20),
      supabase.from('porra_predicciones').select('partido_id, goles_zaragoza, goles_rival, goleadores').eq('user_id', user.id),
      supabase.from('porra_puntos').select('user_id, puntos_total').order('puntos_total', { ascending: false }),
      supabase.from('rivales').select('nombre, estadio'),
    ]).then(([p, m, r, e]) => {
      if (!activo) return
      setCarga({
        partidos: p.data || [],
        mias: Object.fromEntries((m.data || []).map(x => [x.partido_id, x])),
        ranking: r.data || [],
        estadios: Object.fromEntries((e.data || []).map(x => [x.nombre, x.estadio])),
      })
    })
    return () => { activo = false }
  }, [user])

  const { partidos, mias, ranking, estadios } = carga
  // Por defecto, la porra abierta (o el próximo partido).
  const partido = partidos.find(p => String(p.id) === datos.partidoId)
    || partidos.find(p => p.abierto && !p.finalizado) || partidos.find(p => !p.finalizado) || partidos.at(-1) || null
  const mia = partido ? mias[partido.id] : null
  const { local, visitante, zaragozaLocal } = partido ? nombresPartido(partido) : { local: '', visitante: '', zaragozaLocal: true }
  const competicion = partido?.competicion ? partido.competicion.split(' · ')[0] : 'Primera Federación'
  const imgs = useImagenesPartido(local, visitante, competicion)

  const golesZ = datos.golesZaragoza !== '' ? datos.golesZaragoza : mia?.goles_zaragoza ?? ''
  const golesR = datos.golesRival !== '' ? datos.golesRival : mia?.goles_rival ?? ''
  const nombresGoleadores = useMemo(() => (datos.goleadores.trim()
    ? datos.goleadores.split(',').map(s => s.trim()).filter(Boolean)
    : mia?.goleadores || []), [datos.goleadores, mia])

  // Fotos de los goleadores (plantilla de la web).
  const [goleadores, setGoleadores] = useState({ clave: '', lista: [] })
  const claveGoleadores = nombresGoleadores.join('|')
  useEffect(() => {
    let activo = true
    const nombres = claveGoleadores ? claveGoleadores.split('|') : []
    if (!nombres.length) { Promise.resolve().then(() => { if (activo) setGoleadores({ clave: '', lista: [] }) }); return () => { activo = false } }
    supabase.from('players').select('name, short_name, photo').in('name', nombres).then(async ({ data }) => {
      const lista = await Promise.all(nombres.map(async n => {
        const j = (data || []).find(x => x.name === n)
        return { corto: j?.short_name || corto(n), foto: j?.photo ? await cargarImagen(urlParaCanvas(j.photo), { cors: true }) : null }
      }))
      if (activo) setGoleadores({ clave: claveGoleadores, lista })
    })
    return () => { activo = false }
  }, [claveGoleadores])

  // Foto de perfil (si su web no deja leerla, sale la inicial).
  const [avatar, setAvatar] = useState(null)
  useEffect(() => {
    let activo = true
    if (profile?.avatar_url) cargarImagen(urlParaCanvas(profile.avatar_url), { cors: true }).then(img => { if (activo) setAvatar(img) })
    return () => { activo = false }
  }, [profile?.avatar_url])

  const escudoRival = zaragozaLocal ? imgs.escudoVisitante : imgs.escudoLocal
  const colorAuto = useMemo(() => (escudoRival ? colorEquipo(escudoRival) : null), [escudoRival])
  const colorRival = datos.colorRival || colorAuto

  const puesto = user ? ranking.findIndex(r => r.user_id === user.id) + 1 : 0
  const puntos = ranking.find(r => r.user_id === user?.id)?.puntos_total
  const estadio = partido ? (zaragozaLocal ? ESTADIO_ZARAGOZA : limpiarEstadio(estadios[partido.rival])) : ''
  const ronda = partido ? (partido.competicion ? partido.competicion.split(' · ').slice(1).join(' · ') : `Jornada ${partido.jornada}`) : ''
  const hora = partido?.kickoff ? horaMadrid(partido.kickoff) : ''

  const recursos = useMemo(() => ({ logo, avatar, ...imgs, goleadores: goleadores.clave === claveGoleadores ? goleadores.lista : [] }),
    [logo, avatar, imgs, goleadores, claveGoleadores])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    dibujarGraficoMiPrediccion(contextoGrafico(c), {
      ...datos,
      usuario: { nombre: profile?.name, username: profile?.username, puesto: puesto || null, puntos },
      lineas: partido ? [`${local} - ${visitante}`, estadio, [ronda, hora && `${hora}H`].filter(Boolean).join(' - ')] : [],
      golesLocal: zaragozaLocal ? golesZ : golesR,
      golesVisitante: zaragozaLocal ? golesR : golesZ,
      zaragozaLocal,
      colorRival: colorRival || undefined,
      colorRivalOscuro: colorRival ? oscurecer(colorRival, 0.45) : undefined,
    }, recursos)
  }) // tras cada render: dibujar es barato

  if (!user) return <p className="graficos-nota">Inicia sesión para sacar tu predicción.</p>

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas graficos-canvas--fijo" />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-mi-prediccion-${slug(`${local} ${visitante}`)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partido</legend>
          <label className="graficos-campo">
            Partido
            <select value={partido ? String(partido.id) : ''} onChange={e => cambiar({ partidoId: e.target.value, golesZaragoza: '', golesRival: '', goleadores: '', colorRival: '' })}>
              {partidos.map(p => {
                const n = nombresPartido(p)
                return <option key={p.id} value={p.id}>{n.local} - {n.visitante} ({p.competicion ? 'Copa' : `J${p.jornada}`}){mias[p.id] ? ' ✓ pronosticado' : ''}</option>
              })}
            </select>
          </label>
          <p className="graficos-nota">
            {mia ? 'Sale tu pronóstico de la Porra. Puedes cambiarlo abajo si quieres.' : 'Aún no has hecho la porra de este partido: rellena tu pronóstico abajo.'}
          </p>
        </fieldset>
        <fieldset>
          <legend>Pronóstico</legend>
          <div className="graficos-fila">
            <label className="graficos-campo">Goles Real Zaragoza<input value={datos.golesZaragoza} placeholder={mia ? String(mia.goles_zaragoza) : '2'} onChange={e => cambiar({ golesZaragoza: e.target.value })} /></label>
            <label className="graficos-campo">Goles rival<input value={datos.golesRival} placeholder={mia ? String(mia.goles_rival) : '0'} onChange={e => cambiar({ golesRival: e.target.value })} /></label>
          </div>
          <label className="graficos-campo">
            Goleadores (separados por comas)
            <input value={datos.goleadores} placeholder={(mia?.goleadores || []).join(', ') || 'Jaume Jardí, Joaquín Delgado'} onChange={e => cambiar({ goleadores: e.target.value })} />
          </label>
          <div className="graficos-fila graficos-fila--equipo">
            <label className="graficos-campo graficos-campo--color">
              Color rival
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(colorRival || '') ? colorRival : '#ffffff'} onChange={e => cambiar({ colorRival: e.target.value })} />
            </label>
            {datos.colorRival && <button type="button" className="graficos-mini-boton" onClick={() => cambiar({ colorRival: '' })}>Color automático</button>}
          </div>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">Título<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} /></label>
          <label className="graficos-campo">Botón de abajo<input value={datos.cta} onChange={e => cambiar({ cta: e.target.value })} placeholder="Vacío, no sale" /></label>
          <p className="graficos-nota">Arriba sale tu usuario de la web ({profile?.username ? `@${profile.username}` : profile?.name || 'sin nombre'}) con tu puesto y tus puntos en la Porra.</p>
        </fieldset>
      </form>
    </div>
  )
}
