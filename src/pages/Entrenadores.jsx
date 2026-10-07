import SEO from '../components/SEO'
import Footer from '../components/Footer'
import './Entrenadores.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

// Fuentes: fechas de cada etapa sacadas de Wikipedia
// (es.wikipedia.org/wiki/Anexo:Entrenadores_del_Real_Zaragoza, wikitext
// crudo vía action=raw); partidos/victorias/empates/derrotas sacados de
// Transfermarkt (historial del personal del club + "stationen" de cada
// entrenador en vista extendida, que sí desglosa G/E/P por etapa) y
// cruzados contra el número de partidos de ambas fuentes en cada caso
// para confirmar que coinciden. Las fotos son las mismas de Transfermarkt,
// descargadas y alojadas aquí en vez de enlazarlas en caliente.
const ENTRENADORES = [
  {
    id: 'ibai-gomez', nombre: 'Ibai Gómez', foto: '/images/entrenadores/ibai-gomez.jpg',
    desde: '2026-06-04', hasta: null, actual: true,
    pj: 6, pg: 5, pe: 0, pp: 1,
  },
  {
    id: 'david-navarro-2', nombre: 'David Navarro', etapa: '2.ª etapa', foto: null,
    desde: '2026-03-03', hasta: '2026-06-03',
    pj: 14, pg: 3, pe: 3, pp: 8,
  },
  {
    id: 'ruben-selles', nombre: 'Rubén Sellés', foto: '/images/entrenadores/ruben-selles.jpg',
    desde: '2025-10-21', hasta: '2026-03-02',
    pj: 20, pg: 5, pe: 6, pp: 9,
  },
  {
    id: 'emilio-larraz', nombre: 'Emilio Larraz', etapa: 'interino', foto: '/images/entrenadores/emilio-larraz.png',
    desde: '2025-10-13', hasta: '2025-10-20',
    pj: 1, pg: 0, pe: 0, pp: 1,
  },
  {
    id: 'gabi', nombre: 'Gabi Fernández', foto: '/images/entrenadores/gabi.jpg',
    desde: '2025-03-18', hasta: '2025-10-12',
    pj: 20, pg: 5, pe: 6, pp: 9,
  },
  {
    id: 'miguel-angel-ramirez', nombre: 'Miguel Ángel Ramírez', foto: '/images/entrenadores/miguel-angel-ramirez.jpg',
    desde: '2024-12-27', hasta: '2025-03-17',
    pj: 10, pg: 1, pe: 4, pp: 5,
  },
  {
    id: 'david-navarro-1', nombre: 'David Navarro', etapa: '1.ª etapa · interino', foto: null,
    desde: '2024-12-19', hasta: '2024-12-26',
    pj: 1, pg: 1, pe: 0, pp: 0,
  },
  {
    id: 'victor-fernandez-4', nombre: 'Víctor Fernández', etapa: '4.ª etapa', foto: '/images/entrenadores/victor-fernandez.jpg',
    desde: '2024-03-12', hasta: '2024-12-18',
    pj: 34, pg: 11, pe: 10, pp: 13,
  },
  {
    id: 'julio-velazquez', nombre: 'Julio Velázquez', foto: '/images/entrenadores/julio-velazquez.png',
    desde: '2023-11-21', hasta: '2024-03-11',
    pj: 14, pg: 3, pe: 6, pp: 5,
  },
  {
    id: 'fran-escriba', nombre: 'Fran Escribá', foto: '/images/entrenadores/fran-escriba.jpg',
    desde: '2022-11-07', hasta: '2023-11-20',
    pj: 45, pg: 14, pe: 17, pp: 14,
  },
  {
    id: 'juan-carlos-carcedo', nombre: 'Juan Carlos Carcedo', foto: '/images/entrenadores/juan-carlos-carcedo.png',
    desde: '2022-07-01', hasta: '2022-11-06',
    pj: 15, pg: 4, pe: 4, pp: 7,
  },
  {
    id: 'juan-ignacio-martinez', nombre: 'Juan Ignacio Martínez', foto: '/images/entrenadores/juan-ignacio-martinez.jpg',
    desde: '2020-12-15', hasta: '2022-06-30',
    pj: 71, pg: 25, pe: 27, pp: 19,
  },
  {
    id: 'ivan-martinez', nombre: 'Iván Martínez', etapa: 'interino', foto: '/images/entrenadores/ivan-martinez.jpg',
    desde: '2020-11-09', hasta: '2020-12-13',
    pj: 8, pg: 1, pe: 0, pp: 7,
  },
  {
    id: 'ruben-baraja', nombre: 'Rubén Baraja', foto: '/images/entrenadores/ruben-baraja.jpg',
    desde: '2020-08-19', hasta: '2020-11-09',
    pj: 10, pg: 2, pe: 4, pp: 4,
  },
  {
    id: 'victor-fernandez-3', nombre: 'Víctor Fernández', etapa: '3.ª etapa', foto: '/images/entrenadores/victor-fernandez.jpg',
    desde: '2018-12-17', hasta: '2020-08-18',
    pj: 72, pg: 31, pe: 17, pp: 24,
  },
  {
    id: 'lucas-alcaraz', nombre: 'Lucas Alcaraz', foto: '/images/entrenadores/lucas-alcaraz.jpg',
    desde: '2018-10-22', hasta: '2018-12-17',
    pj: 8, pg: 1, pe: 2, pp: 5,
  },
  {
    id: 'imanol-idiakez', nombre: 'Imanol Idiakez', foto: '/images/entrenadores/imanol-idiakez.jpg',
    desde: '2018-06-18', hasta: '2018-10-21',
    pj: 12, pg: 3, pe: 5, pp: 4,
  },
  {
    id: 'natxo-gonzalez', nombre: 'Natxo González', foto: '/images/entrenadores/natxo-gonzalez.jpg',
    desde: '2017-06-14', hasta: '2018-06-11',
    pj: 48, pg: 22, pe: 12, pp: 14,
  },
  {
    id: 'cesar-lainez', nombre: 'César Láinez', foto: null,
    desde: '2017-03-20', hasta: '2017-06-09',
    pj: 12, pg: 3, pe: 6, pp: 3,
  },
  {
    id: 'raul-agne', nombre: 'Raúl Agné', foto: null,
    desde: '2016-10-25', hasta: '2017-03-19',
    pj: 19, pg: 6, pe: 4, pp: 9,
  },
  {
    id: 'luis-milla', nombre: 'Luis Milla', foto: '/images/entrenadores/luis-milla.jpg',
    desde: '2016-06-16', hasta: '2016-10-23',
    pj: 12, pg: 3, pe: 4, pp: 5,
  },
  {
    id: 'lluis-carreras', nombre: 'Lluís Carreras', foto: '/images/entrenadores/lluis-carreras.jpg',
    desde: '2015-12-27', hasta: '2016-06-06',
    pj: 24, pg: 10, pe: 7, pp: 7,
  },
  {
    id: 'ranko-popovic', nombre: 'Ranko Popović', foto: '/images/entrenadores/ranko-popovic.jpg',
    desde: '2014-11-24', hasta: '2015-12-21',
    pj: 51, pg: 19, pe: 17, pp: 15,
  },
  {
    id: 'victor-munoz', nombre: 'Víctor Muñoz', etapa: '2.ª etapa', foto: null,
    desde: '2014-03-19', hasta: '2014-11-24',
    pj: 27, pg: 8, pe: 10, pp: 9,
  },
  {
    id: 'paco-herrera', nombre: 'Paco Herrera', foto: '/images/entrenadores/paco-herrera.jpg',
    desde: '2013-06-20', hasta: '2014-03-17',
    pj: 31, pg: 10, pe: 9, pp: 12,
  },
]

function formatFecha(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function EntrenadorCard({ e }) {
  const pct = e.pj > 0 ? Math.round((e.pg / e.pj) * 100) : 0
  return (
    <article className={`entrenador-card${e.actual ? ' entrenador-card--actual' : ''}`}>
      <div className="entrenador-card__foto">
        <img src={e.foto || DEFAULT_PHOTO} alt="" loading="lazy" />
        {e.actual && <span className="entrenador-card__badge">Actual</span>}
      </div>
      <div className="entrenador-card__cuerpo">
        <div className="entrenador-card__cabecera">
          <h2 className="entrenador-card__nombre">{e.nombre}</h2>
          {e.etapa && <span className="entrenador-card__etapa">{e.etapa}</span>}
        </div>
        <p className="entrenador-card__fechas">
          {formatFecha(e.desde)} — {e.hasta ? formatFecha(e.hasta) : 'actualidad'}
        </p>

        <div className="entrenador-card__stats">
          <div className="entrenador-card__stat"><span className="entrenador-card__stat-valor">{e.pj}</span><span className="entrenador-card__stat-label">PJ</span></div>
          <div className="entrenador-card__stat entrenador-card__stat--g"><span className="entrenador-card__stat-valor">{e.pg}</span><span className="entrenador-card__stat-label">G</span></div>
          <div className="entrenador-card__stat entrenador-card__stat--e"><span className="entrenador-card__stat-valor">{e.pe}</span><span className="entrenador-card__stat-label">E</span></div>
          <div className="entrenador-card__stat entrenador-card__stat--p"><span className="entrenador-card__stat-valor">{e.pp}</span><span className="entrenador-card__stat-label">P</span></div>
        </div>

        <div className="entrenador-card__barra">
          <div className="entrenador-card__barra-g" style={{ width: `${(e.pg / e.pj) * 100}%` }} />
          <div className="entrenador-card__barra-e" style={{ width: `${(e.pe / e.pj) * 100}%` }} />
          <div className="entrenador-card__barra-p" style={{ width: `${(e.pp / e.pj) * 100}%` }} />
        </div>
        <p className="entrenador-card__pct">{pct}% de victorias</p>
      </div>
    </article>
  )
}

export default function Entrenadores() {
  const totalPartidos = ENTRENADORES.reduce((s, e) => s + e.pj, 0)
  const nombresUnicos = new Set(ENTRENADORES.map(e => e.nombre)).size

  return (
    <div className="entrenadores-page">
      <SEO
        title="Entrenadores del Real Zaragoza desde 2013 | RZ Hub"
        description="Todos los entrenadores del Real Zaragoza desde 2013 hasta hoy: fechas en el cargo, etapas y récord de victorias, empates y derrotas de cada uno."
        path="/entrenadores"
        keywords="entrenadores Real Zaragoza, historia entrenadores Real Zaragoza, banquillo Real Zaragoza, Paco Herrera, Víctor Fernández Real Zaragoza, Ibai Gómez entrenador"
      />

      <header className="entrenadores-hero">
        <p className="entrenadores-hero__eyebrow">Historia del banquillo</p>
        <h1 className="entrenadores-hero__title">Entrenadores <span>desde 2013</span></h1>
        <p className="entrenadores-hero__subtitle">
          {nombresUnicos} entrenadores distintos y {ENTRENADORES.length} etapas en el banquillo del Real Zaragoza desde el descenso de 2013, con su récord de victorias, empates y derrotas en el cargo.
        </p>
        <p className="entrenadores-hero__total">{totalPartidos} partidos dirigidos en total</p>
      </header>

      <div className="entrenadores-body">
        <div className="entrenadores-container">
          {ENTRENADORES.map(e => <EntrenadorCard key={e.id} e={e} />)}
        </div>
      </div>

      <Footer />
    </div>
  )
}
