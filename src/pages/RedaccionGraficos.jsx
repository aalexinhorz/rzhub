import { createElement, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

// Cada plantilla: sección de la galería, nombre, descripción corta de la
// tarjeta, texto del botón y la ayuda larga que sale ya dentro del editor.
// La miniatura está en /graficos/<id>.webp.
const SECCIONES = [
  { id: 'partido', titulo: 'Partido', icono: 'balon' },
  { id: 'datos', titulo: 'Datos, rankings y fichas', icono: 'barras' },
  { id: 'redes', titulo: 'Noticias y redes', icono: 'megafono' },
]
const PLANTILLAS = [
  { id: 'resultado', seccion: 'partido', label: 'Final de partido', boton: 'resultado', desc: 'El marcador y los goleadores de un partido jugado, sobre una foto.', ayuda: 'Elige un partido jugado y se rellena solo (equipos, marcador, goleadores del Real Zaragoza, competición). Sube la foto y arrástrala.' },
  { id: 'notas-partido', seccion: 'partido', label: 'Las notas', boton: 'notas', desc: 'Para abrir la votación de las notas de un partido.', ayuda: 'Para abrir las notas de un partido jugado: el marcador y los escudos salen solos (la caja del rival coge el color de su escudo). Sube la foto y arrástrala.' },
  { id: 'horario', seccion: 'partido', label: 'Horario', boton: 'horario', desc: 'Día y hora confirmados del próximo partido, en casa o fuera.', ayuda: 'Horario confirmado del partido: día y hora en grande. Sale solo la versión en casa (estadio y lema) o fuera (km y ruta desde Zaragoza). Sube una foto y arrástrala.' },
  { id: 'partido', seccion: 'partido', label: 'Partido', boton: 'partido', desc: 'El lema entre los dos escudos con los datos del próximo partido.', ayuda: 'El lema entre los dos escudos con los datos del próximo partido. Sube una foto ancha (p. ej. un jugador de cada equipo) y arrástrala.' },
  { id: 'rival', seccion: 'partido', label: 'El rival', boton: 'rival', desc: 'La ficha del próximo rival y los últimos enfrentamientos.', ayuda: 'Sale el rival del próximo partido con el texto de su ficha y los últimos 5 enfrentamientos. Sube una foto y arrástrala para encuadrarla.' },
  { id: 'previa', seccion: 'partido', label: 'Previa del rival', boton: 'previa', desc: 'Posición, puntos, racha, goleadores y bajas del rival.', ayuda: 'Sale el rival del próximo partido con su posición, puntos, goles y racha. Elige sus goleadores, bajas y el jugador a seguir.' },
  { id: 'porra', seccion: 'partido', label: 'La Porra', boton: 'porra', desc: 'Anuncia la porra del próximo partido.', ayuda: 'Anuncia la porra del próximo partido. Sube una foto y arrástrala para encuadrarla.' },
  { id: 'mi-prediccion', seccion: 'partido', label: 'Mi predicción', boton: 'predicción', desc: 'Tu pronóstico de la Porra con tu usuario de la web.', ayuda: 'Tu pronóstico de la Porra con tu usuario de la web (foto, @usuario, puesto y puntos). Sale solo de lo que pronosticaste; si no, rellénalo.' },
  { id: 'on-tour', seccion: 'partido', label: 'On Tour', boton: 'desplazamiento', desc: 'Ciudad, estadio, km y mapa del próximo partido fuera.', ayuda: 'Para los desplazamientos: ciudad, estadio, km y mapa salen solos del partido fuera de casa. Sube una foto del estadio.' },
  { id: 'cara-a-cara', seccion: 'partido', label: 'Cara a cara', boton: 'cara a cara', desc: 'Los últimos resultados contra un rival, del historial de la web.', ayuda: 'Elige el rival: los últimos resultados salen solos del historial de la web. La foto va abajo.' },
  { id: 'rival-copa', seccion: 'partido', label: 'Rival en Copa', boton: 'rival de Copa', desc: 'El rival de la siguiente eliminatoria de Copa del Rey.', ayuda: 'El rival de la siguiente eliminatoria de Copa. Si el partido ya está en la web se rellena solo; si no, escribe el rival y sube su escudo. La foto va a la derecha.' },
  { id: 'convocatoria', seccion: 'partido', label: 'Convocatoria', boton: 'convocatoria', desc: 'Los convocados con sus tarjetas, ordenados por posición.', ayuda: 'Marca los convocados: salen sus tarjetas del Lineup ordenadas por posición. Puedes subir una foto (p. ej. el entrenador).' },
  { id: 'finde', seccion: 'partido', label: 'Fin de semana', boton: 'fin de semana', desc: 'Los partidos del primer equipo, filial, juvenil y femenino.', ayuda: 'Los partidos de los próximos días del primer equipo, el filial, el juvenil y el femenino en un solo gráfico, sin foto. Salen solos; desmarca los que no quieras.' },
  { id: 'clasificacion', seccion: 'datos', label: 'Clasificación', boton: 'clasificación', desc: 'La tabla del grupo tras la jornada que elijas.', ayuda: 'La tabla sale sola con los resultados de la web. Elige la jornada y descárgalo.' },
  { id: 'calendario', seccion: 'datos', label: 'Calendario', boton: 'calendario', desc: 'Los próximos partidos del Real Zaragoza en un calendario.', ayuda: 'Los partidos salen solos del calendario de la web. Elige desde qué día y cuántas semanas.' },
  { id: 'estadisticas', seccion: 'datos', label: 'Estadísticas', boton: 'estadísticas', desc: 'Ficha de números de un jugador sobre su foto.', ayuda: 'Sube la foto, rellena los datos y descárgalo. Arrastra la foto en la vista previa para encuadrarla.' },
  { id: 'barras', seccion: 'datos', label: 'Barras', boton: 'barras', desc: 'Ránking de hasta 8 equipos con barras por una métrica.', ayuda: 'Ránking de hasta 8 equipos a todo el ancho: la barra crece con el número. Elige cuál va en amarillo.' },
  { id: 'ranking-equipos', seccion: 'datos', label: 'Ránking equipos', boton: 'ránking', desc: 'Hasta 6 equipos con escudo y su número, con foto.', ayuda: 'Hasta 6 equipos con escudo y su número. Sube una foto para la derecha y arrástrala.' },
  { id: 'ranking-jugadores', seccion: 'datos', label: 'Ránking jugadores', boton: 'ránking', desc: 'Hasta 5 jugadores y su número, con foto.', ayuda: 'Elige hasta 5 jugadores y su número. Sube una foto para la derecha y arrástrala para encuadrarla.' },
  { id: 'versus', seccion: 'datos', label: 'Versus', boton: 'versus', desc: 'Dos jugadores frente a frente con sus estadísticas.', ayuda: 'Dos jugadores frente a frente con sus estadísticas. Sube una foto para la derecha y arrástrala.' },
  { id: 'por-partido', seccion: 'datos', label: 'Por partido', boton: 'por partido', desc: 'Un valor por partido (minutos, goles, notas) con el escudo del rival.', ayuda: 'Hasta 8 filas con el escudo del rival y un valor grande (minutos, goles, notas…). Los minutos de un jugador se rellenan solos con las alineaciones guardadas. La foto va a la izquierda.' },
  { id: 'dato', seccion: 'datos', label: 'El dato', boton: 'dato', desc: 'Un número enorme con su explicación y una foto.', ayuda: 'Un número enorme con su etiqueta y una explicación (lo que va entre **asteriscos** sale en negrita). La foto va a la izquierda.' },
  { id: 'jugador', seccion: 'datos', label: 'Foto de jugador', boton: 'jugador', desc: 'Foto a toda página con la tarjeta y el nombre del jugador.', ayuda: 'Foto a toda página con la tarjeta del jugador, su nombre en grande y una pastilla (la temporada u otro texto).' },
  { id: 'noticia', seccion: 'redes', label: 'Noticia', boton: 'noticia', desc: 'Titular sobre una foto, o una noticia de la web.', ayuda: 'Sube la foto (o rellénalo con una noticia de la web), escribe el titular y descárgalo. Arrastra la foto para encuadrarla.' },
  { id: 'mercado', seccion: 'redes', label: 'Fichaje / salida', boton: 'fichaje', desc: 'Anuncia una llegada o una salida con los dos clubes.', ayuda: 'Para anunciar fichajes y salidas. Elige si llega o se va, los dos clubes y la operación, escribe el nombre y sube la foto (arrástrala para encuadrarla).' },
  { id: 'portada', seccion: 'redes', label: 'Portada', boton: 'portada', desc: 'Título enorme con jugadores recortados sobre una foto.', ayuda: 'Título enorme a tu gusto (CONVOCADOS, FICHAJES…) con jugadores recortados encima de una foto. Sube los recortes en PNG sin fondo y arrástralos en la vista previa.' },
  { id: 'carrusel', seccion: 'redes', label: 'Carrusel', boton: 'carrusel', desc: 'Varias diapositivas: portada, textos con datos y cierre.', ayuda: 'Para explicar algo en varias diapositivas: portada con foto y título y detrás las que quieras con texto y un dato destacado. Descárgalas o compártelas todas de una vez.' },
  { id: 'herramienta', seccion: 'redes', label: 'Herramienta', boton: 'herramienta', desc: 'Presenta una herramienta de la web con su captura.', ayuda: 'Para presentar una herramienta de la web (nueva o no): elige cuál y se rellena sola. Sube una captura (de ordenador o de móvil) y arrástrala para encuadrarla.' },
  { id: 'novedad', seccion: 'redes', label: 'Novedad web', boton: 'novedad', desc: 'Una mejora de la web con su captura real.', ayuda: 'Una mejora de la web por imagen: elígela de "Mejoras en la web" y la captura real se pone sola (si está guardada). Descárgala.' },
]
const EDITORES = {
  'resultado': GraficoResultado, 'notas-partido': GraficoNotasPartido, 'horario': GraficoHorario, 'partido': GraficoPartido,
  'rival': GraficoRival, 'previa': GraficoPrevia, 'porra': GraficoPorra, 'mi-prediccion': GraficoMiPrediccion,
  'on-tour': GraficoOnTour, 'cara-a-cara': GraficoCaraACara, 'rival-copa': GraficoRivalCopa, 'convocatoria': GraficoConvocatoria,
  'finde': GraficoFinde, 'clasificacion': GraficoClasificacion, 'calendario': GraficoCalendario, 'estadisticas': GraficoEstadisticas,
  'barras': GraficoBarras, 'ranking-equipos': GraficoRankingEquipos, 'ranking-jugadores': GraficoRankingJugadores, 'versus': GraficoVersus,
  'por-partido': GraficoPorPartido, 'dato': GraficoDato, 'jugador': GraficoJugador, 'noticia': GraficoNoticia,
  'mercado': GraficoMercado, 'portada': GraficoPortada, 'carrusel': GraficoCarrusel, 'herramienta': GraficoHerramienta,
  'novedad': GraficoNovedad,
}

function IconoSeccion({ tipo }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (tipo === 'barras') return <svg {...p}><path d="M5 20V11M12 20V4M19 20v-6" /></svg>
  if (tipo === 'megafono') return <svg {...p}><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
  return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7l4 3-1.5 4.5h-5L8 10z" /></svg>
}

export default function RedaccionGraficos() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  // La plantilla abierta va en la URL (?plantilla=…): así el botón de atrás
  // del navegador o del móvil vuelve a la galería.
  const [params, setParams] = useSearchParams()
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

  const abrir = id => { setParams({ plantilla: id }); window.scrollTo(0, 0) }
  const volver = () => { if (window.history.state?.idx > 0) navigate(-1); else setParams({}) }

  if (loading || !user || !profile?.es_redactor) return <div className="graficos-page" />
  const actual = PLANTILLAS.find(p => p.id === params.get('plantilla'))

  return (
    <div className="graficos-page">
      <SEO title="Gráficos | RZ Hub" description="Herramienta interna de gráficos." path="/redaccion-graficos" noindex />
      {!actual ? (
        <div className="graficos-galeria">
          <header className="graficos-galeria__cabecera">
            <p className="graficos-galeria__eyebrow">Redacción · RZ Hub</p>
            <h1>Gráficos</h1>
            <p>Elige una plantilla, rellénala y descárgala lista para redes (1080×1350).</p>
          </header>
          {SECCIONES.map(sec => (
            <section key={sec.id} className="graficos-seccion" aria-labelledby={`graficos-sec-${sec.id}`}>
              <h2 id={`graficos-sec-${sec.id}`}><IconoSeccion tipo={sec.icono} />{sec.titulo}</h2>
              <div className="graficos-tarjetas">
                {PLANTILLAS.filter(p => p.seccion === sec.id).map(p => (
                  <article key={p.id} className="graficos-tarjeta">
                    <button type="button" className="graficos-tarjeta__miniatura" onClick={() => abrir(p.id)} aria-label={`Abrir ${p.label}`}>
                      <img src={`/graficos/${p.id}.webp`} alt="" loading="lazy" width="540" height="675" />
                    </button>
                    <div className="graficos-tarjeta__cuerpo">
                      <h3>{p.label}</h3>
                      <p>{p.desc}</p>
                      <button type="button" className="graficos-tarjeta__boton" onClick={() => abrir(p.id)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2" /><path d="M3 15l4-4 4 4 2-2 4 4M19 3v6M16 6h6" /></svg>
                        Generar {p.boton}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <div className="graficos-cabecera">
            <button type="button" className="graficos-volver" onClick={volver}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
              Todas las plantillas
            </button>
            <h1>{actual.label}</h1>
            <p>{actual.ayuda}</p>
          </div>
          {createElement(EDITORES[actual.id], { logo, fuentesListas })}
        </>
      )}
    </div>
  )
}
