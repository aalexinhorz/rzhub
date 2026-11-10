import { useEffect, useMemo, useRef, useState } from 'react'
import { cargarEnfrentamientos } from '../../lib/enfrentamientos'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, LOGOS_COMPETICION, dibujarCaraACara, zonaFoto } from '../../lib/graficoCaraACara'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Cara a cara": últimos resultados contra un rival, sacados del
// historial de la web (rivales_enfrentamientos + la temporada en curso).
const INICIAL = { rivalId: '', cuantos: 12, sede: 'todos', zaragozaDerecha: false, titulo: 'Cara a cara', subtitulo: '', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }
const SEDES = { todos: '', local: ' en casa', visitante: ' a domicilio' }

export default function GraficoCaraACara({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_cara_a_cara', INICIAL))
  useGuardarLocal('redaccion_grafico_cara_a_cara', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const rivales = useEquiposGraficos().filter(e => e.id !== 'real-zaragoza')
  const rival = rivales.find(r => r.id === datos.rivalId) || null
  const [historial, setHistorial] = useState({ id: null, partidos: [] })
  const [escudos, setEscudos] = useState({})
  const [logosCompeticion, setLogosCompeticion] = useState({})

  useEffect(() => {
    const nombres = Object.keys(LOGOS_COMPETICION)
    Promise.all(nombres.map(n => cargarImagen(LOGOS_COMPETICION[n])))
      .then(imgs => setLogosCompeticion(Object.fromEntries(nombres.map((n, i) => [n, imgs[i]]))))
  }, [])

  useEffect(() => {
    if (!rival) return
    let activo = true
    cargarEnfrentamientos(rival.id, rival.nombre).then(partidos => { if (activo) setHistorial({ id: rival.id, partidos }) })
    Promise.all([cargarImagen(encodeURI(escudoDe('Real Zaragoza'))), cargarImagen(encodeURI(escudoDe(rival.nombre) || ''))])
      .then(([zaragoza, otro]) => { if (activo) setEscudos({ zaragoza, otro }) })
    return () => { activo = false }
  }, [rival?.id, rival?.nombre]) // eslint-disable-line react-hooks/exhaustive-deps

  const todos = useMemo(() => (historial.id === datos.rivalId ? historial.partidos : []), [historial, datos.rivalId])
  const partidos = useMemo(() => todos.filter(p => datos.sede === 'todos' || p.sede === datos.sede).slice(0, datos.cuantos), [todos, datos.sede, datos.cuantos])
  const zona = useMemo(() => zonaFoto(partidos.length), [partidos.length])
  const { foto, elegirFoto, handlers } = useFotoArrastrable(zona, datos.ajusteFoto, setAjuste)
  const enfrentamiento = datos.zaragozaDerecha ? `${rival?.nombre} – Real Zaragoza` : `Real Zaragoza – ${rival?.nombre}`
  const subtitulo = datos.subtitulo || (rival ? `Últimos ${partidos.length} ${enfrentamiento}${SEDES[datos.sede]}` : '')
  const recursos = useMemo(() => ({ foto, logo, escudoZaragoza: escudos.zaragoza, escudoRival: escudos.otro, logosCompeticion }), [foto, logo, escudos, logosCompeticion])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarCaraACara(contextoGrafico(c), { ...datos, subtitulo, partidos }, recursos)
  }, [datos, subtitulo, partidos, recursos, fuentesListas])

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-cara-a-cara-${slug(rival?.nombre)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partidos</legend>
          <label className="graficos-campo">
            Rival
            <select value={datos.rivalId} onChange={e => cambiar({ rivalId: e.target.value })}>
              <option value="">Elige un rival…</option>
              {rivales.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </label>
          <div className="graficos-fila">
            <label className="graficos-campo">
              Cuántos
              <select value={datos.cuantos} onChange={e => cambiar({ cuantos: Number(e.target.value) })}>
                {[6, 12].map(n => <option key={n} value={n}>Últimos {n}</option>)}
              </select>
            </label>
            <label className="graficos-campo">
              Dónde
              <select value={datos.sede} onChange={e => cambiar({ sede: e.target.value })}>
                <option value="todos">Todos</option>
                <option value="local">Solo en casa</option>
                <option value="visitante">Solo fuera</option>
              </select>
            </label>
            <label className="graficos-campo">
              Escudos
              <select value={datos.zaragozaDerecha ? 'visitante' : 'local'} onChange={e => cambiar({ zaragozaDerecha: e.target.value === 'visitante' })}>
                <option value="local">Real Zaragoza a la izquierda (local)</option>
                <option value="visitante">Real Zaragoza a la derecha (visitante)</option>
              </select>
            </label>
          </div>
          {rival && (
            <p className="graficos-nota">
              {todos.length ? `${todos.length} partidos registrados contra el ${rival.nombre}; salen ${partidos.length}.` : 'No hay partidos registrados contra este rival.'}
              {' '}Marcador con el local primero; en verde si ganó el Real Zaragoza, amarillo si empató y rojo si perdió.
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">
            Título
            <input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} />
          </label>
          <label className="graficos-campo">
            Texto de arriba (vacío = automático)
            <input value={datos.subtitulo} onChange={e => cambiar({ subtitulo: e.target.value })} placeholder={subtitulo} />
          </label>
        </fieldset>
        <CampoFoto foto={foto} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
