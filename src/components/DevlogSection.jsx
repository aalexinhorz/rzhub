import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../hooks/useAuth'
import './DevlogSection.css'

const POR_PAGINA = 7

function formatFecha(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// Cada fila de `devlog` guarda varios cambios de un mismo push (cambios:
// jsonb[]) — aquí se aplanan a una fila por cambio, que es como se pinta
// la tabla (una actualización por línea, no agrupada por fecha).
function aplanar(entradas) {
  const filas = []
  entradas.forEach(entrada => {
    entrada.cambios.forEach((texto, i) => {
      filas.push({ id: `${entrada.id}-${i}`, fecha: entrada.fecha, texto })
    })
  })
  return filas
}

export default function DevlogSection() {
  const [entradas, setEntradas] = useState([])
  const [abierto, setAbierto] = useState(true)
  const [pagina, setPagina] = useState(0)

  useEffect(() => {
    let activo = true
    supabase
      .from('devlog')
      .select('id, fecha, cambios')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (activo) setEntradas(data || []) })
    return () => { activo = false }
  }, [])

  const filas = useMemo(() => aplanar(entradas), [entradas])
  const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA))
  const filasPagina = filas.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA)

  if (filas.length === 0) return null

  return (
    <section className="devlog-section">
      <div className="devlog-section__container">
        <div className="devlog-card">
          <button className="devlog-card__header" onClick={() => setAbierto(v => !v)} aria-expanded={abierto}>
            <span className="devlog-card__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 21h6v-1H9v1Zm3-19a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2Z" />
              </svg>
            </span>
            <span className="devlog-card__title">Mejoras en la web</span>
            <svg className={`devlog-card__chevron${abierto ? ' is-abierto' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>

          {abierto && (
            <>
              <div className="devlog-table__head">
                <span>Fecha</span>
                <span>Actualización</span>
              </div>

              <ul className="devlog-table__body">
                {filasPagina.map(fila => (
                  <li key={fila.id} className="devlog-row">
                    <span className="devlog-row__fecha">{formatFecha(fila.fecha)}</span>
                    <span className="devlog-row__texto">{fila.texto}</span>
                    <svg className="devlog-row__flecha" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </li>
                ))}
              </ul>

              {totalPaginas > 1 && (
                <div className="devlog-pagination">
                  <button
                    className="devlog-pagination__btn"
                    onClick={() => setPagina(p => Math.max(0, p - 1))}
                    disabled={pagina === 0}
                    aria-label="Página anterior"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <span className="devlog-pagination__label">{pagina + 1} / {totalPaginas}</span>
                  <button
                    className="devlog-pagination__btn"
                    onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                    disabled={pagina === totalPaginas - 1}
                    aria-label="Página siguiente"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
