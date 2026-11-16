import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoResultado } from '../../lib/graficoResultado'
import { LOGOS_COMPETICION } from '../../lib/graficoCaraACara'
import { ESTADIO_ZARAGOZA, fechaLarga, limpiarEstadio, nombresPartido } from '../../lib/partidoSeo'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import { EQUIPOS_OTROS, equipoOtro, escudoOtro, nombreVisible } from '../../lib/otrosEquipos'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Final de partido": se elige un partido ya jugado de la web y se
// rellenan solos los equipos, el marcador, los goleadores del Real Zaragoza,
// la competición y la fecha. Todo se puede retocar a mano. Vale también
// para el filial, el juvenil y el femenino (partidos de /cantera), y tiene
// un diseño sin foto, solo con los escudos.
const INICIAL = {
  equipo: 'primer', diseno: 'foto', propio: 'Real Zaragoza', escudoLocalUrl: '', escudoVisitanteUrl: '',
  partido: '', local: 'Real Zaragoza', visitante: '', golesLocal: '', golesVisitante: '',
  goleadoresLocal: '', goleadoresVisitante: '', etiqueta: 'auto', competicion: 'Primera Federación', detalle: '',
  credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}
const ZARAGOZA = 'Real Zaragoza'

function resultadoAuto(d) {
  const gl = Number(d.golesLocal)
  const gv = Number(d.golesVisitante)
  if (d.golesLocal === '' || d.golesVisitante === '' || Number.isNaN(gl) || Number.isNaN(gv)) return ''
  const propio = d.propio || ZARAGOZA
  const zaragozaLocal = d.local === propio
  if (!zaragozaLocal && d.visitante !== propio) return ''
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
  const [otrosCargados, setOtros] = useState({ equipo: null, lista: [] })
  const [estadios, setEstadios] = useState({})
  const [imgs, setImgs] = useState({})

  useEffect(() => {
    supabase.from('porra_partidos').select('id, rival, sede, jornada, competicion, goles_zaragoza, goles_rival, goleadores, kickoff')
      .eq('finalizado', true).order('kickoff', { ascending: false }).limit(30)
      .then(({ data }) => setPartidos(data || []))
    supabase.from('rivales').select('nombre, estadio').then(({ data }) => setEstadios(Object.fromEntries((data || []).map(r => [r.nombre, r.estadio]))))
  }, [])

  // Partidos jugados del filial, el juvenil o el femenino (los del equipo propio).
  useEffect(() => {
    if (datos.equipo === 'primer') return
    let activo = true
    const eq = equipoOtro(datos.equipo)
    supabase.from('otros_equipos_partidos').select('*').eq('equipo', eq.id).not('goles_local', 'is', null)
      .or(`local.eq."${eq.propio}",visitante.eq."${eq.propio}"`).order('fecha', { ascending: false }).limit(40)
      .then(({ data }) => { if (activo) setOtros({ equipo: eq.id, lista: data || [] }) })
    return () => { activo = false }
  }, [datos.equipo])

  const otros = otrosCargados.equipo === datos.equipo ? otrosCargados.lista : []
  const esCopa = /copa/i.test(datos.competicion)
  const esPrimer = datos.equipo === 'primer'
  useEffect(() => {
    let activo = true
    // Los escudos de BeSoccer (filial, juvenil, femenino) están en Storage.
    const escudo = (url, nombre) => (url ? cargarImagen(url, { cors: true }) : cargarImagen(encodeURI(escudoDe(nombre) || '')))
    Promise.all([
      escudo(datos.escudoLocalUrl, datos.local),
      escudo(datos.escudoVisitanteUrl, datos.visitante),
      esPrimer ? cargarImagen(LOGOS_COMPETICION[esCopa ? 'Copa del Rey' : 'Primera Federación']) : null,
    ]).then(([escudoLocal, escudoVisitante, logoCompeticion]) => { if (activo) setImgs({ escudoLocal, escudoVisitante, logoCompeticion }) })
    return () => { activo = false }
  }, [datos.local, datos.visitante, datos.escudoLocalUrl, datos.escudoVisitanteUrl, esCopa, esPrimer])

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
      partido: id, local, visitante, propio: ZARAGOZA, escudoLocalUrl: '', escudoVisitanteUrl: '',
      golesLocal: zaragozaLocal ? p.goles_zaragoza : p.goles_rival,
      golesVisitante: zaragozaLocal ? p.goles_rival : p.goles_zaragoza,
      goleadoresLocal: zaragozaLocal ? goleadores : '',
      goleadoresVisitante: zaragozaLocal ? '' : goleadores,
      competicion: p.competicion ? p.competicion.replace(/\s*·\s*/, ' · ') : `Primera Federación · Jornada ${p.jornada}`,
      detalle: `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)}${estadio ? ` · ${estadio}` : ''}`,
    })
  }

  const elegirOtro = id => {
    const p = otros.find(x => String(x.id) === id)
    if (!p) { cambiar({ partido: '' }); return }
    const eq = equipoOtro(datos.equipo)
    const fecha = p.fecha ? new Date(`${p.fecha}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
    const propio = nombreVisible(eq.propio)
    cambiar({
      partido: id, propio,
      local: nombreVisible(p.local), visitante: nombreVisible(p.visitante),
      escudoLocalUrl: escudoOtro(p.local_id, p.local) || '', escudoVisitanteUrl: escudoOtro(p.visitante_id, p.visitante) || '',
      golesLocal: p.goles_local, golesVisitante: p.goles_visitante, goleadoresLocal: '', goleadoresVisitante: '',
      competicion: `${eq.competicion} · Jornada ${p.jornada}`,
      detalle: fecha ? `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)}` : '',
    })
  }
  const conFoto = datos.diseno !== 'escudos'

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className={`graficos-canvas${conFoto ? '' : ' graficos-canvas--fijo'}`} {...(conFoto ? handlers : {})} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-final-${slug(`${datos.local} ${datos.visitante}`)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partido</legend>
          <div className="graficos-fila">
            <label className="graficos-campo">
              Equipo
              <select value={datos.equipo} onChange={e => cambiar({ equipo: e.target.value, partido: '' })}>
                <option value="primer">Primer equipo</option>
                {EQUIPOS_OTROS.map(eq => <option key={eq.id} value={eq.id}>{eq.id === 'filial' ? 'Deportivo Aragón (filial)' : eq.nombre.replace('Real Zaragoza ', '')}</option>)}
              </select>
            </label>
            <label className="graficos-campo">
              Diseño
              <select value={datos.diseno} onChange={e => cambiar({ diseno: e.target.value })}>
                <option value="foto">Con foto</option>
                <option value="escudos">Solo escudos (sin foto)</option>
              </select>
            </label>
          </div>
          <label className="graficos-campo">
            Partido jugado (lo rellena solo)
            {esPrimer ? (
              <select value={datos.partido} onChange={e => elegirPartido(e.target.value)}>
                <option value="">— Elige un partido —</option>
                {partidos.map(p => {
                  const { local, visitante } = nombresPartido(p)
                  return <option key={p.id} value={p.id}>{local} {p.sede === 'local' ? p.goles_zaragoza : p.goles_rival}-{p.sede === 'local' ? p.goles_rival : p.goles_zaragoza} {visitante} ({p.competicion ? 'Copa' : `J${p.jornada}`})</option>
                })}
              </select>
            ) : (
              <select value={datos.partido} onChange={e => elegirOtro(e.target.value)}>
                <option value="">— Elige un partido —</option>
                {otros.map(p => (
                  <option key={p.id} value={p.id}>{nombreVisible(p.local)} {p.goles_local}-{p.goles_visitante} {nombreVisible(p.visitante)} (J{p.jornada})</option>
                ))}
              </select>
            )}
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
          <p className="graficos-nota">
            {esPrimer
              ? 'La web guarda solo los goleadores del Real Zaragoza, sin minuto: añádelo a mano si quieres (p. ej. «Vadillo 34\'»).'
              : 'Del filial, el juvenil y el femenino no hay goleadores: escríbelos a mano si los tienes.'}
          </p>
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
        {conFoto && <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />}
      </form>
    </div>
  )
}
