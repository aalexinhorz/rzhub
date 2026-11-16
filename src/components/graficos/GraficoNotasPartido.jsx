import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoNotasPartido } from '../../lib/graficoNotasPartido'
import { useImagenesPartido } from '../../lib/graficosPartidos'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import { colorEquipo } from '../../lib/colorEscudo'
import { AZUL } from '../../lib/graficosTexto'
import { nombresPartido } from '../../lib/partidoSeo'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Las notas del partido": para anunciar que se abren las notas
// de un partido jugado. Marcador y escudos salen solos del partido; la caja
// del rival toma el color de su escudo (se puede cambiar).
const INICIAL = { partidoId: '', titulo: 'Las notas del partido', colorRival: '', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 } }
const SIN_COLOR = 'rgba(255,255,255,0.16)'

export default function GraficoNotasPartido({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_notas_partido', INICIAL))
  useGuardarLocal('redaccion_grafico_notas_partido', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const [partidos, setPartidos] = useState([])

  useEffect(() => {
    supabase.from('porra_partidos').select('id, rival, sede, jornada, competicion, goles_zaragoza, goles_rival, kickoff')
      .eq('finalizado', true).order('kickoff', { ascending: false }).limit(30)
      .then(({ data }) => setPartidos(data || []))
  }, [])

  const p = partidos.find(x => String(x.id) === datos.partidoId) || partidos[0] || null
  const { local, visitante, zaragozaLocal } = p ? nombresPartido(p) : { local: '', visitante: '', zaragozaLocal: true }
  const competicion = p?.competicion ? p.competicion.split(' · ')[0] : 'Primera Federación'
  const imgs = useImagenesPartido(local, visitante, competicion)
  const escudoRival = zaragozaLocal ? imgs.escudoVisitante : imgs.escudoLocal
  const colorAuto = useMemo(() => (escudoRival ? colorEquipo(escudoRival) : null), [escudoRival])
  const colorRival = datos.colorRival || colorAuto || SIN_COLOR

  const recursos = useMemo(() => ({ foto, logo, ...imgs }), [foto, logo, imgs])
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    dibujarGraficoNotasPartido(contextoGrafico(c), {
      ...datos,
      golesLocal: p ? (zaragozaLocal ? p.goles_zaragoza : p.goles_rival) : '',
      golesVisitante: p ? (zaragozaLocal ? p.goles_rival : p.goles_zaragoza) : '',
      colorLocal: zaragozaLocal ? AZUL : colorRival,
      colorVisitante: zaragozaLocal ? colorRival : AZUL,
    }, recursos)
  }) // tras cada render: dibujar es barato

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-notas-${slug(`${local} ${visitante}`)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Partido</legend>
          <label className="graficos-campo">
            Partido jugado
            <select value={p ? String(p.id) : ''} onChange={e => cambiar({ partidoId: e.target.value, colorRival: '' })}>
              {partidos.map(x => {
                const n = nombresPartido(x)
                return <option key={x.id} value={x.id}>{n.local} {x.sede === 'local' ? x.goles_zaragoza : x.goles_rival}-{x.sede === 'local' ? x.goles_rival : x.goles_zaragoza} {n.visitante} ({x.competicion ? 'Copa' : `J${x.jornada}`})</option>
              })}
            </select>
          </label>
          <div className="graficos-fila graficos-fila--equipo">
            <label className="graficos-campo graficos-campo--color">
              Color rival
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(colorRival) ? colorRival : '#ffffff'} onChange={e => cambiar({ colorRival: e.target.value })} />
            </label>
            {datos.colorRival && <button type="button" className="graficos-mini-boton" onClick={() => cambiar({ colorRival: '' })}>Color automático</button>}
          </div>
          <p className="graficos-nota">La caja del rival coge sola el color de su escudo; cámbialo si no te convence.</p>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">Título<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} /></label>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <p className="graficos-nota">El crédito sale debajo del título como «FOTO: NOMBRE».</p>
      </form>
    </div>
  )
}
