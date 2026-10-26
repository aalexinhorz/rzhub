import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Partido from './Partido'
import { cargarProximoYUltimo } from '../lib/partidoActual'
import { slugPartido } from '../lib/partidoSeo'

// URL fija e indexable (menú, redes, bio): siempre el siguiente partido del
// Real Zaragoza, o el que se está jugando. Muestra su Vestuario Blanquillo
// con título y canonical propios (ver modoProximo en Partido.jsx).
export default function ProximoPartido() {
  const [slug, setSlug] = useState(undefined)

  useEffect(() => {
    let activo = true
    cargarProximoYUltimo().then(({ proximo }) => {
      if (activo) setSlug(proximo ? slugPartido(proximo) : null)
    })
    return () => { activo = false }
  }, [])

  if (slug === undefined) return <div className="partido-page" style={{ minHeight: '100vh', background: '#03101f' }} />
  if (slug === null) {
    return (
      <div style={{ minHeight: '60vh', background: '#03101f', color: '#a9bcdc', textAlign: 'center', padding: '80px 20px', fontFamily: 'Archivo, sans-serif' }}>
        <SEO title="Próximo partido del Real Zaragoza | RZ Hub" description="Calendario y próximos partidos del Real Zaragoza." path="/proximo-partido" />
        No hay más partidos programados por ahora. <Link to="/calendario" style={{ color: '#ffc800' }}>Ver el calendario</Link>
      </div>
    )
  }
  return <Partido slugForzado={slug} modoProximo />
}
