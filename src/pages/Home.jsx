import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: '#0B4390',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '32px',
      padding: '40px 24px',
    }}>
      <img
        src="/PALMADAS_AL_VIENTO_HORIZONTAL 3.png"
        alt="Palmadas al Viento"
        style={{ width: '320px', maxWidth: '90vw' }}
      />

      <p style={{
        color: 'rgba(255,255,255,0.75)',
        fontSize: '18px',
        textAlign: 'center',
        maxWidth: '480px',
        margin: 0,
      }}>
        La web del Real Zaragoza. Crea tu alineación, valora jugadores y mucho más.
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/lineup')}
          style={{
            background: '#f5c400',
            color: '#0B4390',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Crear alineación
        </button>
        <button
          onClick={() => navigate('/tierlist')}
          style={{
            background: 'transparent',
            color: '#ffffff',
            border: '2px solid rgba(255,255,255,0.4)',
            borderRadius: '8px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Tier List
        </button>
      </div>
    </div>
  )
}