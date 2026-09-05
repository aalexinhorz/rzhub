import SEO from '../components/SEO'
import LegalPage from '../components/LegalPage'

const SECTIONS = [
  {
    heading: '1. Aceptación de los términos',
    body: [
      'Al acceder y utilizar RZ Hub aceptas quedar vinculado por estos términos y condiciones. Si no estás de acuerdo con alguno de ellos, no debes utilizar la plataforma.',
    ],
  },
  {
    heading: '2. Qué es RZ Hub',
    body: [
      'RZ Hub es una plataforma no oficial creada por y para aficionados del Real Zaragoza. No está afiliada, patrocinada ni respaldada por el Real Zaragoza C.D. ni por LaLiga. Los escudos, nombres y datos de jugadores se muestran con fines informativos y de entretenimiento para la comunidad zaragocista.',
    ],
  },
  {
    heading: '3. Cuentas de usuario',
    body: [
      'Para acceder a determinadas funciones (guardar alineaciones, participar en la Porra, publicar en la comunidad) necesitas registrarte. Eres responsable de mantener la confidencialidad de tu cuenta y de toda la actividad que ocurra bajo ella.',
    ],
  },
  {
    heading: '4. Contenido generado por usuarios',
    body: [
      'Al publicar contenido en RZ Hub (alineaciones, comentarios, fotos, publicaciones en la comunidad) nos concedes una licencia no exclusiva para mostrar dicho contenido dentro de la plataforma. Eres el único responsable del contenido que publiques.',
      'No se permite contenido ofensivo, discriminatorio, difamatorio o que incite a la violencia. Nos reservamos el derecho a eliminar cualquier contenido que incumpla estas normas y a suspender cuentas reincidentes.',
    ],
  },
  {
    heading: '5. Propiedad intelectual',
    body: [
      'El diseño, código y marca de RZ Hub son propiedad de sus creadores. Los escudos, nombres de club y demás elementos identificativos de terceros pertenecen a sus respectivos titulares y se usan de forma nominativa, sin ánimo de generar confusión sobre su origen.',
    ],
  },
  {
    heading: '6. Limitación de responsabilidad',
    body: [
      'RZ Hub se ofrece "tal cual". No garantizamos que los datos (calendario, resultados, mercado de fichajes) estén siempre libres de errores o completamente actualizados. No nos hacemos responsables de decisiones tomadas en base a la información publicada en la plataforma.',
    ],
  },
  {
    heading: '7. Modificaciones',
    body: [
      'Podemos actualizar estos términos en cualquier momento. Los cambios relevantes se anunciarán en la propia web. El uso continuado de RZ Hub tras una modificación implica la aceptación de los nuevos términos.',
    ],
  },
  {
    heading: '8. Ley aplicable',
    body: [
      'Estos términos se rigen por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales que correspondan conforme a la normativa vigente.',
    ],
  },
]

export default function Terminos() {
  return (
    <>
      <SEO
        title="Términos y Condiciones | RZ Hub"
        description="Términos y condiciones de uso de RZ Hub, la plataforma no oficial de la afición del Real Zaragoza."
        path="/terminos"
        noindex
      />
      <LegalPage title="Términos y Condiciones" updated="28 de julio de 2026" sections={SECTIONS} />
    </>
  )
}
