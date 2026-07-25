const ICON_PROPS = { width: 36, height: 36, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

// Fuente única de las herramientas de RZ Hub: ToolsSection (teaser de
// 5 en la Home, TOOLS.slice(0, 5)) y la página /herramientas (las 8)
// consumen este mismo array — así nunca se desincroniza el contenido
// entre ambas vistas. El orden importa: las 5 primeras son las que ya
// se enseñaban en la Home, así el .slice(0, 5) sigue mostrando
// exactamente lo mismo que antes.
// badge: opcional (ej. 'Nuevo', 'Popular', 'Beta', 'Próximamente').
export const TOOLS = [
  {
    id: 'lineup',
    title: 'Lineup Builder',
    description: 'Crea tu alineación ideal y compártela con la comunidad.',
    href: '/lineup',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'mercado',
    title: 'Mercado',
    description: 'Sigue los movimientos de jugadores del Real Zaragoza.',
    href: '/mercado',
    badge: null,
    icon: (
      <svg {...ICON_PROPS} strokeWidth={1.8}>
        <polyline points="3 17 9 11 13 15 21 6" />
        <polyline points="15 6 21 6 21 12" />
      </svg>
    ),
  },
  {
    id: 'on-tour',
    title: 'On Tour',
    description: 'Información de desplazamientos, rutas y experiencias de los zaragocistas en los estadios.',
    href: '/on-tour',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 16V8a2 2 0 0 1 2-2h9l4 4v6" />
        <path d="M3 16h15" />
        <path d="M14 6v6h6" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17" cy="17.5" r="1.6" />
      </svg>
    ),
  },
  {
    id: 'calendario',
    title: 'Calendario',
    description: 'Todos los partidos, horarios y sincroniza con tu calendario.',
    href: '/calendario',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
      </svg>
    ),
  },
  {
    id: 'porra',
    title: 'La Porra',
    description: 'Predice resultados y compite con otros zaragocistas.',
    href: '/porra',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
        <path d="M7 5H4a3 3 0 0 0 3 4" />
        <path d="M17 5h3a3 3 0 0 1-3 4" />
        <path d="M12 13v3" />
        <path d="M9 20h6" />
        <path d="M10 16h4l.4 4H9.6z" />
      </svg>
    ),
  },
  {
    id: 'noticias',
    title: 'Noticias',
    description: 'Toda la actualidad y última hora del Real Zaragoza.',
    href: '/noticias',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V4Z" />
        <path d="M19 8h2v11a1 1 0 0 1-1 1H7" />
        <line x1="7" y1="8" x2="14" y2="8" />
        <line x1="7" y1="12" x2="14" y2="12" />
        <line x1="7" y1="16" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    id: 'tierlist',
    title: 'TierMaker',
    description: 'Crea tus propios rankings y tier lists de jugadores.',
    href: '/tierlist',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="4" rx="1.2" />
        <rect x="3" y="10" width="12" height="4" rx="1.2" />
        <rect x="3" y="16" width="7" height="4" rx="1.2" />
      </svg>
    ),
  },
  {
    id: 'comunidad',
    title: 'Comunidad',
    description: 'Comparte contenido y conecta con otros zaragocistas.',
    href: '/comunidad',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]
