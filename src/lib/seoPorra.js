// Título y descripción de /porra según el partido abierto. Lo usan Porra.jsx
// (navegador) y scripts/prerender-seo.mjs (HTML estático para WhatsApp, X…),
// así que debe seguir siendo JS puro, sin JSX ni imports de Vite.
// "Pronóstico <local> - <visitante>" lo trabaja la página del partido
// (/partido/:slug, ver partidoSeo.js); aquí manda "porra Real Zaragoza" y el
// gancho es el premio (camiseta oficial al 1.º de la temporada). El partido
// abierto solo va en la descripción, para no competir las dos URLs.

const fechaCorta = iso => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })

const BASE = {
  title: 'La Porra del Real Zaragoza | Gana una camiseta oficial',
  description: 'Gana una camiseta oficial del Real Zaragoza: pronostica el resultado y los goleadores de cada partido, suma puntos y termina primero en la clasificación de la temporada. Gratis.',
  keywords: 'porra Real Zaragoza, camiseta Real Zaragoza, quiniela Real Zaragoza, pronósticos Real Zaragoza, predicciones Real Zaragoza, ranking porra Real Zaragoza, porra gratis Real Zaragoza, porra Primera Federación',
}

export function seoPorra(partido) {
  if (!partido?.rival || !partido?.kickoff) return BASE
  const local = partido.sede === 'local'
  const enfrentamiento = local ? `Real Zaragoza - ${partido.rival}` : `${partido.rival} - Real Zaragoza`
  const competicion = partido.competicion ? partido.competicion.split(' · ')[0] : `Primera Federación, J${partido.jornada}`
  return {
    title: BASE.title,
    description: `Gana una camiseta oficial del Real Zaragoza: pronostica el ${enfrentamiento} (${competicion}, ${fechaCorta(partido.kickoff)}) y cada partido de la temporada. Gratis.`,
    keywords: `pronóstico ${partido.rival} Real Zaragoza, ${enfrentamiento}, ${BASE.keywords}`,
  }
}

export const PORRA_OG_IMAGE = 'https://www.rzhub.es/images/porra-og.jpg'
export const PORRA_CARTEL = 'https://www.rzhub.es/images/porra-camiseta.webp'
