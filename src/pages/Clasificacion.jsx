import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import { useEscudo } from '../lib/escudos'
import { calcularClasificacion, zonaDe } from '../lib/clasificacion'
import { jornadaJugada, seoClasificacion } from '../lib/seoPaginas'
import './Clasificacion.css'

// Clasificación completa del Grupo 2 de Primera Federación (indexable).
// Los datos son los mismos que la tabla de la portada (liga_calendario) y
// se refrescan solos cada minuto.

const EQUIPO = 'Real Zaragoza'
const REFRESCO_MS = 60_000
const sinComillas = n => (n || '').replace(/["“”]/g, '').trim()
const RESULTADO = { V: 'Victoria', E: 'Empate', D: 'Derrota' }

function Escudo({ nombre }) {
  const src = useEscudo(nombre)
  return src ? <img src={src} alt="" className="clas-escudo" /> : <span className="clas-escudo clas-escudo--vacio">{nombre[0]}</span>
}

export default function Clasificacion() {
  const [fixtures, setFixtures] = useState(null)
  const [rivales, setRivales] = useState([])

  useEffect(() => {
    let activo = true
    function cargar() {
      supabase.from('liga_calendario').select('*').order('jornada').then(({ data }) => { if (activo && data) setFixtures(data) })
    }
    function alVolver() { if (document.visibilityState === 'visible') cargar() }
    cargar()
    supabase.from('rivales').select('id, nombre').then(({ data }) => { if (activo) setRivales(data || []) })
    const id = setInterval(cargar, REFRESCO_MS)
    document.addEventListener('visibilitychange', alVolver)
    return () => { activo = false; clearInterval(id); document.removeEventListener('visibilitychange', alVolver) }
  }, [])

  const tabla = useMemo(() => (fixtures ? calcularClasificacion(fixtures) : null), [fixtures])
  const jornada = useMemo(() => (fixtures ? jornadaJugada(fixtures) : null), [fixtures])
  const fichaRival = useMemo(() => new Map(rivales.map(r => [sinComillas(r.nombre), r.id])), [rivales])
  const seo = seoClasificacion(tabla, jornada)

  return (
    <div className="clas-page">
      <SEO
        title={seo.title}
        description={seo.description}
        path="/clasificacion"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Clasificación', item: `${SITE_URL}/clasificacion` },
          ],
        }}
      />
      <div className="clas-contenedor">
        <header className="clas-cabecera">
          <p className="clas-eyebrow">Primera Federación · Grupo 2 · 2026/27</p>
          <h1 className="clas-titulo">Clasificación</h1>
          <p className="clas-intro">
            {jornada ? `Tras la jornada ${jornada}. ` : ''}Se actualiza sola en cuanto acaba cada partido. El primero sube directo a Segunda División, del 2.º al 5.º juegan el play-off y los cinco últimos bajan.
          </p>
        </header>

        {!tabla ? (
          <p className="clas-estado">Cargando clasificación…</p>
        ) : (
          <div className="clas-tarjeta">
            <table className="clas-tabla">
              <thead>
                <tr>
                  <th className="clas-tabla__pos">#</th>
                  <th className="clas-tabla__equipo">Equipo</th>
                  <th>PJ</th>
                  <th className="clas-ocultable">G</th>
                  <th className="clas-ocultable">E</th>
                  <th className="clas-ocultable">P</th>
                  <th className="clas-ocultable">GF</th>
                  <th className="clas-ocultable">GC</th>
                  <th>DG</th>
                  <th className="clas-ocultable-movil">Racha</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((f, i) => {
                  const nombre = sinComillas(f.equipo)
                  const ficha = fichaRival.get(nombre)
                  const esRz = nombre === EQUIPO
                  return (
                    <tr key={f.equipo} className={`clas-fila clas-fila--${zonaDe(i + 1) || 'media'}${esRz ? ' is-rz' : ''}`}>
                      <td className="clas-tabla__pos">{i + 1}</td>
                      <td className="clas-tabla__equipo">
                        <span className="clas-equipo">
                          <Escudo nombre={nombre} />
                          {ficha && !esRz ? <Link to={`/rival/${ficha}`}>{nombre}</Link> : <span>{nombre}</span>}
                        </span>
                      </td>
                      <td>{f.pj}</td>
                      <td className="clas-ocultable">{f.g}</td>
                      <td className="clas-ocultable">{f.e}</td>
                      <td className="clas-ocultable">{f.p}</td>
                      <td className="clas-ocultable">{f.gf}</td>
                      <td className="clas-ocultable">{f.gc}</td>
                      <td>{f.dg > 0 ? `+${f.dg}` : f.dg}</td>
                      <td className="clas-ocultable-movil">
                        <span className="clas-racha">
                          {f.forma.map((r, j) => <span key={j} className={`clas-forma clas-forma--${r}`} title={RESULTADO[r]} />)}
                        </span>
                      </td>
                      <td className="clas-tabla__pts">{f.pts}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="clas-leyenda">
              <span><i className="clas-punto clas-punto--ascenso" />Ascenso directo</span>
              <span><i className="clas-punto clas-punto--playoff" />Play-off</span>
              <span><i className="clas-punto clas-punto--descenso" />Descenso</span>
            </div>
          </div>
        )}

        <nav className="clas-enlaces" aria-label="Más sobre el Real Zaragoza">
          <Link to="/proximo-partido">Próximo partido →</Link>
          <Link to="/calendario">Calendario del Real Zaragoza →</Link>
          <Link to="/simulador">Simula el final de liga →</Link>
        </nav>
      </div>
      <Footer />
    </div>
  )
}
