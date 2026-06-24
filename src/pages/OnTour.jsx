const DESPLAZAMIENTOS = [
  { num: 1,  club: 'SD Huesca',             ciudad: 'Huesca',            km: 74,  escudo: '/escudos/Logo_of_SD_Huesca.svg' },
  { num: 2,  club: 'CD Teruel',             ciudad: 'Teruel',            km: 185, escudo: '/escudos/CD_Teruel_logo.svg' },
  { num: 3,  club: 'Nàstic de Tarragona',   ciudad: 'Tarragona',         km: 235, escudo: '/escudos/Gimnastic_de_Tarragona_logo.svg' },
  { num: 4,  club: 'UE Sant Andreu',        ciudad: 'Barcelona',         km: 295, escudo: '/escudos/ue-sant-andreu-vector-logo.png' },
  { num: 5,  club: 'CE Europa',             ciudad: 'Barcelona',         km: 295, escudo: '/escudos/Club_Esportiu_Europa.svg' },
  { num: 6,  club: 'Villarreal B',          ciudad: 'Villarreal',        km: 295, escudo: '/escudos/Villarreal_CF_logo-en.svg' },
  { num: 7,  club: 'Rayo Majadahonda',      ciudad: 'Majadahonda',       km: 310, escudo: '/escudos/Rayo_Majadahonda_(logo).svg' },
  { num: 8,  club: 'AD Alcorcón',           ciudad: 'Alcorcón',          km: 315, escudo: '/escudos/AD_Alcorcon_logo.svg' },
  { num: 9,  club: 'Atleti B',              ciudad: 'Alcalá de Henares', km: 320, escudo: '/escudos/Atletico_Madrid_Logo_2024.svg' },
  { num: 10, club: 'Real Madrid B',         ciudad: 'Valdebebas',        km: 325, escudo: '/escudos/Real_Madrid_CF.svg' },
  { num: 11, club: 'Hércules',              ciudad: 'Alicante',          km: 470, escudo: '/escudos/Hercules_CF_crest.svg' },
  { num: 12, club: 'UD Ibiza',              ciudad: 'Ibiza',             km: 480, escudo: '/escudos/UD_Ibiza_logo.svg', nota: 'Zgz→Valencia ~330 + ferry ~150' },
  { num: 13, club: 'Real Murcia',           ciudad: 'Murcia',            km: 535, escudo: '/escudos/Real_Murcia_CF_logo.svg' },
  { num: 14, club: 'Cartagena',             ciudad: 'Cartagena',         km: 560, escudo: '/escudos/spain_fc-cartagena.football-logos.cc.svg' },
  { num: 15, club: 'Águilas FC',            ciudad: 'Águilas',           km: 620, escudo: '/escudos/logo.svg' },
  { num: 16, club: 'Real Jaén',             ciudad: 'Jaén',              km: 630, escudo: '/escudos/spain_real-jaen-cf.football-logos.cc.svg' },
  { num: 17, club: 'Antequera',             ciudad: 'Antequera',         km: 840, escudo: '/escudos/spain_antequera.football-logos.cc.svg' },
  { num: 18, club: 'Juventud Torremolinos', ciudad: 'Torremolinos',      km: 870, escudo: '/escudos/spain_juventud-torremolinos.football-logos.cc.svg' },
  { num: 19, club: 'Algeciras',             ciudad: 'Algeciras',         km: 900, escudo: '/escudos/spain_algeciras.football-logos.cc.svg' },
]

function getColor(km) {
  if (km < 200) return '#27ae60'
  if (km < 350) return '#f5c400'
  if (km < 600) return '#e67e22'
  return '#c0392b'
}

function getLabel(km) {
  if (km < 200) return 'Corto'
  if (km < 350) return 'Medio'
  if (km < 600) return 'Largo'
  return 'Épico'
}

export default function OnTour() {
  const total = DESPLAZAMIENTOS.reduce((acc, d) => acc + d.km, 0)

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5' }}>
      <div style={{ background: '#0B4390', padding: '32px 24px 24px', color: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(52px, 10vw, 96px)', textTransform: 'uppercase', lineHeight: 1, margin: '0 0 8px 0' }}>
            On Tour
          </h1>
          <p style={{ fontFamily: 'sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 20px 0' }}>
            Desplazamientos del Real Zaragoza · Temporada 26/27
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '36px', fontWeight: '700', lineHeight: 1 }}>{DESPLAZAMIENTOS.length}</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Desplazamientos</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '36px', fontWeight: '700', lineHeight: 1 }}>{total.toLocaleString()}</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>km totales (ida)</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '36px', fontWeight: '700', lineHeight: 1 }}>900</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>km máx · Algeciras</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {DESPLAZAMIENTOS.map(d => {
            const color = getColor(d.km)
            return (
              <div key={d.num} style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ height: '4px', background: color }} />
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={d.escudo}
                    alt={d.club}
                    style={{ width: '48px', height: '48px', objectFit: 'contain', flexShrink: 0 }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                      #{d.num} · {d.ciudad}
                    </div>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '16px', fontWeight: '700', color: '#0B4390', textTransform: 'uppercase', lineHeight: 1, marginBottom: '6px' }}>
                      {d.club}
                    </div>
                    {d.nota && (
                      <div style={{ fontFamily: 'sans-serif', fontSize: '10px', color: '#999', marginBottom: '4px' }}>
                        {d.nota}
                      </div>
                    )}
                    <span style={{ background: color, color: 'white', borderRadius: '6px', padding: '2px 8px', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: '700' }}>
                      {getLabel(d.km)}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Humane, sans-serif', fontSize: '38px', fontWeight: '700', color: color, lineHeight: 1, flexShrink: 0, textAlign: 'right' }}>
                    {d.km}
                    <div style={{ fontSize: '12px', fontFamily: 'sans-serif', fontWeight: '400', color: '#999' }}>km</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}