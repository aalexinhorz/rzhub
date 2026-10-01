import { Link } from 'react-router-dom'

// Aviso puntual del lanzamiento de La Pizarra — mismo patrón que
// NotasBanner.jsx (banner fijo bajo el navbar, sin lógica de fecha
// porque no está atado a un partido concreto): se quita a mano más
// adelante cuando deje de tener sentido anunciarlo como novedad.
export default function PizarraBanner() {
  return (
    <Link
      to="/pizarra"
      className="pizarra-banner"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
        gap: '12px', padding: '12px 20px', background: '#0B4390',
        borderBottom: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0 }} aria-hidden="true">⚽</span>
      <span className="pizarra-banner__text" style={{ color: '#fff', fontFamily: 'Archivo, sans-serif', fontSize: '13px', textAlign: 'center' }}>
        <strong style={{ color: '#f5c400' }}>Ya disponible:</strong> La Pizarra — monta tu jugada del Real Zaragoza
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
        background: '#f5c400', color: '#060D1A', fontFamily: 'Archivo, sans-serif',
        fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px',
      }}>
        Probarla ahora →
      </span>
    </Link>
  )
}
