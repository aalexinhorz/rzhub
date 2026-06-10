import { Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Navbar() {
  const location = useLocation()
  const { user, signInWithGoogle, signOut } = useAuth()

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/lineup', label: 'Alineación' },
    { to: '/tierlist', label: 'Tier List' },
    { to: '/comunidad', label: 'Comunidad' },
  ]

  const nombre = user?.user_metadata?.name || user?.email || ''
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{
      background: '#0B4390',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      height: '60px',
      gap: '32px',
    }}>
      <img
        src="/PALMADAS_AL_VIENTO_HORIZONTAL 3.png"
        alt="Palmadas al Viento"
        style={{ height: '36px' }}
      />
      <nav style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              color: location.pathname === link.to ? '#f5c400' : 'rgba(255,255,255,0.75)',
              textDecoration: 'none',
              fontWeight: location.pathname === link.to ? '700' : '400',
              fontSize: '15px',
              padding: '6px 12px',
              borderRadius: '6px',
              borderBottom: location.pathname === link.to ? '2px solid #f5c400' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: '2px solid #f5c400', background: '#f5c400',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: '#0B4390', fontFamily: 'sans-serif', fontWeight: '700', fontSize: '13px' }}>
                  {iniciales}
                </span>
              </div>
              <span style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600' }}>
                {nombre.split(' ')[0]}
              </span>
            </div>
            <button
              onClick={signOut}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
                color: 'rgba(255,255,255,0.75)', borderRadius: '6px', padding: '6px 14px',
                fontSize: '13px', fontFamily: 'sans-serif', cursor: 'pointer',
              }}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <button
            onClick={signInWithGoogle}
            style={{
              background: '#f5c400', border: 'none', color: '#0B4390',
              borderRadius: '6px', padding: '8px 18px',
              fontSize: '14px', fontFamily: 'sans-serif', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#0B4390" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#0B4390" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#0B4390" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#0B4390" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar con Google
          </button>
        )}
      </div>
    </div>
  )
}