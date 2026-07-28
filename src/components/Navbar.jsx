import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useLiveStream from '../hooks/useLiveStream'
import './Navbar.css'

// Agrupado por intención (jugar/crear · consultar el equipo · comunidad),
// en vez de una lista plana — reduce el nivel superior de 9 enlaces a 5.
const NAV_GROUPS = [
  { type: 'link', to: '/lineup', label: 'Line-UP' },
  { type: 'link', to: '/mercado', label: 'Mercado' },
  {
    type: 'group', id: 'herramientas', label: 'Herramientas', items: [
      { to: '/porra', label: 'Porra' },
      { to: '/tierlist', label: 'TierMaker' },
    ],
  },
  {
    type: 'group', id: 'partidos', label: 'Partidos', items: [
      { to: '/calendario', label: 'Calendario' },
      { to: '/on-tour', label: 'On Tour' },
    ],
  },
  {
    type: 'group', id: 'comunidad', label: 'Comunidad', items: [
      { to: '/comunidad', label: 'Comunidad' },
      { to: '/fotogaleria', label: 'Fotos' },
      { to: '/rumores', label: 'Noticias' },
    ],
  },
]

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
  const [openGroup, setOpenGroup] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState({})
  const [scrolled, setScrolled] = useState(false)
  const groupRefs = useRef({})
  const userMenuRef = useRef(null)

  const live = useLiveStream()

  // Fondo con blur al hacer scroll (efecto sticky "premium").
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cierra el desplegable de grupo abierto al hacer click fuera.
  useEffect(() => {
    if (!openGroup) return
    const onClickOutside = (e) => {
      if (groupRefs.current[openGroup] && !groupRefs.current[openGroup].contains(e.target)) setOpenGroup(null)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [openGroup])

  // Cierra el menú de usuario al hacer click fuera.
  useEffect(() => {
    if (!userMenuOpen) return
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [userMenuOpen])

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
  const isGroupActive = (group) => group.items.some(isActive)

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

  const toggleMobileGroup = (id) => {
    setMobileExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
        {/* Barra de utilidad: en directo, contacto, login/registro — se
            oculta en mobile porque ese mismo contenido ya vive dentro
            del menú hamburguesa. */}
        <div className="header__topbar">
          <div className="header__topbar-container">
            <div className="header__topbar-left">
              {live && (
                <a href={live.url} target="_blank" rel="noopener noreferrer" className="rz-badge rz-badge--live">
                  <span className="rz-live-dot" />
                  EN DIRECTO
                </a>
              )}
            </div>
            <div className="header__topbar-right">
              {user ? (
                <div className="header__user" ref={userMenuRef}>
                  <button onClick={() => setUserMenuOpen(o => !o)} className="header__user-btn">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#0a3878' }}>{iniciales}</span>
                      </div>
                    )}
                    <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-semibold)' }}>{nombre.split(' ')[0]}</span>
                  </button>
                  {userMenuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: '42px', background: 'white', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '160px', zIndex: 300, overflow: 'hidden' }}>
                      <button onClick={() => { navigate('/perfil'); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 'var(--text-md)', fontFamily: 'var(--font-body)', cursor: 'pointer', color: '#333' }}>
                        Mi perfil
                      </button>
                      {profile?.es_redactor && (
                        <button onClick={() => { navigate('/redaccion'); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 'var(--text-md)', fontFamily: 'var(--font-body)', cursor: 'pointer', color: '#333' }}>
                          Redacción
                        </button>
                      )}
                      {(profile?.es_fotografo || profile?.es_redactor) && (
                        <button onClick={() => { navigate('/redaccion-fotos'); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 'var(--text-md)', fontFamily: 'var(--font-body)', cursor: 'pointer', color: '#333' }}>
                          Subir fotos
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
          </div>
        </div>

        {/* Barra principal: logo + navegación agrupada. */}
        <div className="header__mainbar">
          <div className="header__container">
            <Link to="/" className="header__logo" onClick={closeMobileMenu}>
              <img src="/LOGO_RZHUB.png" alt="RZ Hub" />
            </Link>

            <nav className="header__nav">
              {NAV_GROUPS.map(g => g.type === 'link' ? (
                <Link
                  key={g.to}
                  to={g.to}
                  className={`header__nav-link${isActive(g) ? ' is-active' : ''}`}
                >
                  {g.label}
                </Link>
              ) : (
                <div key={g.id} className="header__group" ref={el => (groupRefs.current[g.id] = el)}>
                  <button
                    type="button"
                    className={`header__nav-link header__group-trigger${isGroupActive(g) ? ' is-active' : ''}`}
                    onClick={() => setOpenGroup(o => (o === g.id ? null : g.id))}
                    aria-haspopup="true"
                    aria-expanded={openGroup === g.id}
                  >
                    {g.label}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openGroup === g.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {openGroup === g.id && (
                    <div className="header__group-panel">
                      {g.items.map(item => (
                        <Link key={item.to} to={item.to} className={isActive(item) ? 'is-active' : ''} onClick={() => setOpenGroup(null)}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

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
          <button
            onClick={() => { closeMobileMenu(); if (user) navigate('/perfil'); else signInWithGoogle() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none',
              padding: 'var(--space-4) var(--space-6)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {user ? (
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: '#fff', fontFamily: 'var(--font-body)' }}>{iniciales}</span>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                )}
              </div>
            )}
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: '#fff', fontFamily: 'var(--font-body)' }}>
              {user ? nombre.split(' ')[0] : 'Iniciar sesión'}
            </span>
          </button>

          <div style={{ padding: 'var(--space-2) 0' }}>
            <Link to="/" onClick={closeMobileMenu} style={{
              color: location.pathname === '/' ? '#ffffff' : 'rgba(255,255,255,0.75)',
              textDecoration: 'none', padding: '12px var(--space-6)', fontSize: 'var(--text-lg)',
              fontWeight: location.pathname === '/' ? 'var(--weight-bold)' : 'var(--weight-regular)',
              fontFamily: 'var(--font-body)',
              borderLeft: location.pathname === '/' ? '3px solid var(--rz-yellow)' : '3px solid transparent',
              display: 'block', minHeight: '44px', boxSizing: 'border-box',
            }}>
              Inicio
            </Link>

            {NAV_GROUPS.map(g => g.type === 'link' ? (
              <Link key={g.to} to={g.to} onClick={closeMobileMenu} style={{
                color: isActive(g) ? '#ffffff' : 'rgba(255,255,255,0.75)',
                textDecoration: 'none', padding: '12px var(--space-6)', fontSize: 'var(--text-lg)',
                fontWeight: isActive(g) ? 'var(--weight-bold)' : 'var(--weight-regular)',
                fontFamily: 'var(--font-body)',
                borderLeft: isActive(g) ? '3px solid var(--rz-yellow)' : '3px solid transparent',
                display: 'block', minHeight: '44px', boxSizing: 'border-box',
              }}>
                {g.label}
              </Link>
            ) : (
              <div key={g.id}>
                <button
                  onClick={() => toggleMobileGroup(g.id)}
                  aria-expanded={!!mobileExpanded[g.id]}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    color: isGroupActive(g) ? '#ffffff' : 'rgba(255,255,255,0.75)',
                    padding: '12px var(--space-6)', fontSize: 'var(--text-lg)',
                    fontWeight: isGroupActive(g) ? 'var(--weight-bold)' : 'var(--weight-regular)',
                    fontFamily: 'var(--font-body)',
                    borderLeft: isGroupActive(g) ? '3px solid var(--rz-yellow)' : '3px solid transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  {g.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: mobileExpanded[g.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {mobileExpanded[g.id] && g.items.map(item => (
                  <Link key={item.to} to={item.to} onClick={closeMobileMenu} style={{
                    color: isActive(item) ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    textDecoration: 'none', padding: '10px var(--space-6) 10px calc(var(--space-6) + var(--space-4))',
                    fontSize: 'var(--text-md)',
                    fontWeight: isActive(item) ? 'var(--weight-bold)' : 'var(--weight-regular)',
                    fontFamily: 'var(--font-body)',
                    display: 'block', minHeight: '40px', boxSizing: 'border-box',
                  }}>
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {live && (
            <a href={live.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', padding: '12px var(--space-6)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <span className="rz-live-dot" style={{ background: 'var(--rz-red)' }} />
              EN DIRECTO
            </a>
          )}

          <div style={{ margin: 'var(--space-6) var(--space-6) 0', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 'var(--space-5)' }}>
            <button onClick={() => { navigate('/contacto'); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'rgba(255,255,255,0.75)', padding: '10px 0', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
              Contáctanos
            </button>
            {user && (
              <>
                {profile?.es_redactor && (
                  <button onClick={() => { navigate('/redaccion'); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'rgba(255,255,255,0.75)', padding: '10px 0', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                    Redacción
                  </button>
                )}
                {(profile?.es_fotografo || profile?.es_redactor) && (
                  <button onClick={() => { navigate('/redaccion-fotos'); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'rgba(255,255,255,0.75)', padding: '10px 0', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                    Subir fotos
                  </button>
                )}
                <button onClick={() => { signOut(); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-md)', textAlign: 'center', color: '#ff6464', padding: '12px', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-body)', cursor: 'pointer', marginTop: 'var(--space-2)' }}>
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
