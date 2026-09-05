import SEO from '../components/SEO'
import LegalPage from '../components/LegalPage'

const SECTIONS = [
  {
    heading: '1. Qué datos recopilamos',
    body: [
      'Cuando creas una cuenta recopilamos tu nombre, correo electrónico y, si inicias sesión con Google, tu foto de perfil pública. También guardamos el contenido que generas de forma voluntaria: alineaciones, pronósticos de la Porra, publicaciones en la comunidad y fotos que subas.',
      'De forma automática podemos recoger datos técnicos básicos (tipo de navegador, páginas visitadas) con fines de analítica y mejora del servicio.',
    ],
  },
  {
    heading: '2. Cómo usamos tus datos',
    body: [
      'Usamos tus datos para darte acceso a tu cuenta, guardar tus alineaciones y pronósticos, mostrar tu actividad en la comunidad y enviarte comunicaciones relacionadas con el servicio cuando lo solicites. No vendemos tus datos personales a terceros.',
    ],
  },
  {
    heading: '3. Cookies',
    body: [
      'RZ Hub utiliza cookies propias y de terceros para mantener tu sesión iniciada y para analizar el uso de la web de forma agregada. Puedes gestionar o desactivar las cookies desde la configuración de tu navegador.',
    ],
  },
  {
    heading: '4. Compartición con terceros',
    body: [
      'Utilizamos proveedores externos (como Supabase para la base de datos y autenticación, o Google para el inicio de sesión) que procesan datos en nuestro nombre bajo sus propias políticas de seguridad. No compartimos tus datos con terceros con fines publicitarios.',
    ],
  },
  {
    heading: '5. Tus derechos',
    body: [
      'Puedes acceder, rectificar o solicitar la eliminación de tus datos personales en cualquier momento escribiéndonos a través del apartado de contacto. También puedes eliminar tu cuenta y el contenido asociado a ella directamente desde tu perfil.',
    ],
  },
  {
    heading: '6. Seguridad',
    body: [
      'Aplicamos medidas técnicas razonables para proteger tus datos frente a accesos no autorizados, pérdida o alteración. Ningún sistema es 100% infalible, por lo que no podemos garantizar una seguridad absoluta.',
    ],
  },
  {
    heading: '7. Cambios en esta política',
    body: [
      'Podemos actualizar esta política de privacidad puntualmente. Si los cambios son significativos, lo anunciaremos de forma visible en la web antes de que entren en vigor.',
    ],
  },
  {
    heading: '8. Contacto',
    body: [
      'Si tienes cualquier duda sobre el tratamiento de tus datos, puedes contactar con nosotros a través de los canales indicados en la sección de contacto de la web.',
    ],
  },
]

export default function Privacidad() {
  return (
    <>
      <SEO
        title="Política de Privacidad | RZ Hub"
        description="Política de privacidad de RZ Hub: qué datos recopilamos, cómo los usamos y cuáles son tus derechos."
        path="/privacidad"
        noindex
      />
      <LegalPage title="Política de Privacidad" updated="28 de julio de 2026" sections={SECTIONS} />
    </>
  )
}
