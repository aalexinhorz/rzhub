import { useState } from 'react'

const ICS_URL = 'https://rzhub.es/calendario.ics' // Cambiar cuando esté listo

const PARTIDOS_PLACEHOLDER = [
  { jornada: 1, rival: 'Por confirmar', fecha: '—', hora: '—', sede: 'local' },
  { jornada: 2, rival: 'Por confirmar', fecha: '—', hora: '—', sede: 'visitante' },
]

export default function Calendario() {
  const [copiado, setCopiado] = useState(false)

  const handleApple = () => {
    window.location.href = `webcal://${ICS_URL.replace('https://', '')}`
  }

  const handleGoogle = () => {
    const url = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(ICS_URL)}`
    window.open(url, '_blank')
  }

  const handleCopiar = () => {
    navigator.clipboard.writeText(ICS_URL).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'Archivo, sans-serif',
      paddingBottom: '80px',
    }}>

      {/* HERO */}
      <div style={{
        backgroundColor: '#0B4390',
        padding: '60px 24px 50px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <p style={{
          fontFamily: 'Archivo, sans-serif',
          fontWeight: '300',
          fontSize: 'clamp(12px, 2.5vw, 14px)',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.6)',
          margin: '0 0 12px',
        }}>
          Real Zaragoza · 1ª RFEF 26/27
        </p>
        <h1 style={{
          fontFamily: 'Humane, sans-serif',
          fontSize: 'clamp(72px, 18vw, 140px)',
          fontWeight: '700',
          lineHeight: 0.9,
          margin: '0 0 20px',
          letterSpacing: '8px',
          textTransform: 'uppercase',
        }}>
          CALENDARIO
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.75)',
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight: 1.5,
          fontFamily: 'Archivo, sans-serif',
        }}>
          Añade todos los partidos del Zaragoza directamente a tu calendario. Se actualiza solo cuando hay cambios.
        </p>
      </div>

      {/* BOTONES SUSCRIPCIÓN */}
      <div style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '48px 24px 0',
      }}>
        <p style={{
          fontFamily: 'Archivo, sans-serif',
          fontWeight: '300',
          fontSize: '13px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          Suscríbete para tener todos los partidos del Real Zaragoza a mano
        </p>

        {/* Apple Calendar */}
        <button
          onClick={handleApple}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            width: '100%',
            padding: '18px 22px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            marginBottom: '12px',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#222'
            e.currentTarget.style.borderColor = '#0B4390'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#1a1a1a'
            e.currentTarget.style.borderColor = '#2a2a2a'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Archivo, sans-serif', marginBottom: '2px' }}>
              Añadir a
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Archivo, sans-serif' }}>
              Apple Calendar
            </div>
          </div>
          <svg style={{ marginLeft: 'auto', opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        {/* Google Calendar */}
        <button
          onClick={handleGoogle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            width: '100%',
            padding: '18px 22px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            marginBottom: '12px',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#222'
            e.currentTarget.style.borderColor = '#0B4390'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#1a1a1a'
            e.currentTarget.style.borderColor = '#2a2a2a'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Archivo, sans-serif', marginBottom: '2px' }}>
              Añadir a
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Archivo, sans-serif' }}>
              Google Calendar
            </div>
          </div>
          <svg style={{ marginLeft: 'auto', opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        {/* Copiar URL */}
        <button
          onClick={handleCopiar}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            width: '100%',
            padding: '14px 22px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'Archivo, sans-serif',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#444'
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#2a2a2a'
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {copiado ? '¡URL copiada!' : 'Copiar URL del calendario (.ics)'}
        </button>

        {/* Info */}
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)',
          textAlign: 'center',
          marginTop: '20px',
          lineHeight: 1.6,
          fontFamily: 'Archivo, sans-serif',
          fontWeight: '300',
        }}>
          Compatible con Apple Calendar, Google Calendar, Outlook y cualquier app que soporte calendarios ICS.
          Los cambios de horario se actualizan automáticamente.
        </p>
      </div>

      {/* PRÓXIMOS PARTIDOS */}
      <div style={{
        maxWidth: '560px',
        margin: '56px auto 0',
        padding: '0 24px',
      }}>
        <p style={{
          fontFamily: 'Archivo, sans-serif',
          fontWeight: '300',
          fontSize: '13px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '16px',
        }}>
          Partidos
        </p>

        <div style={{
          backgroundColor: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {PARTIDOS_PLACEHOLDER.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: i < PARTIDOS_PLACEHOLDER.length - 1 ? '1px solid #1e1e1e' : 'none',
                gap: '16px',
              }}
            >
              <span style={{
                fontFamily: 'Archivo, sans-serif',
                fontWeight: '300',
                fontSize: '11px',
                letterSpacing: '2px',
                color: 'rgba(255,255,255,0.25)',
                minWidth: '28px',
                textTransform: 'uppercase',
              }}>
                J{p.jornada}
              </span>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: p.sede === 'local' ? '#0B4390' : '#333',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: 'Archivo, sans-serif',
                fontWeight: '700',
                fontSize: '15px',
                flex: 1,
                color: 'rgba(255,255,255,0.7)',
              }}>
                {p.rival}
              </span>
              <span style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: 'Archivo, sans-serif',
                fontWeight: '300',
              }}>
                {p.fecha}
              </span>
            </div>
          ))}

          <div style={{
            padding: '14px 20px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'Archivo, sans-serif',
            fontWeight: '300',
            borderTop: '1px solid #1e1e1e',
          }}>
            Calendario completo disponible cuando se publique oficialmente
          </div>
        </div>
      </div>

    </div>
  )
}