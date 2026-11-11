import { useState, useEffect } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../components/HeroSection.css'
import useNextAwayMatch from '../hooks/useNextAwayMatch'
import useNextAwayPartido from '../hooks/useNextAwayPartido'
import QuedadasSection from '../components/QuedadasSection'
import { useEscudo } from '../lib/escudos'
import { DESPLAZAMIENTOS as D } from '../lib/desplazamientos'

function icono(escudo, color) {
  const s = 'width:40px;height:40px;background:white;border-radius:50%;border:3px solid ' + color + ';display:flex;align-items:center;justify-content:center;overflow:hidden'
  const i = 'width:28px;height:28px;object-fit:contain'
  const html = '<div style="' + s + '"><img src="' + escudo + '" style="' + i + '" /></div>'
  return L.divIcon({ className: '', html: html, iconSize: [40, 40], iconAnchor: [20, 20] })
}

// Desplazamientos fuera de la liga (Copa): solo alimentan la tarjeta de
// "Próximo desplazamiento", no cuentan en el mapa ni en los totales.
const D_COPA = [
  { club: 'CD Tudelano', direccion: 'Estadio Ciudad de Tudela, Av. de las Merindades, 31500 Tudela, Navarra' },
]

function getMapsUrl(lat, lng) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng
}

function getTripMapsUrl(trip) {
  if (trip.direccion) return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(trip.direccion)
  return getMapsUrl(trip.lat, trip.lng)
}

// Alias para filiales cuyo nombre en el calendario no coincide con el
// del listado de desplazamientos (p. ej. "Atleti B" vs el nombre
// oficial "Atlético Madrileño" que usa el .ics).
const RIVAL_ALIASES = {
  'atletico madrileno': 'atleti b',
  'real madrid castilla': 'real madrid b',
}

function normalizeRival(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(cf|fc|ud|sd|cd|ce|ad|de)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function findTrip(rivalName) {
  if (!rivalName) return null
  const norm = normalizeRival(rivalName)
  const aliased = RIVAL_ALIASES[norm] || norm
  return [...D, ...D_COPA].find(d => {
    const dNorm = normalizeRival(d.club)
    return dNorm.includes(aliased) || aliased.includes(dNorm)
  }) || null
}

function MapSizeFix() {
  const map = useMap()

  useEffect(() => {
    const raf = requestAnimationFrame(() => map.invalidateSize())
    const t1 = setTimeout(() => map.invalidateSize(), 200)
    const t2 = setTimeout(() => map.invalidateSize(), 600)
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [map])

  return null
}

export default function OnTour() {
  const [sel, setSel] = useState(null)
  const total = D.reduce((a, d) => a + d.km, 0)
  const { match: nextAway } = useNextAwayMatch()
  const nextAwayEscudo = useEscudo(nextAway?.rival)
  const nextTrip = findTrip(nextAway?.rival)
  const { partido: proximoPartidoFuera } = useNextAwayPartido()

  const linkStyle = {
    display: 'block',
    marginTop: '16px',
    textDecoration: 'none',
    textAlign: 'center',
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#060D1A' }}>
      <SEO
        title="On Tour · Desplazamientos del Real Zaragoza 26/27 | RZ Hub"
        description="Todos los desplazamientos del Real Zaragoza en la temporada 26/27: kilómetros, estadios y ruta en Google Maps para planificar tu viaje con la afición."
        keywords="desplazamientos Real Zaragoza, viajes afición Real Zaragoza, afición visitante Real Zaragoza, kilómetros Real Zaragoza 26/27, on tour Real Zaragoza"
        path="/on-tour"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'On Tour · Desplazamientos del Real Zaragoza',
          url: `${SITE_URL}/on-tour`,
          description: `Mapa interactivo con los ${D.length} desplazamientos de la afición visitante del Real Zaragoza en la temporada 26/27.`,
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div style={{ background: '#09215F', padding: '32px 24px 24px', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(52px,10vw,96px)', textTransform: 'uppercase', lineHeight: 1, margin: '0 0 8px 0' }}>
            On Tour
          </h1>
          <p style={{ fontFamily: 'sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 20px 0' }}>
            Desplazamientos del Real Zaragoza · Temporada 26/27
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { valor: D.length, label: 'Desplazamientos' },
              { valor: total.toLocaleString(), label: 'km totales (ida)' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '40px', fontWeight: '700', lineHeight: 1 }}>{s.valor}</div>
                <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
              </div>
            ))}
            <div
              onClick={nextTrip ? () => window.open(getTripMapsUrl(nextTrip), '_blank') : undefined}
              className={nextTrip ? 'hero-cta' : undefined}
              style={{
                background: nextTrip ? undefined : 'rgba(255,255,255,0.1)',
                width: 'auto', borderRadius: '10px', padding: '12px 20px',
                display: 'flex', alignItems: 'center', gap: '10px',
                cursor: nextTrip ? 'pointer' : 'default',
              }}
            >
              {nextAwayEscudo && (
                <img
                  src={nextAwayEscudo}
                  alt=""
                  style={{ width: '36px', height: '36px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '3px', flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
              <div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '16px', fontWeight: '700', lineHeight: 1.1, color: nextTrip ? '#111111' : 'white' }}>
                  {nextAway ? nextAway.rival : 'Sin datos'}
                </div>
                <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: nextTrip ? 'rgba(17,17,17,0.7)' : 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                  Próximo desplazamiento{nextAway ? ' · ' + nextAway.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: '24px' }}>
        <QuedadasSection partido={proximoPartidoFuera} />
      </div>

      <div className="ontour-mapwrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div className="ontour-map" style={{ flex: 1, minWidth: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
          <MapContainer center={[40.0, -3.5]} zoom={6} style={{ height: '500px', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapSizeFix />
            {D.map(d => (
              <Marker key={d.num} position={[d.lat, d.lng]} icon={icono(d.escudo, d.color)} eventHandlers={{ click: () => setSel(d) }} />
            ))}
          </MapContainer>
        </div>

        <div className="ontour-sidebar" style={{ width: '320px', flexShrink: 0 }}>
          {sel ? (
            <div style={{ background: '#0B4390', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <div style={{ background: sel.color, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={sel.escudo} alt={sel.club} style={{ width: '48px', height: '48px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '4px' }} />
                <div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#0B4390', textTransform: 'uppercase' }}>
                    {'#' + sel.num + ' · ' + sel.ciudad}
                  </div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '18px', fontWeight: '700', color: '#0B4390', textTransform: 'uppercase' }}>
                    {sel.club}
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#FFC800' }}>Distancia desde Zaragoza</span>
                  <span style={{ fontFamily: 'Humane, sans-serif', fontSize: '32px', fontWeight: '700', color: '#FFC800' }}>{sel.km} km</span>
                </div>
                <span style={{ background: sel.color, color: '#0B4390', borderRadius: '4px', padding: '3px 10px', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700' }}>
                  {sel.label}
                </span>
                {sel.nota && (
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#FFC800', marginTop: '8px' }}>{sel.nota}</div>
                )}
                <a href={getMapsUrl(sel.lat, sel.lng)} target="_blank" rel="noopener noreferrer" className="hero-cta" style={linkStyle}>
                  Cómo llegar al estadio
                </a>
              </div>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', textAlign: 'center', color: '#999', fontFamily: 'sans-serif', fontSize: '14px' }}>
              Haz click en un escudo del mapa para ver más información
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
          {D.map(d => (
            <div
              key={d.num}
              onClick={() => window.open(getMapsUrl(d.lat, d.lng), '_blank')}
              style={{ background: '#0B4390', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '4px solid ' + d.color }}
            >
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={d.escudo} alt={d.club} style={{ width: '44px', height: '44px', objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '10px', color: '#FFC800', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {'#' + d.num + ' · ' + d.ciudad}
                  </div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '15px', fontWeight: '700', color: '#FFC800', textTransform: 'uppercase', lineHeight: 1.1, margin: '2px 0 4px' }}>
                    {d.club}
                  </div>
                  <span style={{ background: d.color, color: '#0B4390', borderRadius: '4px', padding: '2px 7px', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '700' }}>
                    {d.label}
                  </span>
                  {d.nota && (
                    <div style={{ fontFamily: 'sans-serif', fontSize: '9px', color: '#FFC800', marginTop: '3px' }}>{d.nota}</div>
                  )}
                </div>
                <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '40px', fontWeight: '700', color: '#FFC800', lineHeight: 1, flexShrink: 0, textAlign: 'right' }}>
                  {d.km}
                  <div style={{ fontSize: '11px', fontFamily: 'sans-serif', fontWeight: '400', color: '#FFC800' }}>km</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ontour-mapwrap {
            flex-direction: column !important;
            padding: 16px !important;
          }
          .ontour-map {
            width: 100% !important;
            flex: none !important;
          }
          .ontour-map .leaflet-container {
            width: 100% !important;
            height: 340px !important;
          }
          .ontour-sidebar {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}