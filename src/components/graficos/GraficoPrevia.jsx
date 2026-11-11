import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug, urlParaCanvas } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoPrevia, zonaFoto } from '../../lib/graficoPrevia'
import { calcularClasificacion } from '../../lib/clasificacion'
import { cargarProximoYUltimo } from '../../lib/partidoActual'
import { ESTADIO_ZARAGOZA, fechaCorta, horaMadrid, limpiarEstadio } from '../../lib/partidoSeo'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useGuardarLocal, useJugadores } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoDisposicion, CampoFoto } from './comunes'

// Plantilla "Previa del rival": el jugador a seguir a toda altura y el rival
// en cifras (posición, puntos, goles y racha, que salen solos de la web),
// sus goleadores y sus bajas. Por defecto, el rival del próximo partido.
const VACIO = { jugadorId: '', nombre: '' }
const INICIAL = {
  rivalId: '', antetitulo: '', info: '',
  goleadores: [{ ...VACIO, goles: '' }, { ...VACIO, goles: '' }, { ...VACIO, goles: '' }],
  bajas: [VACIO, VACIO, VACIO, VACIO], aSeguir: VACIO, credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 }, fotoDerecha: false,
}
const sinComillas = n => (n || '').replace(/["“”]/g, '').trim()
const fotoDe = j => (j?.foto ? cargarImagen(urlParaCanvas(j.foto), { cors: true }) : Promise.resolve(null))

function SelectJugador({ etiqueta, valor, jugadores, onChange, children }) {
  return (
    <div className="graficos-fila">
      <label className="graficos-campo">
        {etiqueta}
        <select value={valor.jugadorId} onChange={e => { const j = jugadores.find(x => x.id === e.target.value); onChange({ jugadorId: e.target.value, nombre: j ? j.nombre : '' }) }}>
          <option value="">—</option>
          {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
        </select>
      </label>
      <label className="graficos-campo">
        Nombre
        <input value={valor.nombre} onChange={e => onChange({ nombre: e.target.value })} />
      </label>
      {children}
    </div>
  )
}

export default function GraficoPrevia({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_previa', INICIAL))
  useGuardarLocal('redaccion_grafico_previa', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const zona = useMemo(() => zonaFoto(datos.fotoDerecha), [datos.fotoDerecha])
  const { foto, elegirFoto, handlers } = useFotoArrastrable(zona, datos.ajusteFoto, setAjuste)
  const rivales = useEquiposGraficos().filter(e => e.id !== 'real-zaragoza')
  const rival = rivales.find(r => r.id === datos.rivalId) || null
  const jugadores = useJugadores(datos.rivalId || null) || []
  const [liga, setLiga] = useState([])
  const [imgs, setImgs] = useState({})

  // Clasificación y, si aún no hay rival elegido, el del próximo partido con
  // su jornada, fecha y estadio.
  useEffect(() => {
    supabase.from('liga_calendario').select('*').then(({ data }) => setLiga(data || []))
    Promise.all([cargarProximoYUltimo(), supabase.from('rivales').select('id, nombre, estadio')]).then(([{ proximo }, { data }]) => {
      const r = proximo && (data || []).find(x => x.nombre === proximo.rival)
      if (!r) return
      const estadio = proximo.sede === 'local' ? ESTADIO_ZARAGOZA : limpiarEstadio(r.estadio)
      setDatos(d => (d.rivalId ? d : {
        ...d, rivalId: r.id,
        antetitulo: proximo.jornada ? `Previa · Jornada ${proximo.jornada}` : 'Previa',
        info: `${fechaCorta(proximo.kickoff)} · ${horaMadrid(proximo.kickoff)}${estadio ? ` · ${estadio}` : ''}`,
      }))
    })
  }, [])

  const nombreRival = sinComillas(rival?.nombre)
  // 20 equipos: se recalcula en cada render sin coste apreciable.
  const equipo = !liga.length || !nombreRival ? null : (() => {
    const tabla = calcularClasificacion(liga)
    const i = tabla.findIndex(t => sinComillas(t.equipo) === nombreRival)
    return i < 0 ? null : { ...tabla[i], pos: i + 1 }
  })()

  // Imágenes: escudo del rival, fotos de goleadores, bajas y jugador a seguir.
  const claveImgs = JSON.stringify([rival?.nombre, datos.goleadores.map(x => x.jugadorId), datos.bajas.map(x => x.jugadorId), datos.aSeguir.jugadorId, jugadores.length])
  useEffect(() => {
    let activo = true
    const buscar = id => jugadores.find(j => j.id === id)
    ;(async () => {
      const [escudoRival, fotosGoleadores, fotosBajas, fotoSeguir] = await Promise.all([
        cargarImagen(encodeURI(escudoDe(rival?.nombre) || '')),
        Promise.all(datos.goleadores.map(x => fotoDe(buscar(x.jugadorId)))),
        Promise.all(datos.bajas.map(x => fotoDe(buscar(x.jugadorId)))),
        fotoDe(buscar(datos.aSeguir.jugadorId)),
      ])
      if (!activo) return
      setImgs({
        escudoRival,
        fotosGoleadores,
        bajas: fotosBajas.map(f => ({ foto: f, escudo: escudoRival })),
        fotoSeguirBd: fotoSeguir,
      })
    })()
    return () => { activo = false }
  }, [claveImgs]) // eslint-disable-line react-hooks/exhaustive-deps

  const recursos = useMemo(() => ({ logo, ...imgs, fotoSeguir: foto }), [logo, imgs, foto])
  const bajasConNombre = datos.bajas.filter(b => b.nombre)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const indices = datos.bajas.map((b, i) => (b.nombre ? i : -1)).filter(i => i >= 0)
    const rec = { ...recursos, bajas: indices.map(i => recursos.bajas?.[i]) }
    dibujarGraficoPrevia(contextoGrafico(c), { ...datos, rival: rival?.nombre || '', equipo, bajas: bajasConNombre, aSeguir: datos.aSeguir.nombre }, rec)
  }) // tras cada render: las cifras se recalculan en cada uno y dibujar es barato

  const cambiarLista = (campo, i, c) => setDatos(d => ({ ...d, [campo]: d[campo].map((x, j) => (j === i ? { ...x, ...c } : x)) }))
  const cambiarRival = rivalId => setDatos(d => ({ ...d, rivalId, goleadores: INICIAL.goleadores, bajas: INICIAL.bajas, aSeguir: VACIO }))

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-previa-${slug(rival?.nombre)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Rival</legend>
          <label className="graficos-campo">
            Rival
            <select value={datos.rivalId} onChange={e => cambiarRival(e.target.value)}>
              <option value="">—</option>
              {rivales.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </label>
          <label className="graficos-campo">Antetítulo<input value={datos.antetitulo} onChange={e => cambiar({ antetitulo: e.target.value })} placeholder="Previa · Jornada 12" /></label>
          <label className="graficos-campo">Fecha, hora y estadio<input value={datos.info} onChange={e => cambiar({ info: e.target.value })} /></label>
          <p className="graficos-nota">Posición, puntos, goles y racha salen solos con los resultados de la web.</p>
        </fieldset>
        <fieldset>
          <legend>Máximos goleadores</legend>
          {datos.goleadores.map((x, i) => (
            <SelectJugador key={i} etiqueta={`${i + 1}.º`} valor={x} jugadores={jugadores} onChange={c => cambiarLista('goleadores', i, c)}>
              <label className="graficos-campo graficos-campo--valor">Goles<input value={x.goles} onChange={e => cambiarLista('goleadores', i, { goles: e.target.value })} /></label>
            </SelectJugador>
          ))}
        </fieldset>
        <fieldset>
          <legend>Bajas (hasta 4)</legend>
          {datos.bajas.map((x, i) => (
            <SelectJugador key={i} etiqueta={`Baja ${i + 1}`} valor={x} jugadores={jugadores} onChange={c => cambiarLista('bajas', i, c.nombre !== undefined && c.jugadorId ? { ...c, nombre: c.nombre.split(' ').slice(-1)[0] } : c)} />
          ))}
          <p className="graficos-nota">En la tarjeta va el apellido; puedes cambiarlo.</p>
        </fieldset>
        <fieldset>
          <legend>Jugador a seguir</legend>
          <SelectJugador etiqueta="Jugador" valor={datos.aSeguir} jugadores={jugadores} onChange={c => setDatos(d => ({ ...d, aSeguir: { ...d.aSeguir, ...c } }))} />
          <p className="graficos-nota">Va a toda altura: sube una foto buena (la de la base de datos es pequeña) y arrástrala para encuadrarla.</p>
        </fieldset>
        <CampoDisposicion datos={datos} cambiar={cambiar} />
        <CampoFoto foto={foto} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
