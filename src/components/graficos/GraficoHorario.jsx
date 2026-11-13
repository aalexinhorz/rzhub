import { useEffect, useMemo, useRef, useState } from 'react'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoHorario } from '../../lib/graficoHorario'
import { horasCoche } from '../../lib/graficoOnTour'
import { desplazamientoDe } from '../../lib/desplazamientos'
import { etiquetaPartido, useImagenesPartido, useProximosPartidos } from '../../lib/graficosPartidos'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Horario confirmado": día y hora del partido en grande. Tiene
// dos versiones que se eligen solas según el partido: en casa (estadio y
// lema) y fuera (ruta desde Zaragoza con km y horas en coche). Todo sale
// del partido elegido; los campos vacíos usan el texto automático.
const INICIAL = {
  partidoId: '', version: 'auto', titulo: 'Horario confirmado', fecha: '', hora: '', estadio: '', ciudad: '',
  lema: '¡A llenar el Ibercaja!', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}

export default function GraficoHorario({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_horario', INICIAL))
  useGuardarLocal('redaccion_grafico_horario', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const partidos = useProximosPartidos()
  const partido = partidos.find(p => p.id === datos.partidoId) || partidos[0] || null
  const imgs = useImagenesPartido(partido?.local, partido?.visitante, partido?.competicion)
  const recursos = useMemo(() => ({
    foto, logo, ...imgs,
    escudoRival: partido?.zaragozaLocal ? imgs.escudoVisitante : imgs.escudoLocal,
  }), [foto, logo, imgs, partido?.zaragozaLocal])

  const enCasa = datos.version === 'auto' ? (partido ? partido.zaragozaLocal : true) : datos.version === 'casa'
  const destino = partido && !partido.zaragozaLocal ? desplazamientoDe(partido.rival) : null
  const auto = partido ? {
    fecha: partido.fecha.replace(',', ''),
    hora: partido.hora,
    estadio: partido.estadio,
    ciudad: partido.ciudad,
  } : { fecha: '', hora: '', estadio: '', ciudad: '' }
  const final = {
    fecha: datos.fecha || auto.fecha, hora: datos.hora || auto.hora,
    estadio: datos.estadio || auto.estadio, ciudad: datos.ciudad || auto.ciudad,
  }

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    dibujarGraficoHorario(contextoGrafico(c), {
      ...datos, ...final, enCasa,
      local: partido?.local || '', visitante: partido?.visitante || '',
      competicion: partido ? `${partido.ronda} · ${partido.competicion}` : '',
      km: destino?.km || '', horas: destino && !destino.nota ? horasCoche(destino.km) : '',
    }, recursos)
  }) // tras cada render: los textos automáticos se calculan en cada uno y dibujar es barato

  const campo = (clave, etiqueta) => (
    <label className="graficos-campo">{etiqueta}<input value={datos[clave]} placeholder={auto[clave]} onChange={e => cambiar({ [clave]: e.target.value })} /></label>
  )

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-horario-${slug(partido ? `${partido.local} ${partido.visitante}` : '')}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partido</legend>
          <label className="graficos-campo">
            Partido
            <select value={partido?.id || ''} onChange={e => cambiar({ partidoId: e.target.value, fecha: '', hora: '', estadio: '', ciudad: '' })}>
              {partidos.map(p => <option key={p.id} value={p.id}>{etiquetaPartido(p)}</option>)}
            </select>
          </label>
          <label className="graficos-campo">
            Versión
            <select value={datos.version} onChange={e => cambiar({ version: e.target.value })}>
              <option value="auto">Según el partido ({partido?.zaragozaLocal === false ? 'fuera' : 'en casa'})</option>
              <option value="casa">En casa</option>
              <option value="fuera">Fuera de casa</option>
            </select>
          </label>
          <div className="graficos-fila">
            {campo('fecha', 'Día')}
            {campo('hora', 'Hora')}
          </div>
          {campo('estadio', 'Estadio')}
          {campo('ciudad', 'Ciudad')}
          <p className="graficos-nota">
            {enCasa
              ? 'En casa sale el estadio con el lema de abajo.'
              : destino
                ? `Fuera sale la ruta desde Zaragoza: ${destino.km} km${destino.nota ? '' : ` y unas ${horasCoche(destino.km)} h en coche`} (datos de la página On Tour).`
                : 'Este partido no está entre los desplazamientos de liga de la página On Tour: la ruta sale sin km.'}
          </p>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">Pastilla de arriba<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} /></label>
          {enCasa && <label className="graficos-campo">Lema (en casa)<input value={datos.lema} onChange={e => cambiar({ lema: e.target.value })} placeholder="Vacío, no sale" /></label>}
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <p className="graficos-nota">La foto va arriba y se funde con el azul (el estadio, la afición o un jugador).</p>
      </form>
    </div>
  )
}
