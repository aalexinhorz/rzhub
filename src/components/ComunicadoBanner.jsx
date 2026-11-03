import { Link } from 'react-router-dom'
import './ComunicadoBanner.css'

// Banner sobrio (negro y blanco) para comunicados que deben ocupar el sitio
// de los banners de partido, p. ej. un fallecimiento. Lo decide HomeBanners.
export default function ComunicadoBanner({ comunicado }) {
  return (
    <Link to={comunicado.to} className="comunicado-banner">
      <svg className="comunicado-banner__lazo" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5c-2.2 0-3.6 1.7-3.6 3.6 0 1.6.9 3.3 2.1 5.2L6.2 20.5h3.1L12 15.6l2.7 4.9h3.1l-4.3-8.2c1.2-1.9 2.1-3.6 2.1-5.2 0-1.9-1.4-3.6-3.6-3.6zm0 2.2c.8 0 1.4.6 1.4 1.4 0 .8-.5 1.9-1.4 3.3-.9-1.4-1.4-2.5-1.4-3.3 0-.8.6-1.4 1.4-1.4z" />
      </svg>
      <span className="comunicado-banner__texto">
        <strong>{comunicado.titulo}</strong>
        <span className="comunicado-banner__sub">{comunicado.subtitulo}</span>
      </span>
      <span className="comunicado-banner__enlace">Leer comunicado</span>
    </Link>
  )
}
