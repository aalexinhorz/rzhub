import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signInWithGoogle, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/lineup', label: 'Alineación' },
    { to: '/tierlist', label: 'Tier List' },
    { to: '/comunidad', label: 'Comunidad' },
  ]

  const nombre = profile?.username || profile?.name || user?.user_metadata?.name || user?.email || ''
  const avatarUrl = profile?.avatar_url || null
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <div style={{ background: '#0B4390', padding: '0 20px', display: 'flex', alignItems: 'center', height: '60px', position: 'relative', zIndex: 100 }}>
        <img src="/PALMADAS_AL_VIENTO_HORIZONTAL 3.png" alt="Palmadas al Viento" style={{ height: '32px', flexShrink: 0 }} />

        <nav style={{ display: 'flex', gap: '4px', marginLeft: '20px', flex: 1 }} className="desktop-nav">
          {links.map(link => (
            <Link key={link.to} to={link.to} style={{
              color: location.pathname === link.to ? '#f5c400' : 'rgba(255,255,255,0.75)',
              textDecoration: 'none', fontWeight: location.pathname === link.to ? '700' : '400',
              fontSize: '14px', padding: '6px 10px', borderRadius: '6px',
              borderBottom: location.pathname === link.to ? '2px solid #f5c400' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-auth">
          {user ? (
            <>
              <div onClick={() => navigate('/perfil')} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #f5c400', background: '#f5c400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#0B4390', fontFamily: 'sans-serif', fontWeight: '700', fontSize: '11px' }}>{iniciales}</span>
                  )}
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
            <button onClick={signInWithGoogle} style={{ background: '#f5c400', border: 'none', color: '#0B4390', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', fontFamily: 'sans-serif', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Entrar con Google
            </button>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger" style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', marginLeft: 'auto', padding: '4px', display: 'none' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div style={{ background: '#0B4390', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 99, position: 'relative' }} className="mobile-menu">
          {links.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} style={{
              color: location.pathname === link.to ? '#f5c400' : 'rgba(255,255,255,0.85)',
              textDecoration: 'none', fontWeight: location.pathname === link.to ? '700' : '400',
              fontSize: '16px', padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: 'sans-serif',
            }}>
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: '12px' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => { navigate('/perfil'); setMenuOpen(false) }} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '12px', fontSize: '15px', fontFamily: 'sans-serif', fontWeight: '600', cursor: 'pointer' }}>
                  Mi perfil
                </button>
                <button onClick={() => { signOut(); setMenuOpen(false) }} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '8px', padding: '12px', fontSize: '15px', fontFamily: 'sans-serif', cursor: 'pointer' }}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button onClick={() => { signInWithGoogle(); setMenuOpen(false) }} style={{ width: '100%', background: '#f5c400', border: 'none', color: '#0B4390', borderRadius: '8px', padding: '12px', fontSize: '15px', fontFamily: 'sans-serif', fontWeight: '700', cursor: 'pointer' }}>
                Entrar con Google
              </button>
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