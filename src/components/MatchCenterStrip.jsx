import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import { cargarProximoYUltimo, elegirPartidoActual, DURACION_PARTIDO_MS } from '../lib/partidoActual'
import { slugPartido, nombresPartido, marcadorPartido } from '../lib/partidoSeo'
import './MatchCenterStrip.css'

const REFRESCO_MS = 60_000
const LOGO_PRIMERA = '/escudos/competiciones/primera-federacion.webp'
const LOGO_COPA = '/escudos/competiciones/copa-del-rey.webp'

const fechaCorta = iso => new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
const hora = iso => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })

function Equipo({ nombre, escudo, lado }) {
  return (
    <span className={`mc-strip__equipo mc-strip__equipo--${lado}`}>
      {escudo ? <img src={escudo} alt="" className="mc-strip__escudo" /> : <span className="mc-strip__escudo mc-strip__escudo--vacio">{nombre[0]}</span>}
      <span className="mc-strip__nombre">{nombre}</span>
    </span>
  )
}

// Franja del Vestuario Blanquillo en la home: el partido que toca (víspera y
// partido → ese partido; después, el resultado del último durante 4 días;
// si no, el próximo), enlazando a su página /partido/:slug.
export default function MatchCenterStrip() {
  const [partido, setPartido] = useState(null)
  const [, setTick] = useState(0)
  const escudoRival = useEscudo(partido?.rival)

  useEffect(() => {
    let activo = true
    function refrescar() {
      cargarProximoYUltimo().then(d => {
        if (!activo) return
        const actual = elegirPartidoActual(d)
        setPartido(prev => (prev && actual && prev.id === actual.id && prev.finalizado === actual.finalizado ? prev : actual))
        setTick(t => t + 1)
      })
    }
    refrescar()
    const id = setInterval(refrescar, REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [])

  if (!partido) return null

  const { local, visitante, zaragozaLocal } = nombresPartido(partido)
  const marcador = partido.finalizado ? marcadorPartido(partido) : null
  const inicio = new Date(partido.kickoff).getTime()
  const enJuego = !partido.finalizado && Date.now() >= inicio && Date.now() < inicio + DURACION_PARTIDO_MS
  const logo = partido.competicion ? LOGO_COPA : LOGO_PRIMERA
  const competicion = partido.competicion ? partido.competicion.split(' · ')[0] : `Primera Federación · J${partido.jornada}`

  return (
    <div className="mc-strip-banda">
      <div className="mc-strip-wrap">
      <Link to={`/partido/${slugPartido(partido)}`} className="mc-strip" aria-label={`Vestuario Blanquillo: ${local} - ${visitante}`}>
        <Equipo nombre={local} escudo={zaragozaLocal ? ESCUDO_ZARAGOZA : escudoRival} lado="local" />

        <span className="mc-strip__centro">
          <span className="mc-strip__etiqueta">Vestuario Blanquillo</span>
          <img src={logo} alt={competicion} className={`mc-strip__logo${partido.competicion ? ' mc-strip__logo--copa' : ''}`} />
          <span className="mc-strip__estado">
            {marcador ? (
              <><strong>{marcador.replace('-', ' - ')}</strong> Final</>
            ) : enJuego ? (
              <><span className="mc-strip__directo" aria-hidden="true" /> En juego</>
            ) : Date.now() >= inicio ? (
              <>Resultado en breve</>
            ) : (
              <span className="mc-strip__fecha">{fechaCorta(partido.kickoff)} · {hora(partido.kickoff)}</span>
            )}
          </span>
        </span>

        <Equipo nombre={visitante} escudo={zaragozaLocal ? escudoRival : ESCUDO_ZARAGOZA} lado="visitante" />
      </Link>
      </div>
    </div>
  )
}
