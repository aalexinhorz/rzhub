import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarEnfrentamientos } from '../../lib/enfrentamientos'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoRival, zonaFoto } from '../../lib/graficoRival'
import { cargarProximoYUltimo } from '../../lib/partidoActual'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "El rival": escudo y nombre del rival, su historia (la de su
// ficha en la web, se puede retocar) y los últimos 5 enfrentamientos con
// el Real Zaragoza, con una foto a toda altura. Por defecto, el rival del
// próximo partido.
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
    cargarEnfrentamientos(rival.id, rival.nombre).then(partidos => { if (activo) setHistorial({ id: rival.id, partidos }) })
    Promise.all([cargarImagen(encodeURI(escudoDe('Real Zaragoza'))), cargarImagen(encodeURI(escudoDe(rival.nombre) || ''))])
      .then(([zaragoza, otro]) => { if (activo) setEscudos({ zaragoza, otro }) })
    return () => { activo = false }
  }, [rival?.id, rival?.nombre]) // eslint-disable-line react-hooks/exhaustive-deps

  const partidos = useMemo(() => (historial.id === datos.rivalId ? historial.partidos.slice(0, 5) : []), [historial, datos.rivalId])
  const historia = datos.historia || historias[datos.rivalId] || ''
  const recursos = useMemo(() => ({ foto, logo, escudoRival: escudos.otro, escudoZaragoza: escudos.zaragoza }), [foto, logo, escudos])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoRival(contextoGrafico(c), { ...datos, rival: rival?.nombre || '', historia, partidos }, recursos)
  }, [datos, rival, historia, partidos, recursos, fuentesListas])

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-rival-${slug(rival?.nombre)}.png`} />
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
            Sale el texto de la ficha del rival; puedes retocarlo (si lo borras entero, vuelve el original). Los últimos 5 enfrentamientos salen solos del historial de la web
            {rival && !partidos.length ? ' (con este rival no hay ninguno guardado)' : ''}.
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
