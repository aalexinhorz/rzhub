import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoPorPartido } from '../../lib/graficoDatoJugador'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Por partido": hasta 8 filas con el escudo del rival, "VS RIVAL"
// y un valor grande (minutos, goles, nota…). Los minutos de un jugador del
// Real Zaragoza se pueden rellenar solos con las alineaciones guardadas
// (desde la jornada 9); el resto se escribe a mano.
const FILA = { rival: '', texto: '', valor: '' }
const INICIAL = {
  tema: 'claro', titulo: 'Minutos jugados', subtitulo: '', sufijo: "'", seccion: 'Ránking', nota: '',
  filas: Array.from({ length: 8 }, () => ({ ...FILA })), credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}

// "Real Jaén CF" → "Jaén", "Villarreal CF B" → "Villarreal B".
const FUERA = new Set(['CF', 'CD', 'SD', 'UD', 'FC', 'AD', 'UE', 'CE', 'CDJ', 'Club', 'de'])
function rivalCorto(nombre) {
  let p = (nombre || '').replace(/["“”]/g, '').split(/\s+/).filter(w => !FUERA.has(w))
  if (p[0] === 'Real' && p.length > 1 && p[1] !== 'Madrid') p = p.slice(1)
  if (p[0] === 'Juventud') p = ['Torremolinos']
  if (p[0] === 'Gimnàstic') p = ['Nàstic']
  return p.join(' ')
}

// Minutos de un jugador en un partido a partir de la alineación guardada.
function minutosDe(alineacion, id) {
  if (!alineacion) return null
  const cambios = alineacion.cambios || []
  if ((alineacion.titulares || []).map(Number).includes(id)) {
    const sale = cambios.find(c => Number(c.sale) === id)
    return sale ? Number(sale.minuto) : 90
  }
  const entra = cambios.find(c => Number(c.entra) === id)
  return entra ? Math.max(1, 90 - Number(entra.minuto)) : 0
}

export default function GraficoPorPartido({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_por_partido', INICIAL))
  useGuardarLocal('redaccion_grafico_por_partido', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const equipos = useEquiposGraficos()
  const [jugadores, setJugadores] = useState([])
  const [jugadorId, setJugadorId] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    supabase.from('players').select('id, name, short_name').eq('is_zaragoza', true).order('name')
      .then(({ data }) => setJugadores(data || []))
  }, [])

  // Escudos de cada fila.
  const claveRivales = datos.filas.map(f => f.rival).join('|')
  const [escudos, setEscudos] = useState({ clave: '', lista: [] })
  useEffect(() => {
    let activo = true
    const rivales = claveRivales.split('|')
    Promise.all(rivales.map(r => {
      if (!r) return null
      const src = escudoDe(r) || equipos.find(e => e.nombre === r)?.escudo
      return src ? cargarImagen(encodeURI(src)) : null
    })).then(lista => { if (activo) setEscudos({ clave: claveRivales, lista }) })
    return () => { activo = false }
  }, [claveRivales, equipos])

  const filasDibujo = datos.filas.map(f => ({
    texto: f.texto || (f.rival ? `vs ${rivalCorto(f.rival)}` : ''),
    valor: f.valor === '' ? '' : `${f.valor}${datos.sufijo || ''}`,
    vacia: f.valor !== '' && Number(f.valor) === 0,
  }))
  const recursos = useMemo(() => ({ foto, logo, escudos: escudos.clave === claveRivales ? escudos.lista : [] }), [foto, logo, escudos, claveRivales])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoPorPartido(contextoGrafico(c), { ...datos, filas: filasDibujo }, recursos)
  }) // tras cada render: dibujar es barato

  const cambiarFila = (i, c) => cambiar({ filas: datos.filas.map((f, j) => (j === i ? { ...f, ...c } : f)) })

  // Minutos del jugador en los últimos 8 partidos jugados (del más antiguo al último).
  const rellenarMinutos = async () => {
    const j = jugadores.find(x => String(x.id) === jugadorId)
    if (!j) return
    const { data } = await supabase.from('porra_partidos').select('rival, kickoff, alineacion')
      .eq('finalizado', true).order('kickoff', { ascending: false }).limit(8)
    const lista = (data || []).reverse()
    const sinOnce = lista.filter(p => !p.alineacion).length
    const filas = lista.map(p => {
      const m = minutosDe(p.alineacion, Number(j.id))
      return { rival: p.rival, texto: '', valor: m == null ? '' : String(m) }
    })
    while (filas.length < 8) filas.push({ ...FILA })
    const corto = j.short_name || j.name.split(' ').at(-1)
    cambiar({ filas, sufijo: "'", titulo: 'Minutos jugados', subtitulo: datos.subtitulo || `${corto} en los últimos partidos` })
    setAviso(sinOnce ? `${sinOnce} de esos partidos no tienen la alineación guardada (antes de la jornada 9): rellena sus minutos a mano.` : '')
  }

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-${slug(`${datos.titulo} ${datos.subtitulo}`)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Rellenar solo</legend>
          <div className="graficos-fila graficos-fila--equipo">
            <label className="graficos-campo">
              Minutos de
              <select value={jugadorId} onChange={e => setJugadorId(e.target.value)}>
                <option value="">— Elige un jugador —</option>
                {jugadores.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </label>
            <button type="button" className="graficos-mini-boton" disabled={!jugadorId} onClick={rellenarMinutos}>Rellenar</button>
          </div>
          <p className={`graficos-nota${aviso ? ' graficos-nota--aviso' : ''}`}>{aviso || 'Pone los minutos de ese jugador en los últimos 8 partidos. También puedes escribir las filas a mano (goles, notas, lo que quieras).'}</p>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">Título<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} /></label>
          <label className="graficos-campo">Subtítulo<input value={datos.subtitulo} onChange={e => cambiar({ subtitulo: e.target.value })} placeholder="Jardí en los últimos partidos" /></label>
          <div className="graficos-fila">
            <label className="graficos-campo">Detrás de cada valor<input value={datos.sufijo} onChange={e => cambiar({ sufijo: e.target.value })} placeholder="' para minutos, vacío para nada" /></label>
            <label className="graficos-campo">
              Tema
              <select value={datos.tema} onChange={e => cambiar({ tema: e.target.value })}>
                <option value="claro">Claro</option>
                <option value="azul">Azul</option>
              </select>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Filas (hasta 8)</legend>
          <datalist id="por-partido-rivales">{equipos.map(e => <option key={e.id} value={e.nombre} />)}</datalist>
          {datos.filas.map((f, i) => (
            <div key={i} className="graficos-fila">
              <label className="graficos-campo">Rival {i + 1}<input list="por-partido-rivales" value={f.rival} onChange={e => cambiarFila(i, { rival: e.target.value })} /></label>
              <label className="graficos-campo">Texto<input value={f.texto} placeholder={f.rival ? `vs ${rivalCorto(f.rival)}` : 'vs Rival'} onChange={e => cambiarFila(i, { texto: e.target.value })} /></label>
              <label className="graficos-campo graficos-campo--valor">Valor<input value={f.valor} onChange={e => cambiarFila(i, { valor: e.target.value })} /></label>
            </div>
          ))}
          <p className="graficos-nota">Con valor 0 la fila sale en gris. Las filas vacías no salen.</p>
        </fieldset>
        <fieldset>
          <legend>Abajo</legend>
          <label className="graficos-campo">Sección<input value={datos.seccion} onChange={e => cambiar({ seccion: e.target.value })} placeholder="Ránking, El dato…" /></label>
          <label className="graficos-campo">Nota<textarea rows={2} value={datos.nota} onChange={e => cambiar({ nota: e.target.value })} placeholder="Jardí no ha completado ningún partido desde…" /></label>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
