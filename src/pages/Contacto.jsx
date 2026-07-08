import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_yu2o009'
const TEMPLATE_ID = 'template_j4mlxar'
const PUBLIC_KEY = '4UVo2QGYmg_lTiY_p'

const inputStyle = {
  width: '100%', padding: '14px 16px',
  backgroundColor: '#ffffff', border: '1px solid #ffffff',
  borderRadius: '10px', color: 'white',
  fontFamily: 'Archivo, sans-serif', fontSize: '15px',
  outline: 'none', boxSizing: 'border-box',
}

export default function Contacto() {
  const formRef = useRef(null)
  const [nombre, setNombre] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [estado, setEstado] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const handleEnviar = async () => {
    if (!nombre.trim() || !asunto.trim() || !mensaje.trim()) {
      setEstado('error_vacio')
      return
    }
    setEnviando(true)
    setEstado(null)
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        mensaje: `Nombre: ${nombre}\nAsunto: ${asunto}\n\nMensaje:\n${mensaje}`,
      }, PUBLIC_KEY)
      setEstado('ok')
      setNombre('')
      setAsunto('')
      setMensaje('')
    } catch (e) {
      console.error(e)
      setEstado('error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'Archivo, sans-serif', paddingBottom: '80px' }}>
      <Helmet>
        <title>Contacto | RZ Hub - Real Zaragoza</title>
        <meta name="description" content="¿Tienes alguna sugerencia o idea para RZ Hub? Escríbenos. La plataforma fan del Real Zaragoza hecha por y para zaragocistas." />
        <meta property="og:title" content="Contacto | RZ Hub - Real Zaragoza" />
        <meta property="og:description" content="¿Tienes alguna sugerencia o idea para RZ Hub? Escríbenos." />
        <meta property="og:url" content="https://rzhub.es/contacto" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rzhub.es/contacto" />
      </Helmet>

      <div style={{ backgroundColor: '#0B4390', padding: '60px 24px 50px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ fontFamily: 'Archivo, sans-serif', fontWeight: '300', fontSize: 'clamp(12px, 2.5vw, 14px)', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>
          RZ HUB
        </p>
        <h1 style={{ fontFamily: 'Humane, sans-serif', fontSize: 'clamp(64px, 16vw, 130px)', fontWeight: '700', lineHeight: 0.9, margin: '0 0 20px', letterSpacing: '6px', textTransform: 'uppercase' }}>
          CONTACTO
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5, fontFamily: 'Archivo, sans-serif' }}>
          ¿Tienes alguna sugerencia, idea o simplemente quieres decirnos algo? Escríbenos.
        </p>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px 0' }}>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontFamily: 'Archivo, sans-serif', fontWeight: '300', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#0B4390' }}
            onBlur={e => { e.target.style.borderColor = '#ffffff' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontFamily: 'Archivo, sans-serif', fontWeight: '300', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
            Asunto
          </label>
          <input
            type="text"
            value={asunto}
            onChange={e => setAsunto(e.target.value)}
            placeholder="¿De qué se trata?"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#0B4390' }}
            onBlur={e => { e.target.style.borderColor = '#ffffff' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontFamily: 'Archivo, sans-serif', fontWeight: '300', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
            Mensaje
          </label>
          <textarea
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            rows={6}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={e => { e.target.style.borderColor = '#0B4390' }}
            onBlur={e => { e.target.style.borderColor = '#ffffff' }}
          />
        </div>

        <button
          onClick={handleEnviar}
          disabled={enviando}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: enviando ? '#ffffff' : '#0B4390',
            border: 'none', borderRadius: '10px',
            color: 'white', fontSize: '15px', fontWeight: '700',
            fontFamily: 'Archivo, sans-serif', cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? 'Enviando...' : 'Enviar mensaje'}
        </button>

        {estado === 'ok' && (
          <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'Archivo, sans-serif', fontSize: '14px', color: '#27ae60' }}>
            ¡Mensaje enviado! Te responderemos lo antes posible.
          </div>
        )}

        {estado === 'error_vacio' && (
          <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'Archivo, sans-serif', fontSize: '14px', color: '#e74c3c' }}>
            Por favor rellena todos los campos.
          </div>
        )}

        {estado === 'error' && (
          <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'Archivo, sans-serif', fontSize: '14px', color: '#e74c3c' }}>
            Hubo un error al enviar. Inténtalo de nuevo.
          </div>
        )}

        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: '20px', lineHeight: 1.6, fontFamily: 'Archivo, sans-serif', fontWeight: '300' }}>
          También puedes encontrarnos en Twitter como @rzhub_es
        </p>
      </div>
    </div>
  )
}