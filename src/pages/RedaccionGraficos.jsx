import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import SEO from '../components/SEO'
import { ESCUDOS_CLUBS, ESCUDO_ZARAGOZA, getEscudo } from '../lib/escudos'
import { colorDeEscudo } from '../lib/colorEscudo'
import { cargarProximoYUltimo } from '../lib/partidoActual'
import { ANCHO, ALTO, PANEL_X, cargarFuentes, dibujarGraficoStats, encajeFoto } from '../lib/graficoStats'
import './RedaccionGraficos.css'

// Herramienta privada (redactores) para hacer el gráfico de estadísticas
// de un jugador: se sube la foto desde el móvil, se rellenan los textos y
// se descarga el PNG listo para redes. El borrador (sin la foto) se guarda
// en el navegador.

const CLAVE_BORRADOR = 'redaccion_grafico_stats'
const COLOR_ZARAGOZA = '#0045bf'
const STAT_VACIA = { valor: '', etiqueta: '', destacado: false, textoDestacado: 'TOP 1\nDEL EQUIPO' }

const INICIAL = {
  nombre: '',
  apellido: '',
  credito: 'FOTO: ',
  local: 'Real Zaragoza',
  visitante: '',
  colorLocal: COLOR_ZARAGOZA,
  colorVisitante: '#ffe667',
  ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
  stats: [{ ...STAT_VACIA }, { ...STAT_VACIA }, { ...STAT_VACIA }, { ...STAT_VACIA }],
}

const EQUIPOS = [...new Set(['Real Zaragoza', ...Object.keys(ESCUDOS_CLUBS)])].sort((a, b) => a.localeCompare(b, 'es'))
// El escudo del Real Zaragoza no está en ESCUDOS_CLUBS (va en su propia constante).
const escudoDe = nombre => (nombre === 'Real Zaragoza' ? ESCUDO_ZARAGOZA : getEscudo(nombre))

function leerBorrador() {
  try { return JSON.parse(localStorage.getItem(CLAVE_BORRADOR)) || null } catch { return null }
}

function cargarImagen(src) {
  return new Promise(resolve => {
    if (!src) { resolve(null); return }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

const slug = t => (t || 'grafico').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export default function RedaccionGraficos() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const arrastre = useRef(null)
  const [datos, setDatos] = useState(() => ({ ...INICIAL, ...leerBorrador() }))
  const [foto, setFoto] = useState(null)
  const [escudos, setEscudos] = useState({ local: null, visitante: null })
  const [logo, setLogo] = useState(null)
  const [fuentesListas, setFuentesListas] = useState(false)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (profile && !profile.es_redactor) navigate('/')
  }, [user, profile, loading, navigate])

  useEffect(() => {
    cargarFuentes().then(() => setFuentesListas(true))
    cargarImagen('/LOGO_RZHUB.webp').then(setLogo)
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
    dibujarGraficoStats(canvas.getContext('2d'), datos, recursos)
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

  const generarBlob = useCallback(() => new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png')), [])
  const nombreArchivo = `rzhub-${slug(datos.apellido)}.png`

  const descargar = async () => {
    const blob = await generarBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const compartir = async () => {
    const blob = await generarBlob()
    const archivo = new File([blob], nombreArchivo, { type: 'image/png' })
    try {
      if (navigator.canShare?.({ files: [archivo] })) await navigator.share({ files: [archivo] })
      else { await descargar(); setAviso('Tu navegador no deja compartir: se ha descargado.') }
    } catch { /* cancelado */ }
  }

  const empezarDeCero = () => {
    if (!window.confirm('¿Vaciar todos los campos?')) return
    setFoto(null)
    setDatos({ ...INICIAL, colorLocal: COLOR_ZARAGOZA, colorVisitante: null })
  }

  if (loading || !user || !profile?.es_redactor) return <div className="graficos-page" />

  return (
    <div className="graficos-page">
      <SEO title="Gráficos | RZ Hub" description="Herramienta interna de gráficos." path="/redaccion-graficos" noindex />
      <div className="graficos-cabecera">
        <h1>Gráfico de estadísticas</h1>
        <p>Sube la foto, rellena los datos y descárgalo. Arrastra la foto en la vista previa para encuadrarla.</p>
      </div>

      <div className="graficos-cuerpo">
        <div className="graficos-vista">
          <canvas
            ref={canvasRef} width={ANCHO} height={ALTO} className="graficos-canvas"
            onPointerDown={empezarArrastre} onPointerMove={arrastrar} onPointerUp={soltar} onPointerCancel={soltar}
          />
          <div className="graficos-acciones">
            <button type="button" className="rz-btn rz-btn--primary" onClick={descargar}>Descargar PNG</button>
            <button type="button" className="rz-btn rz-btn--ghost" onClick={compartir}>Compartir</button>
          </div>
          {aviso && <p className="graficos-aviso">{aviso}</p>}
        </div>

        <form className="graficos-form" onSubmit={e => e.preventDefault()}>
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
            <datalist id="graficos-equipos">
              {EQUIPOS.map(e => <option key={e} value={e} />)}
            </datalist>
            {[['local', 'colorLocal', 'Local'], ['visitante', 'colorVisitante', 'Visitante']].map(([campo, campoColor, texto]) => (
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
    </div>
  )
}
