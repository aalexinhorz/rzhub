import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoResultado } from '../../lib/graficoResultado'
import { LOGOS_COMPETICION } from '../../lib/graficoCaraACara'
import { ESTADIO_ZARAGOZA, fechaLarga, limpiarEstadio, nombresPartido } from '../../lib/partidoSeo'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Final de partido": se elige un partido ya jugado de la web y se
// rellenan solos los equipos, el marcador, los goleadores del Real Zaragoza,
// la competición y la fecha. Todo se puede retocar a mano.
const INICIAL = {
  partido: '', local: 'Real Zaragoza', visitante: '', golesLocal: '', golesVisitante: '',
  goleadoresLocal: '', goleadoresVisitante: '', etiqueta: 'auto', competicion: 'Primera Federación', detalle: '',
  credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}
const ZARAGOZA = 'Real Zaragoza'

function resultadoAuto(d) {
  const gl = Number(d.golesLocal)
  const gv = Number(d.golesVisitante)
  if (d.golesLocal === '' || d.golesVisitante === '' || Number.isNaN(gl) || Number.isNaN(gv)) return ''
  const zaragozaLocal = d.local === ZARAGOZA
  if (!zaragozaLocal && d.visitante !== ZARAGOZA) return ''
  const a = zaragozaLocal ? gl : gv
  const b = zaragozaLocal ? gv : gl
  return a > b ? 'g' : a < b ? 'p' : 'e'
}

export default function GraficoResultado({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_resultado', INICIAL))
  useGuardarLocal('redaccion_grafico_resultado', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const [partidos, setPartidos] = useState([])
  const [estadios, setEstadios] = useState({})
  const [imgs, setImgs] = useState({})

  useEffect(() => {
    supabase.from('porra_partidos').select('id, rival, sede, jornada, competicion, goles_zaragoza, goles_rival, goleadores, kickoff')
      .eq('finalizado', true).order('kickoff', { ascending: false }).limit(30)
      .then(({ data }) => setPartidos(data || []))
    supabase.from('rivales').select('nombre, estadio').then(({ data }) => setEstadios(Object.fromEntries((data || []).map(r => [r.nombre, r.estadio]))))
  }, [])

  const esCopa = /copa/i.test(datos.competicion)
  useEffect(() => {
    let activo = true
    Promise.all([
      cargarImagen(encodeURI(escudoDe(datos.local) || '')),
      cargarImagen(encodeURI(escudoDe(datos.visitante) || '')),
      cargarImagen(LOGOS_COMPETICION[esCopa ? 'Copa del Rey' : 'Primera Federación']),
    ]).then(([escudoLocal, escudoVisitante, logoCompeticion]) => { if (activo) setImgs({ escudoLocal, escudoVisitante, logoCompeticion }) })
    return () => { activo = false }
  }, [datos.local, datos.visitante, esCopa])

  const recursos = useMemo(() => ({ foto, logo, ...imgs }), [foto, logo, imgs])
  const resultado = datos.etiqueta === 'auto' ? resultadoAuto(datos) : datos.etiqueta === 'ninguna' ? '' : datos.etiqueta

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoResultado(contextoGrafico(c), { ...datos, resultado }, recursos)
  }, [datos, resultado, recursos, fuentesListas])

  const elegirPartido = id => {
    const p = partidos.find(x => String(x.id) === id)
    if (!p) { cambiar({ partido: '' }); return }
    const { local, visitante, zaragozaLocal } = nombresPartido(p)
    const goleadores = (p.goleadores || []).join('\n')
    const estadio = zaragozaLocal ? ESTADIO_ZARAGOZA : limpiarEstadio(estadios[p.rival])
    const fecha = fechaLarga(p.kickoff)
    cambiar({
      partido: id, local, visitante,
      golesLocal: zaragozaLocal ? p.goles_zaragoza : p.goles_rival,
      golesVisitante: zaragozaLocal ? p.goles_rival : p.goles_zaragoza,
      goleadoresLocal: zaragozaLocal ? goleadores : '',
      goleadoresVisitante: zaragozaLocal ? '' : goleadores,
      competicion: p.competicion ? p.competicion.replace(/\s*·\s*/, ' · ') : `Primera Federación · Jornada ${p.jornada}`,
      detalle: `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)}${estadio ? ` · ${estadio}` : ''}`,
    })
  }

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-final-${slug(`${datos.local} ${datos.visitante}`)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partido</legend>
          <label className="graficos-campo">
            Partido jugado (lo rellena solo)
            <select value={datos.partido} onChange={e => elegirPartido(e.target.value)}>
              <option value="">— Elige un partido —</option>
              {partidos.map(p => {
                const { local, visitante } = nombresPartido(p)
                return <option key={p.id} value={p.id}>{local} {p.sede === 'local' ? p.goles_zaragoza : p.goles_rival}-{p.sede === 'local' ? p.goles_rival : p.goles_zaragoza} {visitante} ({p.competicion ? 'Copa' : `J${p.jornada}`})</option>
              })}
            </select>
          </label>
          <div className="graficos-fila">
            <label className="graficos-campo">Local<input value={datos.local} onChange={e => cambiar({ local: e.target.value })} /></label>
            <label className="graficos-campo graficos-campo--valor">Goles<input value={datos.golesLocal} onChange={e => cambiar({ golesLocal: e.target.value })} /></label>
          </div>
          <div className="graficos-fila">
            <label className="graficos-campo">Visitante<input value={datos.visitante} onChange={e => cambiar({ visitante: e.target.value })} /></label>
            <label className="graficos-campo graficos-campo--valor">Goles<input value={datos.golesVisitante} onChange={e => cambiar({ golesVisitante: e.target.value })} /></label>
          </div>
          <div className="graficos-fila">
            <label className="graficos-campo">
              Goleadores local (uno por línea)
              <textarea rows={3} value={datos.goleadoresLocal} onChange={e => cambiar({ goleadoresLocal: e.target.value })} placeholder="Vadillo 34'" />
            </label>
            <label className="graficos-campo">
              Goleadores visitante
              <textarea rows={3} value={datos.goleadoresVisitante} onChange={e => cambiar({ goleadoresVisitante: e.target.value })} />
            </label>
          </div>
          <p className="graficos-nota">La web guarda solo los goleadores del Real Zaragoza, sin minuto: añádelo a mano si quieres (p. ej. «Vadillo 34'»).</p>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">
            Etiqueta
            <select value={datos.etiqueta} onChange={e => cambiar({ etiqueta: e.target.value })}>
              <option value="auto">Automática (según el resultado del Real Zaragoza)</option>
              <option value="g">Victoria</option>
              <option value="e">Empate</option>
              <option value="p">Derrota</option>
              <option value="ninguna">Solo «FINAL»</option>
            </select>
          </label>
          <label className="graficos-campo">Competición<input value={datos.competicion} onChange={e => cambiar({ competicion: e.target.value })} /></label>
          <label className="graficos-campo">Fecha y estadio<input value={datos.detalle} onChange={e => cambiar({ detalle: e.target.value })} /></label>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
