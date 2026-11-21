import { useEffect, useMemo, useRef, useState } from 'react'
import { ESCUDOS_CLUBS } from '../../lib/escudos'
import { colorDeEscudo } from '../../lib/colorEscudo'
import { cargarProximoYUltimo } from '../../lib/partidoActual'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, PANEL_X, dibujarGraficoStats, encajeFoto } from '../../lib/graficoStats'
import { supabase } from '../../hooks/useAuth'
import AccionesGrafico from './AccionesGrafico'

// Plantilla "Estadísticas de jugador": se sube la foto desde el móvil, se
// rellenan los textos y se descarga el PNG. El borrador (sin la foto) se
// guarda en el navegador.

const CLAVE_BORRADOR = 'redaccion_grafico_stats'
const COLOR_ZARAGOZA = '#0045bf'
const STAT_VACIA = { valor: '', etiqueta: '', destacado: false, textoDestacado: 'TOP 1\nDEL EQUIPO' }

const INICIAL = {
  nombre: '',
  apellido: '',
  credito: 'FOTO: ',
  mostrarPartido: true,
  local: 'Real Zaragoza',
  visitante: '',
  colorLocal: COLOR_ZARAGOZA,
  colorVisitante: '#ffe667',
  ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
  stats: [{ ...STAT_VACIA }, { ...STAT_VACIA }, { ...STAT_VACIA }, { ...STAT_VACIA }],
}

const EQUIPOS = [...new Set(['Real Zaragoza', ...Object.keys(ESCUDOS_CLUBS)])].sort((a, b) => a.localeCompare(b, 'es'))

function leerBorrador() {
  try { return JSON.parse(localStorage.getItem(CLAVE_BORRADOR)) || null } catch { return null }
}

// "4/6 (67%)" → "4/6" o "67%"; el resto tal cual.
function valorStat(v, porcentaje) {
  const m = String(v).match(/^(.+?)\s*\((\d+%)\)$/)
  if (!m) return String(v)
  return porcentaje ? m[2] : m[1]
}
const fechaCorta = f => `${f.slice(8, 10)}/${f.slice(5, 7)}`

// Estadísticas individuales de Flashscore (tabla stats_jugador_partido):
// se elige jugador y partido y se marcan hasta 4.
function DesdeFlashscore({ onAplicar }) {
  const [filas, setFilas] = useState(null)
  const [nombres, setNombres] = useState({})
  const [jugador, setJugador] = useState('')
  const [partidoId, setPartidoId] = useState('')
  const [marcadas, setMarcadas] = useState([])
  const [porcentaje, setPorcentaje] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('stats_jugador_partido').select('id, player_id, nombre_flashscore, fecha, rival, sede, goles_zaragoza, goles_rival, minutos, rating, posicion, stats').order('fecha', { ascending: false }),
      supabase.from('players').select('id, name').eq('is_zaragoza', true),
    ]).then(([{ data }, { data: js }]) => {
      setFilas(data || [])
      setNombres(Object.fromEntries((js || []).map(j => [j.id, j.name])))
    })
  }, [])

  const claveDe = f => (f.player_id ? `p${f.player_id}` : `f${f.nombre_flashscore}`)
  const nombreDe = f => nombres[f.player_id] || f.nombre_flashscore
  const jugadores = useMemo(() => {
    const vistos = new Map()
    for (const f of filas || []) if (!vistos.has(claveDe(f))) vistos.set(claveDe(f), nombreDe(f))
    return [...vistos].sort((a, b) => a[1].localeCompare(b[1], 'es'))
  }, [filas, nombres]) // eslint-disable-line react-hooks/exhaustive-deps
  const partidos = (filas || []).filter(f => claveDe(f) === jugador)
  const fila = partidos.find(f => String(f.id) === partidoId)
  const lista = fila ? [
    ...(fila.rating ? [{ seccion: 'Partido', etiqueta: 'Rating Flashscore', valor: String(fila.rating) }] : []),
    { seccion: 'Partido', etiqueta: 'Minutos jugados', valor: `${fila.minutos}'` },
    ...(fila.stats || []),
  ] : []
  const clave = s => `${s.seccion}|${s.etiqueta}`

  const aplicar = (f, claves, pct) => {
    const elegidas = claves.map(k => [...(f.rating ? [{ seccion: 'Partido', etiqueta: 'Rating Flashscore', valor: String(f.rating) }] : []), { seccion: 'Partido', etiqueta: 'Minutos jugados', valor: `${f.minutos}'` }, ...(f.stats || [])].find(s => clave(s) === k)).filter(Boolean)
    const nombre = nombreDe(f)
    const partes = nombre.split(/\s+/)
    onAplicar({
      nombre: partes.length > 1 ? partes[0] : '',
      apellido: partes.length > 1 ? partes.slice(1).join(' ') : nombre,
      partido: f,
      stats: elegidas.map(s => ({ valor: valorStat(s.valor, pct), etiqueta: s.etiqueta.replace(' (xG)', '').replace(' (xA)', '').replace(' (xGOT)', '') })),
    })
  }

  const elegirPartido = id => {
    setPartidoId(id)
    setMarcadas([])
    const f = partidos.find(x => String(x.id) === id)
    if (f) aplicar(f, [], porcentaje)
  }
  const marcar = k => {
    const nuevas = marcadas.includes(k) ? marcadas.filter(x => x !== k) : marcadas.length < 4 ? [...marcadas, k] : marcadas
    setMarcadas(nuevas)
    if (fila) aplicar(fila, nuevas, porcentaje)
  }
  const cambiarPorcentaje = v => {
    setPorcentaje(v)
    if (fila) aplicar(fila, marcadas, v)
  }

  if (filas && !filas.length) return null
  const secciones = [...new Set(lista.map(s => s.seccion))]

  return (
    <fieldset>
      <legend>Desde Flashscore</legend>
      {!filas ? <p className="graficos-nota">Cargando…</p> : (
        <>
          <div className="graficos-fila">
            <label className="graficos-campo">
              Jugador
              <select value={jugador} onChange={e => { setJugador(e.target.value); setPartidoId(''); setMarcadas([]) }}>
                <option value="">— Elige —</option>
                {jugadores.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
              </select>
            </label>
            <label className="graficos-campo">
              Partido
              <select value={partidoId} disabled={!jugador} onChange={e => elegirPartido(e.target.value)}>
                <option value="">— Elige —</option>
                {partidos.map(f => (
                  <option key={f.id} value={f.id}>
                    {`${fechaCorta(f.fecha)} · ${f.sede === 'local' ? `Real Zaragoza ${f.goles_zaragoza}-${f.goles_rival} ${f.rival}` : `${f.rival} ${f.goles_rival}-${f.goles_zaragoza} Real Zaragoza`} (${f.minutos}')`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {fila && (
            <>
              <p className="graficos-nota">Marca hasta 4 ({marcadas.length}/4): salen en el orden en que las marques. {fila.posicion ? `${fila.posicion} · ` : ''}{fila.minutos}' jugados.</p>
              <label className="graficos-check">
                <input type="checkbox" checked={porcentaje} onChange={e => cambiarPorcentaje(e.target.checked)} />
                Poner el porcentaje en vez de «aciertos/intentos»
              </label>
              <div className="graficos-flashscore">
                {secciones.map(sec => (
                  <div key={sec} className="graficos-flashscore__seccion">
                    <h4>{sec}</h4>
                    {lista.filter(s => s.seccion === sec).map(s => {
                      const k = clave(s)
                      const orden = marcadas.indexOf(k)
                      return (
                        <label key={k} className={`graficos-flashscore__stat${orden >= 0 ? ' es-marcada' : ''}`}>
                          <input type="checkbox" checked={orden >= 0} disabled={orden < 0 && marcadas.length >= 4} onChange={() => marcar(k)} />
                          <span>{s.etiqueta}</span>
                          <b>{s.valor}</b>
                          {orden >= 0 && <i>{orden + 1}</i>}
                        </label>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </fieldset>
  )
}

export default function GraficoEstadisticas({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const arrastre = useRef(null)
  const [datos, setDatos] = useState(() => ({ ...INICIAL, ...leerBorrador() }))
  const [foto, setFoto] = useState(null)
  const [escudos, setEscudos] = useState({ local: null, visitante: null })

  useEffect(() => {
    // Sin borrador: los escudos del último partido del Real Zaragoza.
    if (!leerBorrador()) {
      cargarProximoYUltimo('rival, sede').then(({ ultimo }) => {
        if (!ultimo) return
        setDatos(d => (ultimo.sede === 'local'
          ? { ...d, local: 'Real Zaragoza', visitante: ultimo.rival, colorLocal: COLOR_ZARAGOZA, colorVisitante: null }
          : { ...d, local: ultimo.rival, visitante: 'Real Zaragoza', colorLocal: null, colorVisitante: COLOR_ZARAGOZA }))
      })
    }
  }, [])

  // Escudos; el color del recuadro sale del escudo si no se ha elegido.
  useEffect(() => {
    let activo = true
    Promise.all([cargarImagen(encodeURI(escudoDe(datos.local) || '')), cargarImagen(encodeURI(escudoDe(datos.visitante) || ''))])
      .then(([local, visitante]) => {
        if (!activo) return
        setEscudos({ local, visitante })
        setDatos(d => ({
          ...d,
          colorLocal: d.colorLocal || (d.local === 'Real Zaragoza' ? COLOR_ZARAGOZA : (local && colorDeEscudo(local)) || '#ffffff'),
          colorVisitante: d.colorVisitante || (d.visitante === 'Real Zaragoza' ? COLOR_ZARAGOZA : (visitante && colorDeEscudo(visitante)) || '#ffffff'),
        }))
      })
    return () => { activo = false }
  }, [datos.local, datos.visitante])

  // Borrador (sin foto).
  useEffect(() => {
    try { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos)) } catch { /* lleno o privado */ }
  }, [datos])

  const recursos = useMemo(() => ({ foto, logo, escudoLocal: escudos.local, escudoVisitante: escudos.visitante }), [foto, logo, escudos])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    dibujarGraficoStats(contextoGrafico(canvas), datos, recursos)
  }, [datos, recursos, fuentesListas])

  const cambiar = cambios => setDatos(d => ({ ...d, ...cambios }))
  const cambiarStat = (i, cambios) => setDatos(d => ({ ...d, stats: d.stats.map((s, j) => (j === i ? { ...s, ...cambios } : s)) }))
  const moverStat = (i, paso) => setDatos(d => {
    const stats = [...d.stats]
    const j = i + paso
    if (j < 0 || j >= stats.length) return d
    ;[stats[i], stats[j]] = [stats[j], stats[i]]
    return { ...d, stats }
  })

  const elegirFoto = e => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    cargarImagen(URL.createObjectURL(archivo)).then(img => {
      setFoto(img)
      cambiar({ ajusteFoto: { zoom: 1, dx: 0, dy: 0 } })
    })
  }

  // Arrastrar la foto en la vista previa para encuadrarla.
  const empezarArrastre = e => {
    if (!foto || e.nativeEvent.offsetX / e.currentTarget.clientWidth > PANEL_X / ANCHO) return
    e.currentTarget.setPointerCapture(e.pointerId)
    arrastre.current = { x: e.clientX, y: e.clientY, ...datos.ajusteFoto }
  }
  const arrastrar = e => {
    const a = arrastre.current
    if (!a || !foto) return
    const escala = ANCHO / e.currentTarget.clientWidth
    const dx = a.dx + (e.clientX - a.x) * escala
    const dy = a.dy + (e.clientY - a.y) * escala
    // Se guarda ya recortado a los bordes, para que al volver no haya "tramo muerto".
    const ef = encajeFoto(foto, a.zoom, dx, dy)
    cambiar({ ajusteFoto: { zoom: a.zoom, dx: ef.x - (PANEL_X - ef.w) / 2, dy: ef.y - (ALTO - ef.h) / 2 } })
  }
  const soltar = () => { arrastre.current = null }

  // Lo elegido en "Desde Flashscore": nombre, partido y estadísticas.
  const aplicarFlashscore = ({ nombre, apellido, partido, stats }) => setDatos(d => ({
    ...d, nombre, apellido,
    mostrarPartido: true,
    local: partido.sede === 'local' ? 'Real Zaragoza' : partido.rival,
    visitante: partido.sede === 'local' ? partido.rival : 'Real Zaragoza',
    colorLocal: partido.sede === 'local' ? COLOR_ZARAGOZA : null,
    colorVisitante: partido.sede === 'local' ? null : COLOR_ZARAGOZA,
    stats: [...stats.map(s => ({ ...STAT_VACIA, ...s })), STAT_VACIA, STAT_VACIA, STAT_VACIA, STAT_VACIA].slice(0, 4),
  }))

  const nombreArchivo = `rzhub-${slug(datos.apellido)}.jpg`

  const empezarDeCero = () => {
    if (!window.confirm('¿Vaciar todos los campos?')) return
    setFoto(null)
    setDatos({ ...INICIAL, colorLocal: COLOR_ZARAGOZA, colorVisitante: null })
  }

  return (
    <>
      <div className="graficos-cuerpo">
        <div className="graficos-vista">
          <canvas
            ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas"
            onPointerDown={empezarArrastre} onPointerMove={arrastrar} onPointerUp={soltar} onPointerCancel={soltar}
          />
          <AccionesGrafico canvasRef={canvasRef} nombreArchivo={nombreArchivo} />
        </div>

        <form className="graficos-form" onSubmit={e => e.preventDefault()}>
          <DesdeFlashscore onAplicar={aplicarFlashscore} />
          <fieldset>
            <legend>Foto</legend>
            <label className="graficos-archivo">
              <input type="file" accept="image/*" onChange={elegirFoto} />
              <span>{foto ? 'Cambiar foto' : 'Subir foto'}</span>
            </label>
            {foto && (
              <label className="graficos-campo">
                Zoom
                <input
                  type="range" min="1" max="3" step="0.01" value={datos.ajusteFoto.zoom}
                  onChange={e => cambiar({ ajusteFoto: { ...datos.ajusteFoto, zoom: Number(e.target.value) } })}
                />
              </label>
            )}
            <label className="graficos-campo">
              Crédito de la foto
              <input value={datos.credito} onChange={e => cambiar({ credito: e.target.value })} placeholder="FOTO: NOMBRE APELLIDO" />
            </label>
          </fieldset>

          <fieldset>
            <legend>Jugador</legend>
            <div className="graficos-fila">
              <label className="graficos-campo">
                Nombre (amarillo)
                <input value={datos.nombre} onChange={e => cambiar({ nombre: e.target.value })} placeholder="Pau" />
              </label>
              <label className="graficos-campo">
                Apellido (grande)
                <input value={datos.apellido} onChange={e => cambiar({ apellido: e.target.value })} placeholder="Sans" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Partido</legend>
            <label className="graficos-check">
              <input type="checkbox" checked={datos.mostrarPartido !== false} onChange={e => cambiar({ mostrarPartido: e.target.checked })} />
              Poner los escudos del partido
            </label>
            <datalist id="graficos-equipos">
              {EQUIPOS.map(e => <option key={e} value={e} />)}
            </datalist>
            {datos.mostrarPartido !== false && [['local', 'colorLocal', 'Local'], ['visitante', 'colorVisitante', 'Visitante']].map(([campo, campoColor, texto]) => (
              <div className="graficos-fila graficos-fila--equipo" key={campo}>
                <label className="graficos-campo">
                  {texto}
                  <input
                    list="graficos-equipos" value={datos[campo]}
                    onChange={e => cambiar({ [campo]: e.target.value, [campoColor]: e.target.value === 'Real Zaragoza' ? COLOR_ZARAGOZA : null })}
                  />
                </label>
                <label className="graficos-campo graficos-campo--color">
                  Fondo
                  <input type="color" value={datos[campoColor] || '#ffffff'} onChange={e => cambiar({ [campoColor]: e.target.value })} />
                </label>
              </div>
            ))}
          </fieldset>

          <fieldset>
            <legend>Estadísticas</legend>
            {datos.stats.map((s, i) => (
              <div className="graficos-stat" key={i}>
                <div className="graficos-fila">
                  <label className="graficos-campo graficos-campo--valor">
                    Valor
                    <input value={s.valor} onChange={e => cambiarStat(i, { valor: e.target.value })} placeholder="2/2" />
                  </label>
                  <label className="graficos-campo">
                    Etiqueta
                    <textarea rows={2} value={s.etiqueta} onChange={e => cambiarStat(i, { etiqueta: e.target.value })} placeholder="Regates completados" />
                  </label>
                </div>
                <div className="graficos-stat__pie">
                  <label className="graficos-check">
                    <input type="checkbox" checked={s.destacado} onChange={e => cambiarStat(i, { destacado: e.target.checked })} />
                    Medalla
                  </label>
                  {s.destacado && (
                    <input
                      className="graficos-medalla" value={s.textoDestacado.replace('\n', ' / ')}
                      onChange={e => cambiarStat(i, { textoDestacado: e.target.value.replace(/\s*\/\s*/, '\n') })}
                      title="Usa / para partir en dos líneas"
                    />
                  )}
                  <span className="graficos-stat__mover">
                    <button type="button" onClick={() => moverStat(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                    <button type="button" onClick={() => moverStat(i, 1)} disabled={i === datos.stats.length - 1} aria-label="Bajar">↓</button>
                  </span>
                </div>
              </div>
            ))}
            <p className="graficos-nota">Las estadísticas vacías no salen. Pulsa Intro en la etiqueta para cortar la línea donde quieras.</p>
          </fieldset>

          <button type="button" className="graficos-reset" onClick={empezarDeCero}>Empezar de cero</button>
        </form>
      </div>
    </>
  )
}
