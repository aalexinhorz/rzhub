import { useState, useEffect, useCallback, useMemo } from 'react'
import { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import usePlayers from '../hooks/usePlayers'
import './Zaragozle.css'

// Día en el que se lanzó el juego — el número de puzzle (#1, #2...) se
// cuenta a partir de aquí, uno más cada día, como en el Wordle real.
const LANZAMIENTO = '2026-09-14'

// Solo jugadores con is_zaragoza=true (de momento nada de vocabulario
// genérico de fútbol/afición). La palabra es el apellido/nombre corto
// de cada uno, en mayúsculas y sin acentos; para los que tienen un
// short_name "roto" en Supabase (con espacio, punto o igual al nombre
// completo) se usa a mano una versión limpia de una sola palabra. El
// id enlaza con la tabla players para poder enseñar su foto al acabar.
// Como cada jugador tiene un nombre de longitud distinta, el tablero
// se adapta cada día al largo de esa palabra (no siempre son 5 letras,
// a diferencia del Wordle original) — es el precio de tematizar solo
// con la plantilla en vez de con vocabulario genérico.
const PALABRAS = [
  { id: 39, palabra: 'ANARTZ' },
  { id: 56, palabra: 'ANDER' },
  { id: 17, palabra: 'BARRACHINA' },
  { id: 16, palabra: 'BERRAR' },
  { id: 34, palabra: 'CUENCA' },
  { id: 199, palabra: 'GARCIA' },
  { id: 197, palabra: 'GONZALEZ' },
  { id: 85, palabra: 'MONZON' },
  { id: 194, palabra: 'ESPIAU' },
  { id: 83, palabra: 'FACCHIN' },
  { id: 48, palabra: 'PINILLA' },
  { id: 81, palabra: 'VADILLO' },
  { id: 82, palabra: 'TOBAJAS' },
  { id: 37, palabra: 'JARDI' },
  { id: 433, palabra: 'DELGADO' },
  { id: 72, palabra: 'GABILONDO' },
  { id: 84, palabra: 'FRANCO' },
  { id: 388, palabra: 'LAKEN' },
  { id: 198, palabra: 'LALO' },
  { id: 26, palabra: 'TERRER' },
  { id: 463, palabra: 'SANGALLI' },
  { id: 387, palabra: 'MANOLACHE' },
  { id: 183, palabra: 'URENA' },
  { id: 43, palabra: 'SANS' },
  { id: 40, palabra: 'ADEMO' },
  { id: 41, palabra: 'PEREIRA' },
  { id: 38, palabra: 'DIEZ' },
  { id: 435, palabra: 'IRANZO' },
  { id: 25, palabra: 'SAIDU' },
  { id: 18, palabra: 'RUBIO' },
  { id: 185, palabra: 'WESTERVELD' },
  { id: 175, palabra: 'ESCUDERO' },
  { id: 7, palabra: 'TACHI' },
]

const FILAS_TECLADO = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BORRAR'],
]

function fechaHoyMadrid() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
}

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

function numeroPuzzle(fechaStr) {
  const dias = Math.round((new Date(`${fechaStr}T00:00:00Z`) - new Date(`${LANZAMIENTO}T00:00:00Z`)) / 86400000)
  return Math.max(1, dias + 1)
}

// Algoritmo estándar de Wordle: primero se marcan los aciertos exactos
// y se "consumen" esas letras del objetivo; solo después se buscan las
// letras presentes en otra posición entre las que quedan sin consumir.
// Así una letra repetida en el intento pero una sola vez en el objetivo
// no se marca "presente" dos veces.
function evaluarIntento(objetivo, intento) {
  const resultado = Array(intento.length).fill('ausente')
  const disponibles = [...objetivo]

  for (let i = 0; i < intento.length; i++) {
    if (intento[i] === objetivo[i]) {
      resultado[i] = 'correcta'
      disponibles[i] = null
    }
  }
  for (let i = 0; i < intento.length; i++) {
    if (resultado[i] === 'correcta') continue
    const idx = disponibles.indexOf(intento[i])
    if (idx !== -1) {
      resultado[i] = 'presente'
      disponibles[idx] = null
    }
  }
  return resultado
}

const EMOJI_ESTADO = { correcta: '🟩', presente: '🟨', ausente: '⬛' }

function Tecla({ letra, estado, onClick }) {
  const esAncha = letra === 'ENTER' || letra === 'BORRAR'
  return (
    <button
      type="button"
      className={`zaragozle-tecla${esAncha ? ' es-ancha' : ''}${estado ? ` es-${estado}` : ''}`}
      onClick={() => onClick(letra)}
    >
      {letra === 'BORRAR' ? '⌫' : letra === 'ENTER' ? 'ENTER' : letra}
    </button>
  )
}

export default function Zaragozle() {
  const { players } = usePlayers()
  const fecha = fechaHoyMadrid()
  const puzzle = numeroPuzzle(fecha)
  const storageKey = `zaragozle_${fecha}`

  const entradaDia = useMemo(() => PALABRAS[hashString(fecha) % PALABRAS.length], [fecha])
  const objetivo = entradaDia.palabra
  const LARGO = objetivo.length
  // Una palabra larga (Westerveld, Barrachina...) merece algún intento
  // extra — el Wordle real siempre da 6 porque siempre son 5 letras,
  // pero aquí el largo varía según el jugador que toque ese día.
  const INTENTOS_MAX = Math.max(6, LARGO - 3)
  const jugadorObjetivo = players.find(p => p.id === `db_${entradaDia.id}`) || null

  const [intentos, setIntentos] = useState([]) // [{letras, resultado}]
  const [actual, setActual] = useState('')
  const [estadoPartida, setEstadoPartida] = useState('jugando') // jugando | ganado | perdido
  const [sacudir, setSacudir] = useState(false)
  const [aviso, setAviso] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const guardado = localStorage.getItem(storageKey)
    if (!guardado) return
    try {
      const datos = JSON.parse(guardado)
      setIntentos(datos.intentos || [])
      setEstadoPartida(datos.estado || 'jugando')
    } catch { /* localStorage corrupto: se ignora y se empieza de cero */ }
  }, [storageKey])

  function guardar(nuevosIntentos, nuevoEstado) {
    localStorage.setItem(storageKey, JSON.stringify({ intentos: nuevosIntentos, estado: nuevoEstado }))
  }

  const enviarIntento = useCallback(() => {
    if (estadoPartida !== 'jugando') return
    if (actual.length !== LARGO) {
      setAviso(`La palabra tiene ${LARGO} letras`)
      setSacudir(true)
      setTimeout(() => setSacudir(false), 500)
      setTimeout(() => setAviso(''), 1500)
      return
    }
    const resultado = evaluarIntento(objetivo, actual)
    const fila = { letras: actual, resultado }
    const nuevosIntentos = [...intentos, fila]
    setIntentos(nuevosIntentos)
    setActual('')

    let nuevoEstado = 'jugando'
    if (actual === objetivo) nuevoEstado = 'ganado'
    else if (nuevosIntentos.length >= INTENTOS_MAX) nuevoEstado = 'perdido'
    setEstadoPartida(nuevoEstado)
    guardar(nuevosIntentos, nuevoEstado)
  }, [actual, estadoPartida, intentos, objetivo, storageKey])

  const pulsarTecla = useCallback((tecla) => {
    if (estadoPartida !== 'jugando') return
    if (tecla === 'ENTER') { enviarIntento(); return }
    if (tecla === 'BORRAR') { setActual(a => a.slice(0, -1)); return }
    setActual(a => (a.length < LARGO ? a + tecla : a))
  }, [estadoPartida, enviarIntento])

  // Teclado físico: mismas teclas que el teclado en pantalla.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tecla = e.key.toUpperCase()
      if (tecla === 'ENTER') { pulsarTecla('ENTER'); return }
      if (tecla === 'BACKSPACE') { pulsarTecla('BORRAR'); return }
      if (/^[A-ZÑ]$/.test(tecla)) pulsarTecla(tecla)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pulsarTecla])

  // Mejor estado conocido de cada letra, para colorear el teclado
  // (verde > amarillo > gris, nunca se "degrada" una letra ya en verde).
  const estadoLetras = useMemo(() => {
    const mapa = {}
    const prioridad = { ausente: 0, presente: 1, correcta: 2 }
    intentos.forEach(({ letras, resultado }) => {
      letras.split('').forEach((letra, i) => {
        if (!mapa[letra] || prioridad[resultado[i]] > prioridad[mapa[letra]]) mapa[letra] = resultado[i]
      })
    })
    return mapa
  }, [intentos])

  function compartir() {
    const cabecera = `Zaragozle #${puzzle} — ${estadoPartida === 'ganado' ? `${intentos.length}/${INTENTOS_MAX}` : 'X/' + INTENTOS_MAX}`
    const grid = intentos.map(({ resultado }) => resultado.map(r => EMOJI_ESTADO[r]).join('')).join('\n')
    const texto = `${cabecera}\n${grid}\n${SITE_URL}/zaragozle`
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  const filasVacias = Math.max(0, INTENTOS_MAX - intentos.length - (estadoPartida === 'jugando' ? 1 : 0))

  return (
    <div className="zaragozle-page">
      <div className="zaragozle-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow zaragozle-page__eyebrow">Puzzle diario · #{puzzle}</p>
        <h1 className="zaragozle-page__title">Zaragozle</h1>
        <p className="zaragozle-page__subtitle">El Wordle del Real Zaragoza. Adivina la palabra secreta en {INTENTOS_MAX} intentos.</p>
      </div>

      <div className="zaragozle-page__body">
        <div className="zaragozle-page__container">

          <div
            className={`zaragozle-tablero${sacudir ? ' es-sacudida' : ''}`}
            style={{ '--largo': LARGO, maxWidth: `${Math.min(420, LARGO * 58)}px` }}
          >
            {intentos.map((fila, fi) => (
              <div className="zaragozle-fila" key={fi}>
                {fila.letras.split('').map((letra, i) => (
                  <span key={i} className={`zaragozle-casilla es-${fila.resultado[i]}`} style={{ animationDelay: `${i * 80}ms` }}>
                    {letra}
                  </span>
                ))}
              </div>
            ))}

            {estadoPartida === 'jugando' && (
              <div className="zaragozle-fila">
                {Array.from({ length: LARGO }).map((_, i) => (
                  <span key={i} className={`zaragozle-casilla${actual[i] ? ' es-escrita' : ''}`}>
                    {actual[i] || ''}
                  </span>
                ))}
              </div>
            )}

            {Array.from({ length: filasVacias }).map((_, fi) => (
              <div className="zaragozle-fila" key={`vacia-${fi}`}>
                {Array.from({ length: LARGO }).map((_, i) => <span key={i} className="zaragozle-casilla" />)}
              </div>
            ))}
          </div>

          {aviso && <p className="zaragozle-aviso">{aviso}</p>}

          {estadoPartida !== 'jugando' && (
            <div className={`zaragozle-resultado${estadoPartida === 'ganado' ? ' es-ganado' : ' es-perdido'}`}>
              <span className="zaragozle-resultado__titulo">
                {estadoPartida === 'ganado' ? '¡Lo has adivinado!' : 'Se acabaron los intentos'}
              </span>
              <span className="zaragozle-resultado__palabra">{objetivo}</span>
              {jugadorObjetivo && (
                <div className="zaragozle-resultado__jugador">
                  <img src={jugadorObjetivo.photo} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                  <span>{jugadorObjetivo.name}</span>
                </div>
              )}
              <button type="button" className="rz-btn rz-btn--primary" onClick={compartir}>
                {copiado ? '✓ ¡Copiado!' : '📋 Compartir resultado'}
              </button>
              <p className="zaragozle-resultado__vuelve">Vuelve mañana para una nueva palabra.</p>
            </div>
          )}

          {estadoPartida === 'jugando' && (
            <div className="zaragozle-teclado">
              {FILAS_TECLADO.map((fila, i) => (
                <div className="zaragozle-teclado__fila" key={i}>
                  {fila.map(letra => (
                    <Tecla key={letra} letra={letra} estado={estadoLetras[letra]} onClick={pulsarTecla} />
                  ))}
                </div>
              ))}
            </div>
          )}

        </div>
        <Footer />
      </div>
    </div>
  )
}
