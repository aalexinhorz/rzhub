import { useEffect, useMemo, useRef, useState } from 'react'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoRivalCopa } from '../../lib/graficoRivalCopa'
import { useProximosPartidos } from '../../lib/graficosPartidos'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Rival en Copa": el rival de la siguiente eliminatoria con su
// escudo en grande y la foto a la derecha. Si el partido ya está en la web
// se rellena solo; si no (el sorteo acaba de salir), se escribe a mano y se
// sube el escudo.
const INICIAL = { partidoId: '', titulo: 'Rival en Copa', ronda: '', rival: '', fechas: '', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }

export default function GraficoRivalCopa({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_rival_copa', INICIAL))
  useGuardarLocal('redaccion_grafico_rival_copa', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const equipos = useEquiposGraficos()
  const copa = useProximosPartidos().filter(p => /copa/i.test(p.competicion))
  const partido = copa.find(p => String(p.id) === datos.partidoId) || null

  const auto = {
    ronda: partido?.ronda || '',
    rival: partido?.rival || '',
    fechas: partido?.fecha || '',
  }
  const final = { ronda: datos.ronda || auto.ronda, rival: datos.rival || auto.rival, fechas: datos.fechas || auto.fechas }

  // Escudo: el subido a mano o el de la web por el nombre.
  const [escudoManual, setEscudoManual] = useState(null)
  const [escudoWeb, setEscudoWeb] = useState({ nombre: null, img: null })
  const nombreRival = final.rival
  useEffect(() => {
    let activo = true
    const eq = equipos.find(e => e.nombre === nombreRival)
    const src = escudoDe(nombreRival) || eq?.escudo
    cargarImagen(src ? encodeURI(src) : '').then(img => { if (activo) setEscudoWeb({ nombre: nombreRival, img }) })
    return () => { activo = false }
  }, [nombreRival, equipos])
  const escudo = escudoManual || (escudoWeb.nombre === nombreRival ? escudoWeb.img : null)

  const [logoCopa, setLogoCopa] = useState(null)
  useEffect(() => { cargarImagen('/escudos/competiciones/copa-del-rey-blanco.svg').then(setLogoCopa) }, [])
  const recursos = useMemo(() => ({ foto, logo, escudo, logoCopa }), [foto, logo, escudo, logoCopa])
  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoRivalCopa(contextoGrafico(c), { ...datos, ...final }, recursos)
  }) // tras cada render: los textos automáticos se calculan en cada uno y dibujar es barato

  const campo = (clave, etiqueta, placeholder) => (
    <label className="graficos-campo">{etiqueta}<input value={datos[clave]} placeholder={auto[clave] || placeholder} onChange={e => cambiar({ [clave]: e.target.value })} /></label>
  )

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-rival-copa-${slug(final.rival)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Rival</legend>
          <label className="graficos-campo">
            Partido de Copa en la web
            <select value={datos.partidoId} onChange={e => cambiar({ partidoId: e.target.value, ronda: '', rival: '', fechas: '' })}>
              <option value="">— A mano —</option>
              {copa.map(p => <option key={p.id} value={p.id}>{p.local} - {p.visitante} ({p.ronda}, {p.fecha})</option>)}
            </select>
          </label>
          <label className="graficos-campo">
            Rival
            <input value={datos.rival} list="rival-copa-equipos" placeholder={auto.rival || 'CD Tudelano'} onChange={e => { setEscudoManual(null); cambiar({ rival: e.target.value }) }} />
            <datalist id="rival-copa-equipos">{equipos.map(e => <option key={e.id} value={e.nombre} />)}</datalist>
          </label>
          <span className="graficos-foto-jugador">
            <label className="graficos-mini-boton">
              <input type="file" accept="image/*" onChange={e => { const a = e.target.files?.[0]; if (a) cargarImagen(URL.createObjectURL(a)).then(setEscudoManual) }} />
              {escudoManual ? 'Cambiar escudo' : escudo ? 'Subir otro escudo' : 'Subir escudo'}
            </label>
            {escudoManual && <button type="button" className="graficos-mini-boton" onClick={() => setEscudoManual(null)}>Quitar</button>}
          </span>
          {!escudo && final.rival && <p className="graficos-nota">No tenemos el escudo de este equipo: súbelo (mejor en PNG sin fondo).</p>}
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          {campo('titulo', 'Título')}
          {campo('ronda', 'Ronda', '2ª eliminatoria')}
          {campo('fechas', 'Fechas', '27-28-29 octubre')}
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
