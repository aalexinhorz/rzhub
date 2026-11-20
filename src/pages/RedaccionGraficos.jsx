import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import SEO from '../components/SEO'
import GraficoEstadisticas from '../components/graficos/GraficoEstadisticas'
import GraficoClasificacion from '../components/graficos/GraficoClasificacion'
import GraficoNoticia from '../components/graficos/GraficoNoticia'
import GraficoCalendario from '../components/graficos/GraficoCalendario'
import GraficoRankingJugadores from '../components/graficos/GraficoRankingJugadores'
import GraficoVersus from '../components/graficos/GraficoVersus'
import GraficoRankingEquipos from '../components/graficos/GraficoRankingEquipos'
import GraficoBarras from '../components/graficos/GraficoBarras'
import GraficoNovedad from '../components/graficos/GraficoNovedad'
import GraficoCaraACara from '../components/graficos/GraficoCaraACara'
import GraficoMercado from '../components/graficos/GraficoMercado'
import GraficoResultado from '../components/graficos/GraficoResultado'
import GraficoPrevia from '../components/graficos/GraficoPrevia'
import GraficoRival from '../components/graficos/GraficoRival'
import GraficoPorra from '../components/graficos/GraficoPorra'
import GraficoPartido from '../components/graficos/GraficoPartido'
import GraficoOnTour from '../components/graficos/GraficoOnTour'
import GraficoHorario from '../components/graficos/GraficoHorario'
import GraficoPortada from '../components/graficos/GraficoPortada'
import GraficoFinde from '../components/graficos/GraficoFinde'
import GraficoHerramienta from '../components/graficos/GraficoHerramienta'
import GraficoRivalCopa from '../components/graficos/GraficoRivalCopa'
import GraficoNotasPartido from '../components/graficos/GraficoNotasPartido'
import GraficoMiPrediccion from '../components/graficos/GraficoMiPrediccion'
import GraficoPorPartido from '../components/graficos/GraficoPorPartido'
import GraficoCarrusel from '../components/graficos/GraficoCarrusel'
import GraficoDato from '../components/graficos/GraficoDato'
import GraficoConvocatoria from '../components/graficos/GraficoConvocatoria'
import GraficoJugador from '../components/graficos/GraficoJugador'
import { cargarFuentes } from '../lib/graficoStats'
import { cargarImagen } from '../lib/graficosComun'
import './RedaccionGraficos.css'

// Herramienta privada (redactores) para hacer gráficos de redes 1080×1350
// con las plantillas de RZ Hub y descargarlos o compartirlos desde el móvil.

const PLANTILLAS = [
  { id: 'estadisticas', label: 'Estadísticas', ayuda: 'Sube la foto, rellena los datos y descárgalo. Arrastra la foto en la vista previa para encuadrarla.' },
  { id: 'clasificacion', label: 'Clasificación', ayuda: 'La tabla sale sola con los resultados de la web. Elige la jornada y descárgalo.' },
  { id: 'calendario', label: 'Calendario', ayuda: 'Los partidos salen solos del calendario de la web. Elige desde qué día y cuántas semanas.' },
  { id: 'ranking-jugadores', label: 'Ránking jugadores', ayuda: 'Elige hasta 5 jugadores y su número. Sube una foto para la derecha y arrástrala para encuadrarla.' },
  { id: 'versus', label: 'Versus', ayuda: 'Dos jugadores frente a frente con sus estadísticas. Sube una foto para la derecha y arrástrala.' },
  { id: 'ranking-equipos', label: 'Ránking equipos', ayuda: 'Hasta 6 equipos con escudo y su número. Sube una foto para la derecha y arrástrala.' },
  { id: 'barras', label: 'Barras', ayuda: 'Ránking de hasta 8 equipos a todo el ancho: la barra crece con el número. Elige cuál va en amarillo.' },
  { id: 'cara-a-cara', label: 'Cara a cara', ayuda: 'Elige el rival: los últimos resultados salen solos del historial de la web. La foto va abajo.' },
  { id: 'resultado', label: 'Final de partido', ayuda: 'Elige un partido jugado y se rellena solo (equipos, marcador, goleadores del Real Zaragoza, competición). Sube la foto y arrástrala.' },
  { id: 'notas-partido', label: 'Las notas', ayuda: 'Para abrir las notas de un partido jugado: el marcador y los escudos salen solos (la caja del rival coge el color de su escudo). Sube la foto y arrástrala.' },
  { id: 'horario', label: 'Horario', ayuda: 'Horario confirmado del partido: día y hora en grande. Sale solo la versión en casa (estadio y lema) o fuera (km y ruta desde Zaragoza). Sube una foto y arrástrala.' },
  { id: 'finde', label: 'Fin de semana', ayuda: 'Los partidos de los próximos días del primer equipo, el filial, el juvenil y el femenino en un solo gráfico, sin foto. Salen solos; desmarca los que no quieras.' },
  { id: 'herramienta', label: 'Herramienta', ayuda: 'Para presentar una herramienta de la web (nueva o no): elige cuál y se rellena sola. Sube una captura (de ordenador o de móvil) y arrástrala para encuadrarla.' },
  { id: 'mi-prediccion', label: 'Mi predicción', ayuda: 'Tu pronóstico de la Porra con tu usuario de la web (foto, @usuario, puesto y puntos). Sale solo de lo que pronosticaste; si no, rellénalo.' },
  { id: 'partido', grupo: 'previa', label: 'Partido', ayuda: 'El lema entre los dos escudos con los datos del próximo partido. Sube una foto ancha (p. ej. un jugador de cada equipo) y arrástrala.' },
  { id: 'rival', grupo: 'previa', label: 'El rival', ayuda: 'Sale el rival del próximo partido con el texto de su ficha y los últimos 5 enfrentamientos. Sube una foto y arrástrala para encuadrarla.' },
  { id: 'porra', grupo: 'previa', label: 'La Porra', ayuda: 'Anuncia la porra del próximo partido. Sube una foto y arrástrala para encuadrarla.' },
  { id: 'on-tour', grupo: 'previa', label: 'On Tour', ayuda: 'Para los desplazamientos: ciudad, estadio, km y mapa salen solos del partido fuera de casa. Sube una foto del estadio.' },
  { id: 'previa', label: 'Previa del rival', ayuda: 'Sale el rival del próximo partido con su posición, puntos, goles y racha. Elige sus goleadores, bajas y el jugador a seguir.' },
  { id: 'rival-copa', label: 'Rival en Copa', ayuda: 'El rival de la siguiente eliminatoria de Copa. Si el partido ya está en la web se rellena solo; si no, escribe el rival y sube su escudo. La foto va a la derecha.' },
  { id: 'convocatoria', label: 'Convocatoria', ayuda: 'Marca los convocados: salen sus tarjetas del Lineup ordenadas por posición. Puedes subir una foto (p. ej. el entrenador).' },
  { id: 'portada', label: 'Portada', ayuda: 'Título enorme a tu gusto (CONVOCADOS, FICHAJES…) con jugadores recortados encima de una foto. Sube los recortes en PNG sin fondo y arrástralos en la vista previa.' },
  { id: 'jugador', label: 'Foto de jugador', ayuda: 'Foto a toda página con la tarjeta del jugador, su nombre en grande y una pastilla (la temporada u otro texto).' },
  { id: 'por-partido', label: 'Por partido', ayuda: 'Hasta 8 filas con el escudo del rival y un valor grande (minutos, goles, notas…). Los minutos de un jugador se rellenan solos con las alineaciones guardadas. La foto va a la izquierda.' },
  { id: 'dato', label: 'El dato', ayuda: 'Un número enorme con su etiqueta y una explicación (lo que va entre **asteriscos** sale en negrita). La foto va a la izquierda.' },
  { id: 'carrusel', label: 'Carrusel', ayuda: 'Para explicar algo en varias diapositivas: portada con foto y título y detrás las que quieras con texto y un dato destacado. Descárgalas o compártelas todas de una vez.' },
  { id: 'novedad', label: 'Novedad web', ayuda: 'Una mejora de la web por imagen: elígela de "Mejoras en la web", sube una captura y descárgala.' },
  { id: 'mercado', label: 'Fichaje / salida', ayuda: 'Para anunciar fichajes y salidas. Elige si llega o se va, los dos clubes y la operación, escribe el nombre y sube la foto (arrástrala para encuadrarla).' },
  { id: 'noticia', label: 'Noticia', ayuda: 'Sube la foto (o rellénalo con una noticia de la web), escribe el titular y descárgalo. Arrastra la foto para encuadrarla.' },
]
const CLAVE_PLANTILLA = 'redaccion_grafico_plantilla'
// Plantillas agrupadas en una sola pestaña, con sus subpestañas debajo.
const GRUPOS = { previa: 'Previa' }

export default function RedaccionGraficos() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [plantilla, setPlantilla] = useState(() => {
    try { return localStorage.getItem(CLAVE_PLANTILLA) || 'estadisticas' } catch { return 'estadisticas' }
  })
  const [logo, setLogo] = useState(null)
  const [fuentesListas, setFuentesListas] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (profile && !profile.es_redactor) navigate('/')
  }, [user, profile, loading, navigate])

  useEffect(() => {
    cargarFuentes().then(() => setFuentesListas(true))
    cargarImagen('/LOGO_RZHUB.webp').then(setLogo)
  }, [])

  const elegir = id => {
    setPlantilla(id)
    try { localStorage.setItem(CLAVE_PLANTILLA, id) } catch { /* privado */ }
  }

  if (loading || !user || !profile?.es_redactor) return <div className="graficos-page" />
  const actual = PLANTILLAS.find(p => p.id === plantilla) || PLANTILLAS[0]

  return (
    <div className="graficos-page">
      <SEO title="Gráficos | RZ Hub" description="Herramienta interna de gráficos." path="/redaccion-graficos" noindex />
      <div className="graficos-cabecera">
        <h1>Gráficos</h1>
        <div className="graficos-pestanas" role="tablist">
          {PLANTILLAS.filter((p, i) => !p.grupo || PLANTILLAS.findIndex(q => q.grupo === p.grupo) === i).map(p => {
            const activa = p.grupo ? actual.grupo === p.grupo : p.id === actual.id
            return (
              <button key={p.grupo || p.id} type="button" role="tab" aria-selected={activa} className={activa ? 'es-activa' : ''} onClick={() => elegir(p.grupo && activa ? actual.id : p.id)}>
                {p.grupo ? GRUPOS[p.grupo] : p.label}
              </button>
            )
          })}
        </div>
        {actual.grupo && (
          <div className="graficos-pestanas graficos-pestanas--sub" role="tablist">
            {PLANTILLAS.filter(p => p.grupo === actual.grupo).map(p => (
              <button key={p.id} type="button" role="tab" aria-selected={p.id === actual.id} className={p.id === actual.id ? 'es-activa' : ''} onClick={() => elegir(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        <p>{actual.ayuda}</p>
      </div>

      {actual.id === 'clasificacion' && <GraficoClasificacion logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'noticia' && <GraficoNoticia logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'calendario' && <GraficoCalendario logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'ranking-jugadores' && <GraficoRankingJugadores logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'versus' && <GraficoVersus logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'ranking-equipos' && <GraficoRankingEquipos logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'barras' && <GraficoBarras logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'cara-a-cara' && <GraficoCaraACara logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'mercado' && <GraficoMercado logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'resultado' && <GraficoResultado logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'previa' && <GraficoPrevia logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'rival' && <GraficoRival logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'partido' && <GraficoPartido logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'porra' && <GraficoPorra logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'on-tour' && <GraficoOnTour logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'horario' && <GraficoHorario logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'carrusel' && <GraficoCarrusel logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'novedad' && <GraficoNovedad logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'portada' && <GraficoPortada logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'finde' && <GraficoFinde logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'herramienta' && <GraficoHerramienta logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'rival-copa' && <GraficoRivalCopa logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'notas-partido' && <GraficoNotasPartido logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'mi-prediccion' && <GraficoMiPrediccion logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'por-partido' && <GraficoPorPartido logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'dato' && <GraficoDato logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'convocatoria' && <GraficoConvocatoria logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'jugador' && <GraficoJugador logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'estadisticas' && <GraficoEstadisticas logo={logo} fuentesListas={fuentesListas} />}
    </div>
  )
}
