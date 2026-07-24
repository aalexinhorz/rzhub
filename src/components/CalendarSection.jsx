import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../hooks/useAuth'
import './CalendarSection.css'

// Enter/Espacio activan la navegación igual que un click — para que
// .calendar-phone y .calendar-widget sean accesibles por teclado
// pese a no ser un <a>/<button> nativo (su marcado es demasiado
// complejo para envolverlo entero en uno sin romper estilos).
function onEnterOrSpace(handler) {
  return e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler()
    }
  }
}

// Placeholder mientras carga o si no hay próximo partido en Supabase
// — la misma hora "18:30" que ya se usaba como ejemplo estático.
const MATCH_PLACEHOLDER = { rival: 'SD Eibar', sede: 'local', hora: '18:30' }

function useNextMatch() {
  const [match, setMatch] = useState(MATCH_PLACEHOLDER)

  useEffect(() => {
    let cancelado = false
    async function load() {
      const { data } = await supabase
        .from('porra_partidos')
        .select('*')
        .eq('finalizado', false)
        .order('kickoff', { ascending: true })
        .limit(1)
      const proximo = data?.[0]
      if (!proximo || cancelado) return

      const kickoff = new Date(proximo.kickoff)
      // Si la hora no está fijada aún, en Supabase queda a medianoche
      // UTC — en ese caso nos quedamos con la hora placeholder en vez
      // de mostrar "00:00" o "02:00" como si fuera la hora real.
      const horaConocida = !(kickoff.getUTCHours() === 0 && kickoff.getUTCMinutes() === 0)
      setMatch({
        rival: proximo.rival,
        sede: proximo.sede,
        hora: horaConocida
          ? kickoff.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : MATCH_PLACEHOLDER.hora,
      })
    }
    load()
    return () => { cancelado = true }
  }, [])

  return match
}

const ICON_PROPS = { width: 48, height: 48, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

const BENEFITS = [
  {
    id: 'add',
    title: 'Añade partidos\na tu calendario',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
        <line x1="12" y1="14" x2="12" y2="18" />
        <line x1="10" y1="16" x2="14" y2="16" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    title: 'Notificaciones\npersonalizadas',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    id: 'devices',
    title: 'Disponible\nen todos tus dispositivos',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="2.5" y="4" width="13" height="9" rx="1.5" />
        <line x1="6" y1="16.5" x2="12" y2="16.5" />
        <rect x="16.5" y="7.5" width="6" height="11" rx="1.3" />
        <line x1="19.5" y1="16" x2="19.5" y2="16.01" />
      </svg>
    ),
  },
  {
    id: 'verified',
    title: 'Datos en tiempo real\ny verificados',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3l7 3v5.5c0 4.5-3 7.5-7 9.5-4-2-7-5-7-9.5V6l7-3Z" />
        <path d="M9 12l2 2 4-4.5" />
      </svg>
    ),
  },
]

const PARTIDOS = [
  { id: 1, dia: '25', diaSemana: 'LUN', local: 'Real Zaragoza', visitante: 'CD Teruel', hora: '18:30', campo: 'Ibercaja Estadio' },
  { id: 2, dia: '01', diaSemana: 'LUN', local: 'Real Zaragoza', visitante: 'Real Murcia', hora: '21:00', campo: 'Enrique Roca' },
  { id: 3, dia: '08', diaSemana: 'LUN', local: 'Real Zaragoza', visitante: 'UD Ibiza', hora: '18:30', campo: 'Ibercaja Estadio' },
]

function BenefitItem({ icon, title }) {
  const lines = title.split('\n')
  return (
    <div className="calendar-benefit">
      <span className="calendar-benefit__icon">{icon}</span>
      <p className="calendar-benefit__text">
        {lines.map((line, i) => (
          <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
        ))}
      </p>
    </div>
  )
}

function CalendarBenefits() {
  return (
    <div className="calendar-benefits">
      {BENEFITS.map(b => <BenefitItem key={b.id} icon={b.icon} title={b.title} />)}
    </div>
  )
}

function CalendarPhone() {
  const navigate = useNavigate()
  const goToCalendario = () => navigate('/calendario')

  return (
    <div
      className="calendar-phone"
      role="link"
      tabIndex={0}
      aria-label="Ver calendario completo"
      onClick={goToCalendario}
      onKeyDown={onEnterOrSpace(goToCalendario)}
    >
      <span className="calendar-phone__btn calendar-phone__btn--mute" />
      <span className="calendar-phone__btn calendar-phone__btn--vol-up" />
      <span className="calendar-phone__btn calendar-phone__btn--vol-down" />
      <span className="calendar-phone__btn calendar-phone__btn--power" />
      <div className="calendar-phone__bezel">
        <div className="calendar-phone__island">
          <span className="calendar-phone__camera" />
        </div>
        <div className="calendar-phone__screen">
          <span className="calendar-phone__glass" aria-hidden="true" />

          <div className="calendar-phone__statusbar">
            <span className="calendar-phone__time">9:41</span>
            <span className="calendar-phone__status-icons">
              <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><rect x="0" y="6" width="2.5" height="5" rx="0.6" fill="currentColor" /><rect x="4.3" y="4" width="2.5" height="7" rx="0.6" fill="currentColor" /><rect x="8.6" y="2" width="2.5" height="9" rx="0.6" fill="currentColor" /><rect x="12.9" y="0" width="2.5" height="11" rx="0.6" fill="currentColor" opacity="0.35" /></svg>
              <svg width="15" height="11" viewBox="0 0 16 12" fill="none"><path d="M1 4.5C5.5-.2 10.5-.2 15 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" /><path d="M3.3 7C6.2 3.9 9.8 3.9 12.7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="8" cy="10" r="1.3" fill="currentColor" /></svg>
              <svg width="24" height="11" viewBox="0 0 25 12" fill="none"><rect x="0.75" y="0.75" width="20.5" height="10.5" rx="2.5" stroke="currentColor" strokeWidth="1" opacity="0.4" /><rect x="2.3" y="2.3" width="16" height="7.4" rx="1.3" fill="currentColor" /><rect x="22.2" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.4" /></svg>
            </span>
          </div>

          <div className="calendar-phone__head">
            <h4>Calendario</h4>
            <span className="calendar-phone__sync-btn" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-3.5-7.1" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
            </span>
          </div>
          <p className="calendar-phone__month">MAYO</p>

          <ul className="calendar-phone__list">
            {PARTIDOS.map(p => (
              <li key={p.id} className="calendar-phone__match">
                <div className="calendar-phone__date">
                  <span className="calendar-phone__date-day">{p.dia}</span>
                  <span className="calendar-phone__date-mes">{p.diaSemana}</span>
                </div>
                <div className="calendar-phone__info">
                  <p className="calendar-phone__teams">
                    {p.local}
                    <span>vs {p.visitante}</span>
                  </p>
                  <p className="calendar-phone__meta">{p.hora} · {p.campo}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function CalendarWidget() {
  const navigate = useNavigate()
  const goToCalendario = () => navigate('/calendario')
  const { rival, sede, hora } = useNextMatch()
  const campo = sede === 'local' ? 'Ibercaja Estadio' : 'Fuera de casa'

  return (
    <div
      className="calendar-widget"
      role="link"
      tabIndex={0}
      aria-label="Ver calendario completo"
      onClick={goToCalendario}
      onKeyDown={onEnterOrSpace(goToCalendario)}
    >
      <img className="calendar-widget__crest" src="/escudos/Real_Zaragoza_logo (3).svg" alt="" aria-hidden="true" />
      <div className="calendar-widget__body">
        <p className="calendar-widget__app">RZ HUB</p>
        <p className="calendar-widget__title">Próximo partido</p>
        <p className="calendar-widget__match">Real Zaragoza vs {rival}</p>
        <p className="calendar-widget__meta">{hora} · {campo}</p>
      </div>
    </div>
  )
}


export default function CalendarSection() {
  return (
    <section className="calendar-section">
      <div className="calendar-section__container">
        <div className="calendar-section__text">
          <p className="calendar-section__eyebrow">Sincroniza y no te pierdas nada</p>
          <h2 className="calendar-section__title">Tu calendario, siempre contigo</h2>
          <p className="calendar-section__desc">
            Sincroniza todos los partidos con tu calendario favorito.
            Recibe notificaciones personalizadas y mantente al día estés donde estés.
          </p>
          <CalendarBenefits />
        </div>

        <div className="calendar-section__visual">
          <div className="calendar-phone-stack">
            <CalendarPhone />
          </div>
          <div className="calendar-widget-slot">
            <CalendarWidget />
          </div>
        </div>
      </div>
    </section>
  )
}
