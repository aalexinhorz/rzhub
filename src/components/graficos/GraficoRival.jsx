import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { sinComillas } from '../../lib/enfrentamientos'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoRival, zonaFoto } from '../../lib/graficoRival'
import { cargarProximoYUltimo } from '../../lib/partidoActual'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "El rival": escudo y nombre del rival, su historia (la de su
// ficha en la web, se puede retocar) y sus últimos 5 partidos de liga
// (contra cualquiera; para los duelos con el Real Zaragoza está el cara a
// cara), con una foto a toda altura. Por defecto, el rival del
// próximo partido.
// "AD Alcorcón" / "Villarreal CF \"B\"" → "alcorcon" / "villarreal b": para casar el
// nombre corto del rival con el largo del calendario de liga.
const claveEquipo = n => sinComillas(n).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .split(/[^a-z0-9]+/).filter(t => t && !['ad', 'cf', 'ud', 'sd', 'fc', 'cd', 'ce', 'ue', 'de', 'club', 'real'].includes(t)).join(' ')
// Mismo equipo si todas las palabras del nombre más corto están en el otro (por palabras
// enteras: "madrid" no casa con "madrileño").
const mismoEquipo = (a, b) => {
  const [x, y] = [claveEquipo(a).split(' '), claveEquipo(b).split(' ')].sort((m, n) => m.length - n.length)
  return !!x[0] && x.every(t => y.includes(t))
}

const INICIAL = { rivalId: '', antetitulo: 'El rival', historia: '', fotoIzquierda: false, credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }

export default function GraficoRival({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_rival', INICIAL))
  useGuardarLocal('redaccion_grafico_rival', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const zona = useMemo(() => zonaFoto(datos.fotoIzquierda), [datos.fotoIzquierda])
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(zona, datos.ajusteFoto, setAjuste)
  const rivales = useEquiposGraficos().filter(e => e.id !== 'real-zaragoza')
  const rival = rivales.find(r => r.id === datos.rivalId) || null
  const [historias, setHistorias] = useState({})
  const [historial, setHistorial] = useState({ id: null, partidos: [] })
  const [escudos, setEscudos] = useState({})

  // Historias de los rivales y, si no hay rival elegido, el del próximo partido.
  useEffect(() => {
    Promise.all([cargarProximoYUltimo(), supabase.from('rivales').select('id, nombre, historia')]).then(([{ proximo }, { data }]) => {
      setHistorias(Object.fromEntries((data || []).map(r => [r.id, r.historia || ''])))
      const r = proximo && (data || []).find(x => x.nombre === proximo.rival)
      if (r) setDatos(d => (d.rivalId ? d : { ...d, rivalId: r.id }))
    })
  }, [])

  useEffect(() => {
    if (!rival) return
    let activo = true
    supabase.from('liga_calendario')
      .select('fecha, jornada, equipo_local, equipo_visitante, goles_local, goles_visitante')
      .not('goles_local', 'is', null)
      .order('fecha', { ascending: false })
      .then(async ({ data }) => {
        const partidos = (data || [])
          .filter(f => mismoEquipo(f.equipo_local, rival.nombre) || mismoEquipo(f.equipo_visitante, rival.nombre))
          .slice(0, 5)
          .map(f => ({
            fecha: f.fecha, jornada: f.jornada, local: f.equipo_local, visitante: f.equipo_visitante,
            goles_local: f.goles_local, goles_visitante: f.goles_visitante, rivalEnCasa: mismoEquipo(f.equipo_local, rival.nombre),
          }))
        const equipos = [...new Set([rival.nombre, ...partidos.flatMap(p => [p.local, p.visitante])])]
        const imgs = await Promise.all(equipos.map(e => cargarImagen(encodeURI(escudoDe(e) || escudoDe(sinComillas(e)) || '')).catch(() => null)))
        if (!activo) return
        setHistorial({ id: rival.id, partidos })
        setEscudos(Object.fromEntries(equipos.map((e, i) => [e, imgs[i]])))
      })
    return () => { activo = false }
  }, [rival?.id, rival?.nombre]) // eslint-disable-line react-hooks/exhaustive-deps

  const partidos = useMemo(() => (historial.id === datos.rivalId ? historial.partidos.slice(0, 5) : []), [historial, datos.rivalId])
  const historia = datos.historia || historias[datos.rivalId] || ''
  const nombreRival = rival?.nombre
  const recursos = useMemo(() => ({ foto, logo, escudoRival: escudos[nombreRival], escudos }), [foto, logo, escudos, nombreRival])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoRival(contextoGrafico(c), { ...datos, rival: rival?.nombre || '', historia, partidos }, recursos)
  }, [datos, rival, historia, partidos, recursos, fuentesListas])

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-rival-${slug(rival?.nombre)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Rival</legend>
          <label className="graficos-campo">
            Rival
            <select value={datos.rivalId} onChange={e => cambiar({ rivalId: e.target.value, historia: '' })}>
              <option value="">Elige un rival…</option>
              {rivales.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </label>
          <label className="graficos-campo">Antetítulo<input value={datos.antetitulo} onChange={e => cambiar({ antetitulo: e.target.value })} /></label>
          <label className="graficos-campo">
            Texto
            <textarea rows={7} value={historia} onChange={e => cambiar({ historia: e.target.value })} />
          </label>
          <p className="graficos-nota">
            Sale el texto de la ficha del rival; puedes retocarlo (si lo borras entero, vuelve el original). Salen solos sus últimos 5 partidos de liga (los duelos con el Real Zaragoza están en el cara a cara)
            {rival && !partidos.length ? ' (de este rival no hay partidos de liga guardados)' : ''}.
          </p>
        </fieldset>
        <fieldset>
          <legend>Disposición</legend>
          <label className="graficos-campo">
            Foto
            <select value={datos.fotoIzquierda ? 'izquierda' : 'derecha'} onChange={e => cambiar({ fotoIzquierda: e.target.value === 'izquierda', ajusteFoto: { zoom: datos.ajusteFoto.zoom, dx: 0, dy: 0 } })}>
              <option value="derecha">A la derecha (datos a la izquierda)</option>
              <option value="izquierda">A la izquierda (datos a la derecha)</option>
            </select>
          </label>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
