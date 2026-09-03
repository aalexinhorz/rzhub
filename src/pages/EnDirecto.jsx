import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'

const CANAL_TWITCH = 'spaintwcup'
const PARENTS = ['rzhub.es', 'www.rzhub.es', 'localhost']

export default function EnDirecto() {
  const parentParams = PARENTS.map(p => `&parent=${p}`).join('')

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#060D1A' }}>
      <SEO
        title="En Directo | RZ Hub"
        description="Sigue en directo la retransmisión en Twitch."
        keywords="Real Zaragoza en directo, Real Zaragoza twitch, retransmisión Real Zaragoza, ver Real Zaragoza online"
        path="/en-directo"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'En Directo | RZ Hub',
          url: `${SITE_URL}/en-directo`,
        }}
      />

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '28px clamp(16px,4vw,40px) 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ color: '#FFC800', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
          EN DIRECTO
        </p>
        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(56px, 10vw, 96px)', color: '#ffffff', textTransform: 'uppercase', margin: 0, lineHeight: 0.85, letterSpacing: '-1px' }}>
          EN DIRECTO
        </h1>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px clamp(16px,4vw,40px) 64px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '3 1 640px', aspectRatio: '16 / 9', minWidth: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <iframe
            src={`https://player.twitch.tv/?channel=${CANAL_TWITCH}${parentParams}`}
            title="Directo de Twitch"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        <div style={{ flex: '1 1 300px', minWidth: '280px', height: 'clamp(400px, 60vh, 640px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <iframe
            src={`https://www.twitch.tv/embed/${CANAL_TWITCH}/chat?darkpopout${parentParams}`}
            title="Chat de Twitch"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>

      <Footer />
    </div>
  )
}
