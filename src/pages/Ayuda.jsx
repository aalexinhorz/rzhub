import SEO from '../components/SEO'
import LegalPage from '../components/LegalPage'

const SECTIONS = [
  {
    heading: '¿Es gratis usar RZ Hub?',
    body: [
      'Sí. Crear tu cuenta y usar todas las herramientas de RZ Hub (Lineup Builder, La Porra, Mercado, TierMaker, Comunidad...) es completamente gratuito.',
    ],
  },
  {
    heading: '¿Cómo creo mi alineación con el Lineup Builder?',
    body: [
      'Ve a la sección "Line-UP", elige una formación, pulsa sobre cada posición para buscar y añadir jugadores de la plantilla (o un jugador externo si no lo encuentras) y guarda tu alineación en tu perfil o compártela con la comunidad.',
    ],
  },
  {
    heading: '¿Cómo funciona La Porra?',
    body: [
      'Antes de cada partido puedes predecir el resultado exacto del Real Zaragoza. Ganas puntos según lo cerca que quede tu pronóstico del resultado real, y puedes ver tu posición en el ranking de la comunidad.',
    ],
  },
  {
    heading: 'He encontrado un dato incorrecto (jugador, escudo, resultado)',
    body: [
      'Aunque intentamos mantener todo actualizado, pueden colarse errores. Puedes avisarnos desde el formulario de contacto o desde el apartado "Solicita jugadores que faltan" dentro del Lineup Builder, y lo revisamos lo antes posible.',
    ],
  },
  {
    heading: '¿Cómo elimino mi cuenta?',
    body: [
      'Desde tu perfil puedes gestionar tu cuenta y solicitar su eliminación. Si tienes cualquier problema para hacerlo, escríbenos y te ayudamos directamente.',
    ],
  },
  {
    heading: '¿Cómo os puedo contactar?',
    body: [
      'La forma más rápida es a través de nuestras redes sociales (enlaces al pie de la web) o del formulario de contacto. Intentamos responder a todos los mensajes en el menor tiempo posible.',
    ],
  },
]

export default function Ayuda() {
  return (
    <>
      <SEO
        title="Ayuda y Preguntas Frecuentes | RZ Hub"
        description="Preguntas frecuentes sobre RZ Hub: cómo usar el Lineup Builder, La Porra, tu cuenta y cómo contactar con nosotros."
        path="/ayuda"
        noindex
      />
      <LegalPage title="Ayuda" updated="28 de julio de 2026" sections={SECTIONS} />
    </>
  )
}
