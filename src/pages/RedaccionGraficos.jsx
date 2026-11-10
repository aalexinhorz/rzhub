import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import SEO from '../components/SEO'
import GraficoEstadisticas from '../components/graficos/GraficoEstadisticas'
import GraficoClasificacion from '../components/graficos/GraficoClasificacion'
import GraficoNoticia from '../components/graficos/GraficoNoticia'
import GraficoCalendario from '../components/graficos/GraficoCalendario'
import { cargarFuentes } from '../lib/graficoStats'
import { cargarImagen } from '../lib/graficosComun'
import './RedaccionGraficos.css'

// Herramienta privada (redactores) para hacer gráficos de redes 1080×1350
// con las plantillas de RZ Hub y descargarlos o compartirlos desde el móvil.

const PLANTILLAS = [
  { id: 'estadisticas', label: 'Estadísticas', ayuda: 'Sube la foto, rellena los datos y descárgalo. Arrastra la foto en la vista previa para encuadrarla.' },
  { id: 'clasificacion', label: 'Clasificación', ayuda: 'La tabla sale sola con los resultados de la web. Elige la jornada y descárgalo.' },
  { id: 'calendario', label: 'Calendario', ayuda: 'Los partidos salen solos del calendario de la web. Elige desde qué día y cuántas semanas.' },
  { id: 'noticia', label: 'Noticia', ayuda: 'Sube la foto (o rellénalo con una noticia de la web), escribe el titular y descárgalo. Arrastra la foto para encuadrarla.' },
]
const CLAVE_PLANTILLA = 'redaccion_grafico_plantilla'

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
          {PLANTILLAS.map(p => (
            <button key={p.id} type="button" role="tab" aria-selected={p.id === actual.id} className={p.id === actual.id ? 'es-activa' : ''} onClick={() => elegir(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <p>{actual.ayuda}</p>
      </div>

      {actual.id === 'clasificacion' && <GraficoClasificacion logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'noticia' && <GraficoNoticia logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'calendario' && <GraficoCalendario logo={logo} fuentesListas={fuentesListas} />}
      {actual.id === 'estadisticas' && <GraficoEstadisticas logo={logo} fuentesListas={fuentesListas} />}
    </div>
  )
}
