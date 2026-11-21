import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarImagen, contextoGrafico, ESCALA, slug, urlParaCanvas } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGanadoresPorra } from '../../lib/graficoGanadoresPorra'
import { useImagenesPartido } from '../../lib/graficosPartidos'
import { leerLocal, useGuardarLocal } from '../../lib/graficosHooks'
import { nombresPartido } from '../../lib/partidoSeo'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "Ganadores de la Porra": eliges una jornada ya cerrada y salen
// los que más puntos sacaron (con su foto, @usuario y pronóstico). Si nadie
// acertó el resultado exacto, sale cuántos acertaron el ganador.
const INICIAL = { partidoId: '', cta: '¿Te atreves con la próxima? rzhub.es/porra', ocultos: [] }

const apellido = n => {
  const p = (n || '').trim().split(/\s+/)
  return p.length > 1 ? p.slice(1).join(' ') : p[0] || ''
}

export default function GraficoGanadoresPorra({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_ganadores_porra', INICIAL))
  useGuardarLocal('redaccion_grafico_ganadores_porra', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const [partidos, setPartidos] = useState([])
  const [pronosticos, setPronosticos] = useState({ id: '', lista: [] })
  const [avatares, setAvatares] = useState([])

  useEffect(() => {
    supabase.from('porra_partidos').select('id, rival, sede, jornada, competicion, fecha, goles_zaragoza, goles_rival, goleadores')
      .eq('finalizado', true).order('kickoff', { ascending: false }).limit(40)
      .then(({ data }) => setPartidos(data || []))
  }, [])

  const partido = partidos.find(p => p.id === datos.partidoId) || partidos[0] || null

  // Pronósticos de esa jornada con su perfil.
  useEffect(() => {
    if (!partido) return
    let activo = true
    supabase.from('porra_predicciones').select('user_id, goles_zaragoza, goles_rival, goleadores, puntos').eq('partido_id', partido.id)
      .then(async ({ data }) => {
        const ids = [...new Set((data || []).map(p => p.user_id))]
        const { data: perfiles } = ids.length ? await supabase.from('profiles').select('id, username, name, avatar_url').in('id', ids) : { data: [] }
        const porId = Object.fromEntries((perfiles || []).map(p => [p.id, p]))
        if (activo) setPronosticos({ id: partido.id, lista: (data || []).map(p => ({ ...p, perfil: porId[p.user_id] || {} })) })
      })
    return () => { activo = false }
  }, [partido?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const lista = pronosticos.id === partido?.id ? pronosticos.lista : []
  const maxPuntos = Math.max(0, ...lista.map(p => p.puntos || 0))
  // Ganadores: los del máximo, si al menos acertaron el resultado (5 u 8).
  const ganadoresTodos = maxPuntos >= 5 ? lista.filter(p => p.puntos === maxPuntos) : []
  const ganadores = ganadoresTodos.filter(p => !(datos.ocultos || []).includes(p.user_id))
  const acertantesSigno = lista.filter(p => p.puntos === 1).length

  const claveAvatares = ganadores.map(p => p.perfil.avatar_url || '').join('|')
  useEffect(() => {
    let activo = true
    Promise.all(claveAvatares.split('|').map(u => (u ? cargarImagen(urlParaCanvas(u), { cors: true }) : null)))
      .then(imgs => { if (activo) setAvatares(imgs) })
    return () => { activo = false }
  }, [claveAvatares])

  const { local, visitante, zaragozaLocal } = partido ? nombresPartido(partido) : { local: '', visitante: '', zaragozaLocal: true }
  const competicion = partido?.competicion ? partido.competicion.split(' · ')[0] : 'Primera Federación'
  const imgs = useImagenesPartido(local, visitante, competicion)

  const marcador = (gz, gr) => (zaragozaLocal ? `${gz}-${gr}` : `${gr}-${gz}`)
  const dibujo = partido ? {
    jornada: partido.jornada ? `Jornada ${partido.jornada}` : (partido.competicion || 'Copa del Rey'),
    local, visitante,
    golesLocal: zaragozaLocal ? partido.goles_zaragoza : partido.goles_rival,
    golesVisitante: zaragozaLocal ? partido.goles_rival : partido.goles_zaragoza,
    goleadores: (partido.goleadores || []).map(apellido).join(', '),
    ganadores: ganadores.map(p => ({
      usuario: p.perfil.username || p.perfil.name || 'aficionado',
      inicial: (p.perfil.username || p.perfil.name || '?').charAt(0),
      pronostico: marcador(p.goles_zaragoza, p.goles_rival),
      goleadores: (p.goleadores || []).map(apellido).join(', '),
      puntos: p.puntos,
    })),
    acertantesSigno,
    cta: datos.cta,
  } : null
  const recursos = useMemo(() => ({ logo, avatares, ...imgs }), [logo, avatares, imgs])

  useEffect(() => {
    const c = canvasRef.current
    if (c && dibujo) dibujarGanadoresPorra(contextoGrafico(c), dibujo, recursos)
  })

  const alternar = id => cambiar({ ocultos: (datos.ocultos || []).includes(id) ? datos.ocultos.filter(x => x !== id) : [...(datos.ocultos || []), id] })

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" data-fuentes={fuentesListas ? 1 : 0} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-ganadores-porra-${slug(partido?.rival || '')}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Jornada</legend>
          <label className="graficos-campo">
            Partido (porras cerradas)
            <select value={partido?.id || ''} onChange={e => cambiar({ partidoId: e.target.value, ocultos: [] })}>
              {partidos.map(p => {
                const n = nombresPartido(p)
                const gl = p.sede === 'local' ? p.goles_zaragoza : p.goles_rival
                const gv = p.sede === 'local' ? p.goles_rival : p.goles_zaragoza
                return <option key={p.id} value={p.id}>{`${p.jornada ? `J${p.jornada}` : 'Copa'} · ${n.local} ${gl}-${gv} ${n.visitante}`}</option>
              })}
            </select>
          </label>
          <p className="graficos-nota">
            {lista.length
              ? maxPuntos >= 5
                ? `${ganadoresTodos.length} ${ganadoresTodos.length === 1 ? 'ganador' : 'ganadores'} con ${maxPuntos} puntos, de ${lista.length} pronósticos.`
                : `Nadie acertó el resultado exacto: ${acertantesSigno} de ${lista.length} acertaron el ganador (+1). Sale ese número en grande.`
              : 'Cargando pronósticos…'}
          </p>
        </fieldset>
        {ganadoresTodos.length > 0 && (
          <fieldset>
            <legend>Ganadores</legend>
            {ganadoresTodos.map(p => (
              <label key={p.user_id} className="graficos-check">
                <input type="checkbox" checked={!(datos.ocultos || []).includes(p.user_id)} onChange={() => alternar(p.user_id)} />
                @{p.perfil.username || p.perfil.name} · {marcador(p.goles_zaragoza, p.goles_rival)} · +{p.puntos}
              </label>
            ))}
            <p className="graficos-nota">Desmarca a quien no quieras que salga. Con más de 5 se ponen a dos columnas.</p>
          </fieldset>
        )}
        <fieldset>
          <legend>Abajo</legend>
          <label className="graficos-campo">Llamada<input value={datos.cta} onChange={e => cambiar({ cta: e.target.value })} /></label>
        </fieldset>
      </form>
    </div>
  )
}
