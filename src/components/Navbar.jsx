import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useLiveStream from '../hooks/useLiveStream'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signInWithGoogle, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const live = useLiveStream()

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/lineup', label: 'Alineación' },
    { to: '/tierlist', label: 'Tier List' },
    { to: '/comunidad', label: 'Comunidad' },
    { to: '/noticias', label: 'Noticias' },
    { to: '/calendario', label: 'Calendario' },
    { to: '/on-tour', label: 'On Tour' },
  ]

  const nombre = profile?.username || profile?.name || user?.user_metadata?.name || user?.email || ''
  const avatarUrl = profile?.avatar_url || null
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <div style={{ background: '#0B4390', padding: '0 20px', display: 'flex', alignItems: 'center', height: '60px', position: 'relative', zIndex: 100 }}>
        <Link to="/">
          <img src="/PALMADAS_AL_VIENTO_HORIZONTAL 3.png" alt="Palmadas al Viento" style={{ height: '32px', flexShrink: 0, display: 'block' }} />
        </Link>

        <nav style={{ display: 'flex', gap: '4px', marginLeft: '20px', flex: 1, alignItems: 'center' }} className="desktop-nav">
          {links.map(link => (
            <Link key={link.to} to={link.to} style={{
              color: location.pathname === link.to ? '#ffffff' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: location.pathname === link.to ? '700' : '500',
              fontFamily: 'Archivo, sans-serif',
              background: location.pathname === link.to ? 'rgba(255,255,255,0.15)' : 'transparent',
              whiteSpace: 'nowrap',
            }}>
              {link.label}
            </Link>
          ))}

          {live && (
            <a href={live.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#fff', textDecoration: 'none',
              padding: '5px 10px', borderRadius: '6px',
              fontSize: '13px', fontWeight: '700',
              fontFamily: 'Archivo, sans-serif',
              background: '#e53e3e',
              marginLeft: '4px',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              EN DIRECTO
            </a>
          )}
        </nav>

        {/* Usuario / Login */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '20px', padding: '5px 12px 5px 5px',
                  cursor: 'pointer', color: 'white',
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0B4390' }}>{iniciales}</span>
                  </div>
                )}
                <span style={{ fontSize: '13px', fontFamily: 'Archivo, sans-serif', fontWeight: '600' }}>
                  {nombre.split(' ')[0]}
                </span>
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '42px',
                  background: 'white', borderRadius: '10px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  minWidth: '160px', zIndex: 200, overflow: 'hidden',
                }}>
                  <button onClick={() => { navigate('/perfil'); setMenuOpen(false) }} style={{
                    display: 'block', width: '100%', padding: '12px 16px',
                    background: 'none', border: 'none', textAlign: 'left',
                    fontSize: '14px', fontFamily: 'Archivo, sans-serif',
                    cursor: 'pointer', color: '#333',
                  }}>
                    Mi perfil
                  </button>
                  {profile?.es_redactor && (
                    <button onClick={() => { navigate('/redaccion'); setMenuOpen(false) }} style={{
                      display: 'block', width: '100%', padding: '12px 16px',
                      background: 'none', border: 'none', textAlign: 'left',
                      fontSize: '14px', fontFamily: 'Archivo, sans-serif',
                      cursor: 'pointer', color: '#333',
                    }}>
                      Redacción
                    </button>
                  )}
                  <button onClick={() => { signOut(); setMenuOpen(false) }} style={{
                    display: 'block', width: '100%', padding: '12px 16px',
                    background: 'none', border: 'none', textAlign: 'left',
                    fontSize: '14px', fontFamily: 'Archivo, sans-serif',
                    cursor: 'pointer', color: '#e53e3e',
                    borderTop: '1px solid #f0f0f0',
                  }}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={signInWithGoogle} style={{
              background: 'white', color: '#0B4390', border: 'none',
              borderRadius: '8px', padding: '7px 14px',
              fontSize: '13px', fontWeight: '700',
              fontFamily: 'Archivo, sans-serif', cursor: 'pointer',
            }}>
              Iniciar sesión
            </button>
          )}
        </div>

        {/* Hamburguesa móvil */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="mobile-menu-btn"
          style={{
            display: 'none', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px', marginLeft: '12px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          background: '#0B4390', padding: '8px 0 16px',
          display: 'none', flexDirection: 'column',
          position: 'relative', zIndex: 99,
        }}>
          {links.map(link => (
            <Link key={link.to} to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                color: location.pathname === link.to ? '#ffffff' : 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: location.pathname === link.to ? '700' : '400',
                fontFamily: 'Archivo, sans-serif',
                borderLeft: location.pathname === link.to ? '3px solid white' : '3px solid transparent',
              }}>
              {link.label}
            </Link>
          ))}
          {live && (
            <a href={live.url} target="_blank" rel="noopener noreferrer" style={{
              color: '#fff', textDecoration: 'none',
              padding: '12px 20px', fontSize: '15px',
              fontWeight: '700', fontFamily: 'Archivo, sans-serif',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e53e3e', display: 'inline-block' }} />
              EN DIRECTO
            </a>
          )}
          {user ? (
            <>
              <button onClick={() => { navigate('/perfil'); setMenuOpen(false) }} style={{
                background: 'none', border: 'none', textAlign: 'left',
                color: 'rgba(255,255,255,0.75)', padding: '12px 20px',
                fontSize: '15px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer',
                borderLeft: '3px solid transparent',
              }}>
                Mi perfil
              </button>
              {profile?.es_redactor && (
                <button onClick={() => { navigate('/redaccion'); setMenuOpen(false) }} style={{
                  background: 'none', border: 'none', textAlign: 'left',
                  color: 'rgba(255,255,255,0.75)', padding: '12px 20px',
                  fontSize: '15px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer',
                  borderLeft: '3px solid transparent',
                }}>
                  Redacción
                </button>
              )}
              <button onClick={() => { signOut(); setMenuOpen(false) }} style={{
                background: 'none', border: 'none', textAlign: 'left',
                color: 'rgba(255,100,100,0.9)', padding: '12px 20px',
                fontSize: '15px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer',
                borderLeft: '3px solid transparent',
              }}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <button onClick={() => { signInWithGoogle(); setMenuOpen(false) }} style={{
              background: 'white', color: '#0B4390', border: 'none',
              margin: '8px 20px 0', borderRadius: '8px', padding: '10px',
              fontSize: '14px', fontWeight: '700',
              fontFamily: 'Archivo, sans-serif', cursor: 'pointer',
            }}>
              Iniciar sesión
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-menu { display: flex !important; }
        }
      `}</style>
    </>
  )
}