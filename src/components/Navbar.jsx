import { useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useLiveStream from '../hooks/useLiveStream'

const SECCIONES = [
  {
    label: 'Equipo',
    links: [
      {
        to: '/lineup', label: 'Line Up',
        icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/><circle cx="17" cy="7" r="1.5" fill="currentColor"/><circle cx="7" cy="17" r="1.5" fill="currentColor"/><circle cx="17" cy="17" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
      },
      {
        to: '/tierlist', label: 'Tier List',
        icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="14" height="4" rx="1"/><rect x="3" y="16" width="10" height="4" rx="1"/></svg>
      },
      {
        to: '/on-tour', label: 'On Tour',
        icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
      },
    ]
  },
  {
    label: 'Club',
    links: [
      {
        to: '/calendario', label: 'Calendario',
        icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/><rect x="11" y="13" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/></svg>
      },
      {
        to: '/rumores', label: 'Noticias',
        icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v8a2 2 0 0 1-2 2z"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="14" x2="13" y2="14"/></svg>
      },
    ]
  },
  {
    label: 'Más',
    links: [
      {
        to: '/comunidad', label: 'Comunidad',
        icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6"/><path d="M17 14c1.66 0 3 1.34 3 3v2"/></svg>
      },
      {
        to: '/porra', label: 'La Porra',
        icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
      },
      {
        to: '/contacto', label: 'Contacto',
        icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
      },
    ]
  },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signInWithGoogle, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  // Igual que en el mega-menú de desktop: mobileMounted controla si el panel
  // está en el DOM, mobilePanelOpen controla el estado visual (opacity/transform).
  const [mobileMounted, setMobileMounted] = useState(false)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const mobileOpenFrameRef = useRef([null, null])
  const mobileUnmountTimeoutRef = useRef(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // hoveredSeccion = sección "activa" (controla si el panel está abierto)
  // renderedSeccion = sección cuyo contenido está montado en el DOM
  //   (se mantiene un poco más que hoveredSeccion para poder animar el cierre)
  const [hoveredSeccion, setHoveredSeccion] = useState(null)
  const [renderedSeccion, setRenderedSeccion] = useState(null)
  const [contentKey, setContentKey] = useState(0)
  // panelOpen es el estado "visual" real (controla opacity/transform).
  // Va desacoplado de hoveredSeccion para poder forzar un frame en estado
  // cerrado antes de pasar a abierto, y que la transición de entrada
  // se dispare igual que la de salida.
  const [panelOpen, setPanelOpen] = useState(false)

  const closeTimeoutRef = useRef(null)
  const unmountTimeoutRef = useRef(null)
  const openFrameRef = useRef([null, null])

  const live = useLiveStream()

  const nombre = profile?.username || profile?.name || user?.user_metadata?.name || user?.email || ''
  const avatarUrl = profile?.avatar_url || null
  const iniciales = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const handleEnterSeccion = (label) => {
    clearTimeout(closeTimeoutRef.current)
    clearTimeout(unmountTimeoutRef.current)
    cancelAnimationFrame(openFrameRef.current[0])
    cancelAnimationFrame(openFrameRef.current[1])

    const veniaCerrado = renderedSeccion === null

    if (renderedSeccion !== label) {
      setRenderedSeccion(label)
      setContentKey(k => k + 1) // fuerza el re-render con animación de crossfade
    }
    setHoveredSeccion(label)

    if (veniaCerrado) {
      // Nos aseguramos de que el panel se monte cerrado...
      setPanelOpen(false)
      // ...y esperamos dos frames (el navegador pinte el estado cerrado)
      // antes de pasar a abierto, para que el transition tenga un punto de partida.
      openFrameRef.current[0] = requestAnimationFrame(() => {
        openFrameRef.current[1] = requestAnimationFrame(() => setPanelOpen(true))
      })
    } else {
      // Ya estaba abierto (solo cambiamos de sección): se queda abierto.
      setPanelOpen(true)
    }
  }

  const handleLeaveSeccion = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredSeccion(null)
      setPanelOpen(false)
      // esperamos a que termine la transición antes de desmontar el contenido
      unmountTimeoutRef.current = setTimeout(() => setRenderedSeccion(null), 220)
    }, 120)
  }

  const isActive = (links) => links.some(l => location.pathname === l.to)

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

  const seccionActiva = SECCIONES.find(s => s.label === renderedSeccion)

  return (
    <>
      <div style={{ background: '#0B4390', padding: '0 20px', display: 'flex', alignItems: 'center', height: '60px', position: 'relative', zIndex: 200 }}>
        <Link to="/" onClick={closeMobileMenu}>
          <img src="/PALMADAS_AL_VIENTO_HORIZONTAL 3.png" alt="Palmadas al Viento" style={{ height: '32px', flexShrink: 0, display: 'block' }} />
        </Link>

        <nav style={{ display: 'flex', gap: '4px', marginLeft: '20px', flex: 1, alignItems: 'center' }} className="desktop-nav">
          <Link to="/" style={{
            color: location.pathname === '/' ? '#ffffff' : 'rgba(255,255,255,0.7)',
            textDecoration: 'none', padding: '6px 10px', borderRadius: '6px',
            fontSize: '13px', fontWeight: location.pathname === '/' ? '700' : '500',
            fontFamily: 'Archivo, sans-serif',
            background: location.pathname === '/' ? 'rgba(255,255,255,0.15)' : 'transparent',
            whiteSpace: 'nowrap',
          }}>
            Inicio
          </Link>

          {SECCIONES.map(seccion => (
            <div key={seccion.label} style={{ position: 'relative', height: '60px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => handleEnterSeccion(seccion.label)}
              onMouseLeave={handleLeaveSeccion}
            >
              <button style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                color: isActive(seccion.links) ? '#ffffff' : 'rgba(255,255,255,0.7)',
                background: 'transparent',
                borderBottom: isActive(seccion.links) || hoveredSeccion === seccion.label ? '2px solid white' : '2px solid transparent',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                padding: '6px 10px', height: '60px',
                fontSize: '13px', fontWeight: isActive(seccion.links) ? '700' : '500',
                fontFamily: 'Archivo, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'border-color 0.2s ease, color 0.2s ease',
              }}>
                {seccion.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: hoveredSeccion === seccion.label ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
          ))}

          {live && (
            <a href={live.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#fff', textDecoration: 'none',
              padding: '5px 10px', borderRadius: '6px',
              fontSize: '13px', fontWeight: '700',
              fontFamily: 'Archivo, sans-serif',
              background: '#e53e3e', marginLeft: '4px',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              EN DIRECTO
            </a>
          )}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }} className="desktop-nav">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setUserMenuOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '20px', padding: '5px 12px 5px 5px',
                cursor: 'pointer', color: 'white',
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0B4390' }}>{iniciales}</span>
                  </div>
                )}
                <span style={{ fontSize: '13px', fontFamily: 'Archivo, sans-serif', fontWeight: '600' }}>{nombre.split(' ')[0]}</span>
              </button>
              {userMenuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '42px', background: 'white', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '160px', zIndex: 300, overflow: 'hidden' }}>
                  <button onClick={() => { navigate('/perfil'); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '14px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', color: '#333' }}>
                    Mi perfil
                  </button>
                  {profile?.es_redactor && (
                    <button onClick={() => { navigate('/redaccion'); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '14px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', color: '#333' }}>
                      Redacción
                    </button>
                  )}
                  <button onClick={() => { signOut(); setUserMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '14px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', color: '#e53e3e', borderTop: '1px solid #f0f0f0' }}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={signInWithGoogle} style={{ background: 'white', color: '#0B4390', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: '700', fontFamily: 'Archivo, sans-serif', cursor: 'pointer' }}>
              Iniciar sesión
            </button>
          )}
        </div>

        <button onClick={toggleMobileMenu} className="mobile-menu-btn"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: 'auto', width: '24px', height: '24px', position: 'relative' }}>
          {/* Barras HTML en vez de <line> de SVG: el transform-origin de un elemento
              normal no depende de transform-box, así que el pivote de rotación
              es consistente en todos los navegadores (incluido Safari). */}
          <span style={{
            position: 'absolute', left: '3px', top: '5px', width: '18px', height: '2px',
            background: 'white', borderRadius: '1px',
            transformOrigin: '0 0',
            transform: menuOpen
              ? 'translate(9px, 7px) rotate(45deg) translateY(6px) translate(-9px, -7px)'
              : 'translate(9px, 7px) rotate(0deg) translate(-9px, -7px)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          <span style={{
            position: 'absolute', left: '3px', top: '11px', width: '18px', height: '2px',
            background: 'white', borderRadius: '1px',
            opacity: menuOpen ? 0 : 1,
            transition: 'opacity 0.15s ease',
          }} />
          <span style={{
            position: 'absolute', left: '3px', top: '17px', width: '18px', height: '2px',
            background: 'white', borderRadius: '1px',
            transformOrigin: '0 0',
            transform: menuOpen
              ? 'translate(9px, -5px) rotate(-45deg) translateY(-6px) translate(-9px, 5px)'
              : 'translate(9px, -5px) rotate(0deg) translate(-9px, 5px)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </button>
      </div>

      {/* Panel único del mega-menú: se mantiene montado un poco más allá del hover
          para poder animar la salida, y usa opacity + translateY con transition */}
      {seccionActiva && (
        <div
          onMouseEnter={() => handleEnterSeccion(renderedSeccion)}
          onMouseLeave={handleLeaveSeccion}
          style={{
            position: 'fixed', top: '60px', left: 0, right: 0,
            background: '#f8f8f8', borderBottom: '1px solid #e0e0e0',
            zIndex: 300, display: 'flex', justifyContent: 'center',
            gap: '8px', padding: '16px 24px',
            opacity: panelOpen ? 1 : 0,
            transform: panelOpen ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: panelOpen ? 'auto' : 'none',
          }}
        >
          <div key={contentKey} className="mega-menu-content" style={{ display: 'flex', gap: '8px' }}>
            {seccionActiva.links.map(link => (
              <Link key={link.to} to={link.to} onClick={() => { setHoveredSeccion(null); setPanelOpen(false); setRenderedSeccion(null) }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '8px', padding: '16px 28px',
                  textDecoration: 'none',
                  color: location.pathname === link.to ? '#0B4390' : '#444',
                  background: location.pathname === link.to ? 'rgba(11,67,144,0.06)' : 'white',
                  border: '1px solid',
                  borderColor: location.pathname === link.to ? 'rgba(11,67,144,0.2)' : '#e8e8e8',
                  borderRadius: '12px', minWidth: '110px',
                  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,67,144,0.06)'; e.currentTarget.style.borderColor = 'rgba(11,67,144,0.2)'; e.currentTarget.style.color = '#0B4390' }}
                onMouseLeave={e => { if (location.pathname !== link.to) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.color = '#444' } }}
              >
                <span style={{ color: location.pathname === link.to ? '#0B4390' : '#666' }}>{link.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'Archivo, sans-serif', whiteSpace: 'nowrap' }}>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mobileMounted && (
        <div className="mobile-menu" style={{
          position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0,
          background: '#0B4390', zIndex: 150, overflowY: 'auto',
          display: 'none', flexDirection: 'column', padding: '16px 0 32px',
          opacity: mobilePanelOpen ? 1 : 0,
          transform: mobilePanelOpen ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <Link to="/" onClick={closeMobileMenu} style={{ color: location.pathname === '/' ? '#ffffff' : 'rgba(255,255,255,0.75)', textDecoration: 'none', padding: '12px 24px', fontSize: '15px', fontWeight: '700', fontFamily: 'Archivo, sans-serif', borderLeft: location.pathname === '/' ? '3px solid white' : '3px solid transparent', display: 'block' }}>
            Inicio
          </Link>

          {SECCIONES.map(seccion => (
            <div key={seccion.label}>
              <div style={{ padding: '20px 24px 8px', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                {seccion.label}
              </div>
              {seccion.links.map(link => (
                <Link key={link.to} to={link.to} onClick={closeMobileMenu}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 24px', color: location.pathname === link.to ? '#ffffff' : 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '15px', fontWeight: location.pathname === link.to ? '700' : '400', fontFamily: 'Archivo, sans-serif', borderLeft: location.pathname === link.to ? '3px solid white' : '3px solid transparent' }}>
                  <span style={{ opacity: location.pathname === link.to ? 1 : 0.6 }}>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}

          {live && (
            <a href={live.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', padding: '12px 24px', fontSize: '15px', fontWeight: '700', fontFamily: 'Archivo, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e53e3e', display: 'inline-block' }} />
              EN DIRECTO
            </a>
          )}

          <div style={{ margin: '24px 24px 0', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px' }}>
            {user ? (
              <>
                <button onClick={() => { navigate('/perfil'); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'rgba(255,255,255,0.75)', padding: '10px 0', fontSize: '15px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer' }}>
                  Mi perfil
                </button>
                {profile?.es_redactor && (
                  <button onClick={() => { navigate('/redaccion'); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'rgba(255,255,255,0.75)', padding: '10px 0', fontSize: '15px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer' }}>
                    Redacción
                  </button>
                )}
                <button onClick={() => { signOut(); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', textAlign: 'center', color: 'rgba(255,100,100,0.9)', padding: '12px', fontSize: '15px', fontFamily: 'Archivo, sans-serif', cursor: 'pointer', marginTop: '8px' }}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button onClick={() => { signInWithGoogle(); closeMobileMenu() }} style={{ display: 'block', width: '100%', background: 'white', color: '#0B4390', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '700', fontFamily: 'Archivo, sans-serif', cursor: 'pointer' }}>
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes megaMenuFadeSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mega-menu-content {
          animation: megaMenuFadeSlide 0.2s ease;
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-menu { display: flex !important; }
        }
      `}</style>
    </>
  )
}