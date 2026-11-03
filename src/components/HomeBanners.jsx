import { useEffect, useState } from 'react'
import PreviaBanner from './PreviaBanner'
import PostPartidoBanner from './PostPartidoBanner'
import ComunicadoBanner from './ComunicadoBanner'
import { cargarProximoYUltimo, enVisperaOPartido } from '../lib/partidoActual'

const REFRESCO_MS = 60_000
const CAMPOS = 'kickoff, fecha, rival, sede, goles_zaragoza, goles_rival'

const cargarPartidos = () => cargarProximoYUltimo(CAMPOS)

// Comunicado que sustituye al banner de post partido/notas hasta `hasta`
// (la previa del siguiente partido sigue mandando). Para quitarlo antes,
// basta con poner COMUNICADO = null.
const COMUNICADO = {
  titulo: 'Descanse en paz, Jesús de Miguel',
  subtitulo: 'Nuestro más sentido pésame a su familia, al CD Tenerife y a la afición tinerfeña.',
  to: '/noticias/descanse-en-paz-jesus-de-miguel',
  hasta: '2026-11-05T00:00:00+01:00',
}
const comunicadoVigente = (ahora = Date.now()) => !!COMUNICADO && ahora < new Date(COMUNICADO.hasta).getTime()

const mismoPartido = (a, b) => (a?.kickoff ?? null) === (b?.kickoff ?? null)

// Banners de la home, sin tocar código partido a partido:
// - Desde el día anterior a cada partido (hora de Madrid) hasta que acaba:
//   previa de El Rincón Zaragocista (el rival ya lo enseña el Vestuario Blanquillo).
// - Si hay un COMUNICADO vigente, ocupa el sitio del post partido.
// - El resto del tiempo: post partido de Alexinho y aviso de notas del
//   último partido jugado (4 días cada uno; ver PostPartidoBanner).
export default function HomeBanners() {
  const [datos, setDatos] = useState(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    let activo = true
    function refrescar() {
      cargarPartidos().then(d => {
        if (!activo) return
        // Conserva la referencia si no ha cambiado de partido, para que los
        // banners hijos no vuelvan a pedir sus datos cada minuto.
        setDatos(prev => (prev && mismoPartido(prev.proximo, d.proximo) && mismoPartido(prev.ultimo, d.ultimo)) ? prev : d)
        setTick(t => t + 1)
      })
    }
    refrescar()
    const id = setInterval(refrescar, REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [])

  if (!datos) return null
  const { proximo, ultimo } = datos

  if (enVisperaOPartido(proximo)) {
    const desde = ultimo && !mismoPartido(ultimo, proximo) ? ultimo.kickoff : null
    return <PreviaBanner proximo={proximo} desde={desde} />
  }
  if (comunicadoVigente()) return <ComunicadoBanner comunicado={COMUNICADO} />
  if (ultimo) return <PostPartidoBanner ultimo={ultimo} />
  return null
}
