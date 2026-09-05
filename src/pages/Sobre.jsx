import SEO from '../components/SEO'

const PARRAFOS = [
  'RZ Hub es el proyecto de dos amigos zaragocistas que quisieron darle a la afición del Real Zaragoza un sitio propio: un lugar donde encontrar todo lo relacionado con el equipo sin tener que andar buscando por mil sitios distintos.',
  'La idea original surgió al ver el trabajo que un grupo de aficionados del Atlético de Madrid había hecho con Atleti Stats, una web creada por y para su propia afición. Nos pareció tan buena idea que decidimos intentar llevar algo parecido al zaragocismo.',
  'Así nació RZ Hub: sin pretensión de ser un canal oficial, solo dos amigos con ganas de aportar algo a la comunidad. Herramientas como el Lineup Builder, La Porra, el Mercado de fichajes, el TierMaker o la Comunidad están pensadas para que cualquier zaragocista pueda seguir a su equipo, competir con otros aficionados y sentirse parte de algo más grande.',
  'Seguimos construyendo esto poco a poco, casi siempre a partir de lo que la propia comunidad nos pide. Si tienes alguna idea, sugerencia o simplemente quieres saludar, nos encontrarás en nuestras redes sociales o en el formulario de contacto.',
]

export default function Sobre() {
  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#060D1A', padding: '56px 24px 96px' }}>
      <SEO
        title="Sobre RZ Hub | RZ Hub"
        description="Quiénes somos y por qué existe RZ Hub, la plataforma no oficial hecha por y para la afición del Real Zaragoza."
        path="/sobre-rz-hub"
      />
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <p style={{ color: '#FFC800', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
          RZ HUB
        </p>
        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: 'clamp(40px, 7vw, 64px)', color: '#ffffff', textTransform: 'uppercase', margin: 0, lineHeight: 0.95, letterSpacing: '-1px' }}>
          Sobre RZ Hub
        </h1>

        <div style={{ marginTop: '40px' }}>
          {PARRAFOS.map((p, i) => (
            <p key={i} style={{ fontFamily: 'Archivo, sans-serif', fontSize: '15.5px', lineHeight: '1.75', color: 'rgba(255,255,255,0.7)', margin: '0 0 20px' }}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
