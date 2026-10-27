import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ESCUDO_ZARAGOZA, useEscudo } from '../../lib/escudos'
import { cargarProximoYUltimo, elegirPartidoActual, DURACION_PARTIDO_MS } from '../../lib/partidoActual'
import { slugPartido, nombresPartido, marcadorPartido, competicionCorta } from '../../lib/partidoSeo'
import { cargarOpinionAficion } from '../../lib/porraStats'

const LOGO_PRIMERA = '/escudos/competiciones/primera-federacion.webp'
const LOGO_COPA = '/escudos/competiciones/copa-del-rey.webp'
const fechaLarga = iso => {
  const t = new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
const hora = iso => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
const dos = n => String(n).padStart(2, '0')

function useAhora(activo) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    if (!activo) return
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activo])
  return ahora
}

function CuentaAtras({ ms }) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const partes = [
    { v: Math.floor(s / 86400), l: 'días' },
    { v: Math.floor((s % 86400) / 3600), l: 'horas' },
    { v: Math.floor((s % 3600) / 60), l: 'min' },
    { v: s % 60, l: 'seg' },
  ]
  return (
    <div className="h2-cuenta" aria-label="Cuenta atrás para el partido">
      {partes.map(p => (
        <span key={p.l} className="h2-cuenta__bloque">
          <span className="h2-cuenta__valor">{dos(p.v)}</span>
          <span className="h2-cuenta__etiqueta">{p.l}</span>
        </span>
      ))}
    </div>
  )
}

// Bloque protagonista del Vestuario Blanquillo: el partido que toca (misma
// regla de 72 h que la franja), con cuenta atrás en vivo, lo que pronostica
// la afición y accesos directos al Vestuario y a la Porra.
export default function VestuarioDestacado() {
  const [partido, setPartido] = useState(null)
  const [opinion, setOpinion] = useState(null)
  const escudoRival = useEscudo(partido?.rival)
  const ahora = useAhora(!!partido)

  useEffect(() => {
    let activo = true
    cargarProximoYUltimo().then(d => {
      if (!activo) return
      const actual = elegirPartidoActual(d)
      setPartido(actual)
      if (actual) cargarOpinionAficion(actual.id).then(o => { if (activo) setOpinion(o) })
    })
    return () => { activo = false }
  }, [])

  if (!partido) return null

  const { local, visitante, zaragozaLocal } = nombresPartido(partido)
  const inicio = new Date(partido.kickoff).getTime()
  const marcador = partido.finalizado ? marcadorPartido(partido) : null
  const enJuego = !partido.finalizado && ahora >= inicio && ahora < inicio + DURACION_PARTIDO_MS
  const porJugar = ahora < inicio
  const porraAbierta = partido.abierto && porJugar
  const hayOpinion = opinion?.total > 0

  return (
    <section className="h2-vestuario" aria-label="Vestuario Blanquillo">
      <div className="h2-vestuario__fondo" aria-hidden="true" />
      <div className="h2-vestuario__contenido">
        <div className="h2-vestuario__cabecera">
          <span className="h2-vestuario__marca">Vestuario Blanquillo</span>
          <span className="h2-vestuario__comp">
            <img src={partido.competicion ? LOGO_COPA : LOGO_PRIMERA} alt="" />
            {competicionCorta(partido)}
          </span>
        </div>

        <div className="h2-vestuario__partido">
          <div className="h2-vestuario__equipo">
            {(zaragozaLocal ? ESCUDO_ZARAGOZA : escudoRival) && <img src={zaragozaLocal ? ESCUDO_ZARAGOZA : escudoRival} alt="" />}
            <span>{local}</span>
          </div>

          <div className="h2-vestuario__centro">
            {marcador ? (
              <>
                <span className="h2-vestuario__marcador">{marcador.replace('-', ' - ')}</span>
                <span className="h2-pill">Final</span>
              </>
            ) : enJuego ? (
              <>
                <span className="h2-vestuario__vivo"><span className="h2-punto-vivo" /> En juego</span>
                <span className="h2-vestuario__fecha">Sigue el partido en el Vestuario</span>
              </>
            ) : porJugar ? (
              <>
                <CuentaAtras ms={inicio - ahora} />
                <span className="h2-vestuario__fecha">{fechaLarga(partido.kickoff)} · {hora(partido.kickoff)}</span>
              </>
            ) : (
              <span className="h2-vestuario__fecha">Resultado en breve</span>
            )}
          </div>

          <div className="h2-vestuario__equipo">
            {(zaragozaLocal ? escudoRival : ESCUDO_ZARAGOZA) && <img src={zaragozaLocal ? escudoRival : ESCUDO_ZARAGOZA} alt="" />}
            <span>{visitante}</span>
          </div>
        </div>

        {hayOpinion && (
          <div className="h2-opinion">
            <div className="h2-opinion__barra" role="img" aria-label={`La afición: ${opinion.gana}% gana el Real Zaragoza, ${opinion.empata}% empate, ${opinion.pierde}% gana el ${partido.rival}`}>
              <span className="h2-opinion__tramo h2-opinion__tramo--v" style={{ width: `${opinion.gana}%` }} />
              <span className="h2-opinion__tramo h2-opinion__tramo--e" style={{ width: `${opinion.empata}%` }} />
              <span className="h2-opinion__tramo h2-opinion__tramo--d" style={{ width: `${opinion.pierde}%` }} />
            </div>
            <p className="h2-opinion__texto">
              <strong>{opinion.gana}%</strong> cree que gana el Real Zaragoza<span className="h2-solo-escritorio"> · {opinion.total} pronósticos</span>
            </p>
          </div>
        )}

        <div className="h2-vestuario__acciones">
          <Link to={`/partido/${slugPartido(partido)}`} className="h2-boton h2-boton--amarillo">
            <span className="h2-solo-escritorio">Entrar al Vestuario →</span>
            <span className="h2-solo-movil">Vestuario →</span>
          </Link>
          {porraAbierta && (
            <Link to="/porra" className="h2-boton h2-boton--borde">
              <span className="h2-solo-escritorio">Haz tu pronóstico · gana la camiseta</span>
              <span className="h2-solo-movil">Pronosticar 👕</span>
            </Link>
          )}
          {partido.finalizado && <Link to="/notas" className="h2-boton h2-boton--borde">Pon tus notas</Link>}
        </div>
      </div>
    </section>
  )
}
