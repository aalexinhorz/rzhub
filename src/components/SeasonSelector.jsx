import './SeasonSelector.css'

// De momento solo hay datos reales de la temporada en curso — el resto
// se reactivará en cuanto Supabase tenga histórico por temporada.
export const SEASONS = ['26/27']

/**
 * SeasonSelector — <select> nativo con estilos completos en vez de un
 * combobox custom desde cero: mantiene gratis el teclado, el foco y la
 * semántica de un <select> real, y sigue pudiendo vestirse por completo
 * (salvo el propio panel de opciones, que el navegador controla).
 */
export default function SeasonSelector({ value, onChange }) {
  return (
    <div className="season-selector">
      <span className="season-selector__label" id="season-selector-label">Temporada</span>
      <div className="season-selector__control">
        <select
          className="season-selector__select"
          aria-labelledby="season-selector-label"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {SEASONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <svg className="season-selector__chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}
