import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Navbar() {
  const location = useLocation()
  const { user, signInWithGoogle, signInWithTwitter, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/lineup', label: 'Alineación' },
    { to: '/tierlist', label: 'Tier List' },
    { to: '/comunidad', label: 'Comunidad' },
  ]

  const nombre = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || ''
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <div style={{
        background: '#0B4390',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        height: '60px',
        position: 'relative',
        zIndex: 100,
      }}>
        <img
          src="/PALMADAS_AL_VIENTO_HORIZONTAL 3.png"
          alt="Palmadas al Viento"
          style={{ height: '32px', flexShrink: 0 }}
        />

        <nav style={{ display: 'flex', gap: '4px', marginLeft: '20px', flex: 1 }} className="desktop-nav">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                color: location.pathname === link.to ? '#f5c400' : 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                fontWeight: location.pathname === link.to ? '700' : '400',
                fontSize: '14px',
                padding: '6px 10px',
                borderRadius: '6px',
                borderBottom: location.pathname === link.to ? '2px solid #f5c400' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-auth">
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #f5c400', background: '#f5c400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#0B4390', fontFamily: 'sans-serif', fontWeight: '700', fontSize: '11px' }}>{iniciales}</span>
                </div>
                <span style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {nombre.split(' ')[0]}
                </span>
              </div>
              <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.75)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontFamily: 'sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={signInWithGoogle} style={{ background: '#f5c400', border: 'none', color: '#0B4390', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', fontFamily: 'sans-serif', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Entrar con Google
              </button>
              <button onClick={signInWithTwitter} style={{ background: 'black', border: 'none', color: 'white', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', fontFamily: 'sans-serif', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Entrar con X
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="hamburger"
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', marginLeft: 'auto', padding: '4px', display: 'none' }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div style={{
          background: '#0B4390',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 99,
          position: 'relative',
        }} className="mobile-menu">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                color: location.pathname === link.to ? '#f5c400' : 'rgba(255,255,255,0.85)',
                textDecoration: 'none',
                fontWeight: location.pathname === link.to ? '700' : '400',
                fontSize: '16px',
                padding: '10px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'sans-serif',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f5c400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#0B4390', fontWeight: '700', fontSize: '11px' }}>{iniciales}</span>
                  </div>
                  <span style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '14px' }}>{nombre.split(' ')[0]}</span>
                </div>
                <button onClick={() => { signOut(); setMenuOpen(false) }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => { signInWithGoogle(); setMenuOpen(false) }} style={{ width: '100%', background: '#f5c400', border: 'none', color: '#0B4390', borderRadius: '8px', padding: '12px', fontSize: '15px', fontFamily: 'sans-serif', fontWeight: '700', cursor: 'pointer' }}>
                  Entrar con Google
                </button>
                <button onClick={() => { signInWithTwitter(); setMenuOpen(false) }} style={{ width: '100%', background: 'black', border: 'none', color: 'white', borderRadius: '8px', padding: '12px', fontSize: '15px', fontFamily: 'sans-serif', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Entrar con X
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .desktop-auth { display: none !important; }
          .hamburger { display: flex !important; }
        }
        @media (min-width: 641px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </>
  )
}