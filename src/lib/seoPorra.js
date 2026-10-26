// Título y descripción de /porra según el partido abierto. Lo usan Porra.jsx
// (navegador) y scripts/prerender-seo.mjs (HTML estático para WhatsApp, X…),
// así que debe seguir siendo JS puro, sin JSX ni imports de Vite.
// "Pronóstico <local> - <visitante>" es la búsqueda que más se hace antes de
// cada partido; el título del partido concreto compite por ella.

const fechaCorta = iso => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })

const BASE = {
  title: 'La Porra del Real Zaragoza | Pronósticos y Ranking | RZ Hub',
  description: 'Pronostica el resultado y los goleadores de cada partido del Real Zaragoza, suma puntos en el ranking de la afición y gana una camiseta oficial del Real Zaragoza. Gratis.',
  keywords: 'porra Real Zaragoza, quiniela Real Zaragoza, pronósticos Real Zaragoza, predicciones Real Zaragoza, ranking porra Real Zaragoza, camiseta Real Zaragoza, porra gratis Real Zaragoza, porra Primera Federación',
}

export function seoPorra(partido) {
  if (!partido?.rival || !partido?.kickoff) return BASE
  const local = partido.sede === 'local'
  const enfrentamiento = local ? `Real Zaragoza - ${partido.rival}` : `${partido.rival} - Real Zaragoza`
  const competicion = partido.competicion ? partido.competicion.split(' · ')[0] : `Primera Federación, J${partido.jornada}`
  return {
    title: `Pronóstico ${enfrentamiento} | La Porra del Real Zaragoza`,
    description: `Haz tu pronóstico del ${enfrentamiento} (${competicion}, ${fechaCorta(partido.kickoff)}) en la Porra del Real Zaragoza: gratis, con ranking de la afición y una camiseta oficial de premio.`,
    keywords: `pronóstico ${partido.rival} Real Zaragoza, ${enfrentamiento}, ${BASE.keywords}`,
  }
}

export const PORRA_OG_IMAGE = 'https://www.rzhub.es/images/porra-og.jpg'
export const PORRA_CARTEL = 'https://www.rzhub.es/images/porra-camiseta.webp'
