/* ============================================================
   LEGAL PAGE — layout compartido por Términos, Privacidad y Ayuda:
   mismo título grande + fecha de actualización + lista de secciones
   con encabezado y párrafos. Puramente presentacional, contenido vía
   props para no duplicar el layout en cada página.
   ============================================================ */
export default function LegalPage({ title, updated, sections }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#060D1A', padding: '56px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <p style={{ color: '#FFC800', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
          RZ HUB
        </p>
        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(40px, 7vw, 64px)', color: '#ffffff', textTransform: 'uppercase', margin: 0, lineHeight: 0.95, letterSpacing: '-1px' }}>
          {title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Archivo, sans-serif', fontSize: '13px', margin: '14px 0 48px' }}>
          Última actualización: {updated}
        </p>

        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '700', fontSize: '18px', color: '#ffffff', margin: '0 0 12px' }}>
              {s.heading}
            </h2>
            {s.body.map((p, j) => (
              <p key={j} style={{ fontFamily: 'Archivo, sans-serif', fontSize: '14.5px', lineHeight: '1.7', color: 'rgba(255,255,255,0.65)', margin: '0 0 10px' }}>
                {p}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
