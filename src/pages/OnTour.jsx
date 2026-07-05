import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const D = [
  { num: 1,  club: 'SD Huesca',             ciudad: 'Huesca',            km: 74,  lat: 42.1318883, lng: -0.4247182, escudo: '/escudos/Logo_of_SD_Huesca.svg',                            color: '#27ae60', label: 'Corto' },
  { num: 2,  club: 'CD Teruel',             ciudad: 'Teruel',            km: 185, lat: 40.332743,  lng: -1.1065112, escudo: '/escudos/CD_Teruel_logo.svg',                                color: '#27ae60', label: 'Corto' },
  { num: 3,  club: 'Nastic Tarragona',      ciudad: 'Tarragona',         km: 235, lat: 41.127051,  lng: 1.272851,   escudo: '/escudos/Gimnastic_de_Tarragona_logo.svg',                   color: '#f5c400', label: 'Medio' },
  { num: 4,  club: 'UE Sant Andreu',        ciudad: 'Barcelona',         km: 295, lat: 41.4288822, lng: 2.1930871,  escudo: '/escudos/ue-sant-andreu-vector-logo.png',                    color: '#f5c400', label: 'Medio' },
  { num: 5,  club: 'CE Europa',             ciudad: 'Barcelona',         km: 295, lat: 41.438057,  lng: 2.183797,   escudo: '/escudos/Club_Esportiu_Europa.svg',                          color: '#f5c400', label: 'Medio' },
  { num: 6,  club: 'Villarreal B',          ciudad: 'Villarreal',        km: 295, lat: 39.9394068, lng: -0.1167347, escudo: '/escudos/Villarreal_CF_logo-en.svg',                         color: '#f5c400', label: 'Medio' },
  { num: 7,  club: 'Rayo Majadahonda',      ciudad: 'Majadahonda',       km: 310, lat: 40.4575422, lng: -3.8602657, escudo: '/escudos/Rayo_Majadahonda_(logo).svg',                       color: '#f5c400', label: 'Medio' },
  { num: 8,  club: 'AD Alcorcon',           ciudad: 'Alcorcon',          km: 315, lat: 40.3388592, lng: -3.8404714, escudo: '/escudos/AD_Alcorcon_logo.svg',                              color: '#f5c400', label: 'Medio' },
  { num: 9,  club: 'Atleti B',              ciudad: 'Alcala Henares',    km: 320, lat: 40.5082172, lng: -3.3609447, escudo: '/escudos/Atletico_Madrid_Logo_2024.svg',                     color: '#f5c400', label: 'Medio' },
  { num: 10, club: 'Real Madrid B',         ciudad: 'Valdebebas',        km: 325, lat: 40.47693,   lng: -3.6142698, escudo: '/escudos/Real_Madrid_CF.svg',                                color: '#f5c400', label: 'Medio' },
  { num: 11, club: 'Hercules',              ciudad: 'Alicante',          km: 470, lat: 38.3573154, lng: -0.4926576, escudo: '/escudos/Hercules_CF_crest.svg',                             color: '#e67e22', label: 'Largo' },
  { num: 12, club: 'UD Ibiza',              ciudad: 'Ibiza',             km: 480, lat: 38.9139282, lng: 1.4157596,  escudo: '/escudos/UD_Ibiza_logo.svg',                                 color: '#e67e22', label: 'Largo', nota: 'Valencia ~330 + ferry ~150' },
  { num: 13, club: 'Real Murcia',           ciudad: 'Murcia',            km: 535, lat: 38.0422688, lng: -1.1452422, escudo: '/escudos/Real_Murcia_CF_logo.svg',                           color: '#e67e22', label: 'Largo' },
  { num: 14, club: 'Cartagena',             ciudad: 'Cartagena',         km: 560, lat: 37.6097329, lng: -0.9960535, escudo: '/escudos/spain_fc-cartagena.football-logos.cc.svg',           color: '#e67e22', label: 'Largo' },
  { num: 15, club: 'Aguilas FC',            ciudad: 'Aguilas',           km: 620, lat: 37.4037154, lng: -1.5907668, escudo: '/escudos/logo.svg',                                          color: '#c0392b', label: 'Epico' },
  { num: 16, club: 'Real Jaen',             ciudad: 'Jaen',              km: 630, lat: 37.7753883, lng: -3.7673872, escudo: '/escudos/spain_real-jaen-cf.football-logos.cc.svg',           color: '#c0392b', label: 'Epico' },
  { num: 17, club: 'Antequera',             ciudad: 'Antequera',         km: 840, lat: 37.0205922, lng: -4.5718066, escudo: '/escudos/spain_antequera.football-logos.cc.svg',              color: '#c0392b', label: 'Epico' },
  { num: 18, club: 'Juventud Torremolinos', ciudad: 'Torremolinos',      km: 870, lat: 36.62132,   lng: -4.5099324, escudo: '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',  color: '#c0392b', label: 'Epico' },
  { num: 19, club: 'Algeciras',             ciudad: 'Algeciras',         km: 900, lat: 36.1630173, lng: -5.4651517, escudo: '/escudos/spain_algeciras.football-logos.cc.svg',              color: '#c0392b', label: 'Epico' },
]

function icono(escudo, color) {
  const s = 'width:40px;height:40px;background:white;border-radius:50%;border:3px solid ' + color + ';display:flex;align-items:center;justify-content:center;overflow:hidden'
  const i = 'width:28px;height:28px;object-fit:contain'
  const html = '<div style="' + s + '"><img src="' + escudo + '" style="' + i + '" /></div>'
  return L.divIcon({ className: '', html: html, iconSize: [40, 40], iconAnchor: [20, 20] })
}

function getMapsUrl(lat, lng) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng
}

// Leaflet calcula el tamaño del mapa en el momento en que se monta el contenedor.
// En mobile, el contenedor puede cambiar de tamaño después de ese primer cálculo
// (por el layout responsive, el teclado virtual, el cambio de orientación, o
// simplemente porque el viewport tarda un frame en asentarse), y el mapa se
// queda "congelado" con el tamaño viejo, mostrando solo una parte o vacío.
// Este componente fuerza a Leaflet a recalcular el tamaño en esos casos.
function MapSizeFix() {
  const map = useMap()

  useEffect(() => {
    // Recalcular en el próximo frame tras montar (cubre el primer render en mobile)
    const raf = requestAnimationFrame(() => map.invalidateSize())

    // Recalcular también un poco después, por si el layout tarda en asentarse
    const t1 = setTimeout(() => map.invalidateSize(), 200)
    const t2 = setTimeout(() => map.invalidateSize(), 600)

    // Recalcular ante resize / cambio de orientación (mobile)
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

  const linkStyle = {
    display: 'block',
    marginTop: '16px',
    background: '#0B4390',
    color: 'white',
    borderRadius: '8px',
    padding: '10px',
    fontFamily: 'sans-serif',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center',
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5' }}>

      <div style={{ background: '#0B4390', padding: '32px 24px 24px', color: 'white' }}>
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
              { valor: '900', label: 'km max · Algeciras' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '40px', fontWeight: '700', lineHeight: 1 }}>{s.valor}</div>
                <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
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
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <div style={{ background: sel.color, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={sel.escudo} alt={sel.club} style={{ width: '48px', height: '48px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '4px' }} />
                <div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
                    {'#' + sel.num + ' · ' + sel.ciudad}
                  </div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '18px', fontWeight: '700', color: 'white', textTransform: 'uppercase' }}>
                    {sel.club}
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#666' }}>Distancia desde Zaragoza</span>
                  <span style={{ fontFamily: 'Humane, sans-serif', fontSize: '32px', fontWeight: '700', color: sel.color }}>{sel.km} km</span>
                </div>
                <span style={{ background: sel.color, color: 'white', borderRadius: '4px', padding: '3px 10px', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700' }}>
                  {sel.label}
                </span>
                {sel.nota && (
                  <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#999', marginTop: '8px' }}>{sel.nota}</div>
                )}
                <a href={getMapsUrl(sel.lat, sel.lng)} target="_blank" rel="noopener noreferrer" style={linkStyle}>
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
              style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '4px solid ' + d.color }}
            >
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={d.escudo} alt={d.club} style={{ width: '44px', height: '44px', objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {'#' + d.num + ' · ' + d.ciudad}
                  </div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '15px', fontWeight: '700', color: '#0B4390', textTransform: 'uppercase', lineHeight: 1.1, margin: '2px 0 4px' }}>
                    {d.club}
                  </div>
                  <span style={{ background: d.color, color: 'white', borderRadius: '4px', padding: '2px 7px', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: '700' }}>
                    {d.label}
                  </span>
                  {d.nota && (
                    <div style={{ fontFamily: 'sans-serif', fontSize: '9px', color: '#aaa', marginTop: '3px' }}>{d.nota}</div>
                  )}
                </div>
                <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '40px', fontWeight: '700', color: d.color, lineHeight: 1, flexShrink: 0, textAlign: 'right' }}>
                  {d.km}
                  <div style={{ fontSize: '11px', fontFamily: 'sans-serif', fontWeight: '400', color: '#aaa' }}>km</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        /* En desktop el MapContainer ya trae su propio height:500px inline
           (fijado por style={{ height: '500px', width: '100%' }}), así que
           aquí NO tocamos width/height del .leaflet-container a nivel global:
           una regla 100%/100% heredaría de un padre (.ontour-map) sin altura
           explícita y el mapa colapsaría a 0px, justo el bug que veíamos en
           desktop. Solo forzamos un tamaño explícito dentro del breakpoint
           mobile/tablet, donde sí hace falta. */

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