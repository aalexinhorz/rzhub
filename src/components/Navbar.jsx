import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useLiveStream from '../hooks/useLiveStream'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/', label: 'Inicio', exact: true },
  { to: '/lineup', label: 'Line-UP' },
  { to: '/mercado', label: 'Mercado' },
  { to: '/calendario', label: 'Calendario' },
  { to: '/porra', label: 'Porra' },
  { to: '/on-tour', label: 'On Tour', overflow: true },
  { to: '/rumores', label: 'Noticias' },
  { to: '/tierlist', label: 'TierMaker', overflow: true },
  { to: '/comunidad', label: 'Comunidad', overflow: true },
]

const OVERFLOW_LINKS = NAV_LINKS.filter(l => l.overflow)

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signInWithGoogle, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMounted, setMobileMounted] = useState(false)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const mobileOpenFrameRef = useRef([null, null])
  const mobileUnmountTimeoutRef = useRef(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [masOpen, setMasOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const masRef = useRef(null)

  const live = useLiveStream()

  // Fondo con blur al hacer scroll (efecto sticky "premium").
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cierra el dropdown "Más" (tablet) al hacer click fuera.
  useEffect(() => {
    if (!masOpen) return
    const onClickOutside = (e) => {
      if (masRef.current && !masRef.current.contains(e.target)) setMasOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [masOpen])

  // Bloquea el scroll de la página de fondo mientras el menú mobile está
  // abierto (evita el scroll "por detrás" del menú, típico en iOS/Safari
  // donde un simple overflow:hidden no basta). Guardamos la posición de
  // scroll para restaurarla exactamente al cerrar.
  useEffect(() => {
    if (!menuOpen) return

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [menuOpen])

  const nombre = profile?.username || profile?.name || user?.user_metadata?.name || user?.email || ''
  const avatarUrl = profile?.avatar_url || null
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const isActive = (link) => (link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to))

  const openMobileMenu = () => {
    clearTimeout(mobileUnmountTimeoutRef.current)
    cancelAnimationFrame(mobileOpenFrameRef.current[0])
    cancelAnimationFrame(mobileOpenFrameRef.current[1])
    setMenuOpen(true)
    setMobilePanelOpen(false) // aseguramos que se monte cerrado
    setMobileMounted(true)
    mobileOpenFrameRef.current[0] = requestAnimationFrame(() => {
      mobileOpenFrameRef.current[1] = requestAnimationFrame(() => setMobilePanelOpen(true))
    })
  }

  const closeMobileMenu = () => {
    cancelAnimationFrame(mobileOpenFrameRef.current[0])
    cancelAnimationFrame(mobileOpenFrameRef.current[1])
    setMenuOpen(false)
    setMobilePanelOpen(false)
    mobileUnmountTimeoutRef.current = setTimeout(() => setMobileMounted(false), 220)
  }

  const toggleMobileMenu = () => {
    if (menuOpen) closeMobileMenu()
    else openMobileMenu()
  }

  return (
    <>
      <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="header__container">
          <Link to="/" className="header__logo" onClick={closeMobileMenu}>
            <img src="/LOGO_RZHUB.png" alt="RZ Hub" />
          </Link>

          <nav className="header__nav">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'header__nav-link',
                  link.overflow ? 'header__nav-link--overflow' : '',
                  isActive(link) ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
              >
                {link.label}
              </Link>
            ))}

            <div className="header__more" ref={masRef}>
              <button type="button" className="header__more-trigger" onClick={() => setMasOpen(o => !o)} aria-expanded={masOpen}>
                Más
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: masOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {masOpen && (
                <div className="header__more-panel">
                  {OVERFLOW_LINKS.map(link => (
                    <Link key={link.to} to={link.to} onClick={() => setMasOpen(false)}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {live && (
              <a href={live.url} target="_blank" rel="noopener noreferrer" className="rz-badge rz-badge--live header__live">
                <span className="rz-live-dot" />
                EN DIRECTO
              </a>
            )}
          </nav>

          <div className="header__actions">
            {user ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setUserMenuOpen(o => !o)} className="header__user-btn">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#0a3878' }}>{iniciales}</span>
                    </div>
                  )}
                  <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-semibold)' }}>{nombre.split(' ')[0]}</span>
                </button>
                {userMenuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '52px', background: 'white', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '160px', zIndex: 300, overflow: 'hidden' }}>
                    <button onClick={() => { navigate('/perfil'); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 'var(--text-md)', fontFamily: 'var(--font-body)', cursor: 'pointer', color: '#333' }}>
                      Mi perfil
                    </button>
                    {profile?.es_redactor && (
                      <button onClick={() => { navigate('/redaccion'); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 'var(--text-md)', fontFamily: 'var(--font-body)', cursor: 'pointer', color: '#333' }}>
                        Redacción
                      </button>
                    )}
                    <button onClick={() => { signOut(); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 'var(--text-md)', fontFamily: 'var(--font-body)', cursor: 'pointer', color: 'var(--rz-red)', borderTop: '1px solid #f0f0f0' }}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => navigate('/contacto')} className="header__login">
                  Contáctanos
                </button>
                <button onClick={signInWithGoogle} className="header__register">
                  Regístrate gratis →
                </button>
              </>
            )}
          </div>

          <button onClick={toggleMobileMenu} className="header__menu-btn" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>
            {/* Barras HTML en vez de <line> de SVG: el transform-origin de un elemento
                normal no depende de transform-box, así que el pivote de rotación
                es consistente en todos los navegadores (incluido Safari). */}
            <span style={{
              position: 'absolute', left: '13px', top: '15px', width: '18px', height: '2px',
              background: 'white', borderRadius: '1px',
              transformOrigin: '0 0',
              transform: menuOpen
                ? 'translate(9px, 7px) rotate(45deg) translateY(6px) translate(-9px, -7px)'
                : 'translate(9px, 7px) rotate(0deg) translate(-9px, -7px)',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
            <span style={{
              position: 'absolute', left: '13px', top: '21px', width: '18px', height: '2px',
              background: 'white', borderRadius: '1px',
              opacity: menuOpen ? 0 : 1,
              transition: 'opacity 0.15s ease',
            }} />
            <span style={{
              position: 'absolute', left: '13px', top: '27px', width: '18px', height: '2px',
              background: 'white', borderRadius: '1px',
              transformOrigin: '0 0',
              transform: menuOpen
                ? 'translate(9px, -5px) rotate(-45deg) translateY(-6px) translate(-9px, 5px)'
                : 'translate(9px, -5px) rotate(0deg) translate(-9px, 5px)',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </button>
        </div>
      </header>

      {mobileMounted && (
        <div className="mobile-menu" style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          background: '#002263', zIndex: 2150, overflowY: 'auto',
          overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch',
          display: 'flex', flexDirection: 'column', padding: 'var(--space-4) 0 var(--space-8)',
          opacity: mobilePanelOpen ? 1 : 0,
          transform: mobilePanelOpen ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} onClick={closeMobileMenu} style={{
              color: isActive(link) ? '#ffffff' : 'rgba(255,255,255,0.75)',
              textDecoration: 'none', padding: '12px var(--space-6)', fontSize: 'var(--text-lg)',
              fontWeight: isActive(link) ? 'var(--weight-bold)' : 'var(--weight-regular)',
              fontFamily: 'var(--font-body)',
              borderLeft: isActive(link) ? '3px solid var(--rz-yellow)' : '3px solid transparent',
              display: 'block', minHeight: '44px', boxSizing: 'border-box',
            }}>
              {link.label}
            </Link>
          ))}

          {live && (
            <a href={live.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', padding: '12px var(--space-6)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <span className="rz-live-dot" style={{ background: 'var(--rz-red)' }} />
              EN DIRECTO
            </a>
          )}

          <div style={{ margin: 'var(--space-6) var(--space-6) 0', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 'var(--space-5)' }}>
            {user ? (
              <>
                <button onClick={() => { navigate('/perfil'); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'rgba(255,255,255,0.75)', padding: '10px 0', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  Mi perfil
                </button>
                {profile?.es_redactor && (
                  <button onClick={() => { navigate('/redaccion'); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'rgba(255,255,255,0.75)', padding: '10px 0', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                    Redacción
                  </button>
                )}
                <button onClick={() => { signOut(); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-md)', textAlign: 'center', color: '#ff6464', padding: '12px', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-body)', cursor: 'pointer', marginTop: 'var(--space-2)' }}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate('/contacto'); closeMobileMenu() }} className="header__login" style={{ display: 'flex', width: '100%', marginBottom: 'var(--space-3)' }}>
                  Contáctanos
                </button>
                <button onClick={() => { signInWithGoogle(); closeMobileMenu() }} className="header__register" style={{ display: 'flex', width: '100%' }}>
                  Regístrate gratis →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
