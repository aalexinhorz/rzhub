import './CommunityStats.css'

/**
 * Community Stats Bar — puente de social proof entre el Hero y las
 * Herramientas. Puramente presentacional: los datos (icono, valor,
 * etiqueta) llegan por props para poder alimentarse desde backend
 * sin tocar el componente.
 *
 *   <CommunityStats stats={[{ icon, value, label }]} />
 */
export default function CommunityStats({ stats }) {
  return (
    <div className="community-stats">
      <div className="community-stats__card">
        <div className="community-stats__grid">
          {stats.map((stat, i) => (
            <div key={i} className="community-stats__item">
              <span className="community-stats__icon" aria-hidden="true">{stat.icon}</span>
              <div className="community-stats__text">
                <div className="community-stats__value">{stat.value}</div>
                <div className="community-stats__label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
