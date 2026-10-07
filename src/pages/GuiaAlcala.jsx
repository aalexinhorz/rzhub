import SEO from '../components/SEO'
import Footer from '../components/Footer'
import './GuiaAlcala.css'

const SECCIONES = [
  {
    num: '01',
    titulo: 'El estadio',
    parrafos: [
      'El Atlético Madrileño disputa sus partidos como local en el campo principal del Centro Deportivo Alcalá de Henares.',
      '🦁 La afición zaragocista contará con su zona visitante.',
    ],
    datos: ['🏟️ Campo 1', '📍 Zona de Espartales', '🚗 Junto a la A-2'],
  },
  {
    num: '02',
    titulo: 'Si vienes desde Zaragoza',
    parrafos: ['La opción más cómoda es ir en coche.'],
    destacado: '📍 Zaragoza → A-2 → Alcalá de Henares',
    parrafos2: ['⏱️ El trayecto es de aproximadamente 3 horas dependiendo del tráfico.'],
    recomendacion: {
      titulo: '🕖 Nuestra recomendación',
      texto: 'Intenta llegar a Alcalá entre 18:00 y 19:00h. Así tendrás tiempo para aparcar, dar una vuelta, comer o tomar algo y llegar al estadio sin prisas.',
    },
  },
  {
    num: '03',
    titulo: '¿Dónde aparcar?',
    parrafos: ['El Centro Deportivo cuenta con aparcamiento, pero ojo con el horario de cierre habitual del recinto.'],
    aviso: '⚠️ El partido termina alrededor de las 23:00h, por lo que no conviene depender de un parking que pueda cerrar antes.',
    consejo: {
      titulo: '💡 Consejo RZ HUB',
      texto: 'Si vas en coche, busca una opción que permita salir después del partido. Evita meter el coche en el casco histórico. Ese domingo habrá bastante movimiento en Alcalá por el puente y el Mercado Cervantino.',
    },
  },
  {
    num: '04',
    titulo: 'Si vienes en tren',
    parrafos: ['Una opción es:'],
    destacado: '🚄 Zaragoza → Madrid  ⬇️  🚆 Madrid → Alcalá de Henares',
    parrafos2: [
      'Las líneas C-2, C-7 y C-8 conectan Madrid con Alcalá.',
      '📍 La estación de Alcalá de Henares está en la zona urbana y desde allí tendrás que desplazarte hasta el estadio.',
    ],
    aviso: '⚠️ Importante: el partido acaba sobre las 23:00h. Planifica la vuelta antes de ir al campo.',
  },
  {
    num: '05',
    titulo: 'Desde Madrid',
    parrafos: ['Si estás alojado en Madrid, tienes varias opciones:'],
    lista: [
      { etiqueta: '🚆 Cercanías', texto: 'Madrid → Alcalá de Henares' },
      { etiqueta: '🚌 Autobús interurbano', texto: 'Avenida de América → Alcalá' },
      { etiqueta: '🚕 Taxi / VTC', texto: 'La opción más cómoda para volver después del partido.' },
    ],
    aviso: '⚠️ Para la vuelta a Madrid después de las 23:00h, comprueba los horarios con antelación.',
  },
  {
    num: '06',
    titulo: '¿Qué hacer en Alcalá?',
    parrafos: ['Si llegas con tiempo, aprovecha para conocer la ciudad. Todo el centro histórico está bastante concentrado y se puede recorrer fácilmente andando.'],
    lista: [
      { texto: '📍 Plaza de Cervantes' },
      { texto: '📍 Calle Mayor' },
      { texto: '📍 Universidad de Alcalá' },
      { texto: '📍 Casa Natal de Cervantes' },
      { texto: '📍 Catedral Magistral' },
    ],
    consejo: {
      titulo: '💡 Plan ideal',
      texto: 'Turismo → comida → paseo → partido.',
    },
  },
  {
    num: '07',
    titulo: '¿Dónde comer?',
    parrafos: ['La mejor zona para comer y tomar algo es el casco histórico.'],
    lista: [
      { etiqueta: '🍺 Calle Libreros' },
      { etiqueta: '🍻 Plaza de Cervantes' },
      { etiqueta: '🍽️ Calle Mayor' },
      { etiqueta: '🍷 Calle Carmen Calzado' },
    ],
    subtitulo: 'Algunas opciones',
    restaurantes: [
      { nombre: 'Bar Indalo', direccion: 'C. Libreros, 9' },
      { nombre: 'La Pinta', direccion: 'C. Bedel, 3' },
      { nombre: 'Taberna 7 Libreros', direccion: 'C. Libreros, 7' },
      { nombre: 'La Zarza', direccion: 'Plaza Rodríguez Marín, 3' },
      { nombre: 'Radical', direccion: 'C. Mayor, 75' },
      { nombre: 'Fino Bar', direccion: 'C. Carmen Calzado, 15' },
    ],
    aviso: '⚠️ Al ser puente, recomendamos reservar con antelación.',
  },
  {
    num: '08',
    titulo: 'Mercado Cervantino',
    parrafos: [
      'El partido coincide con el Mercado Cervantino.',
      '📅 8-12 de octubre · 📍 Casco histórico de Alcalá',
      'Habrá más visitantes y movimiento de lo habitual en el centro.',
    ],
    consejo: {
      titulo: '👉 Si vas a pasar el día en Alcalá',
      texto: 'Tenlo en cuenta a la hora de moverte y aparcar.',
    },
  },
  {
    num: '09',
    titulo: '¿Dónde dormir?',
    parrafos: ['Si vas a quedarte después del partido:'],
    lista: [
      { etiqueta: '🥇 Alcalá de Henares', texto: 'La opción más cómoda si quieres evitar conducir de noche.' },
      { etiqueta: '🥈 Madrid', texto: 'Más opciones de alojamiento, pero tendrás que planificar la vuelta después del partido.' },
    ],
    consejo: {
      titulo: '💡 Si vienes en coche desde Zaragoza',
      texto: 'Dormir en Alcalá es la opción más cómoda.',
    },
  },
  {
    num: '10',
    titulo: '¿Qué llevar?',
    parrafos: ['Antes de salir de casa:'],
    lista: [
      { etiqueta: '🎟️ Entrada' },
      { etiqueta: '🪪 DNI' },
      { etiqueta: '📱 Móvil cargado' },
      { etiqueta: '🔋 Batería externa' },
      { etiqueta: '🧣 Bufanda del Real Zaragoza' },
      { etiqueta: '🧥 Algo de abrigo' },
    ],
    aviso: '📲 Ten la entrada preparada antes de llegar al estadio.',
  },
  {
    num: '11',
    titulo: 'Plan del día',
    horarios: [
      { grupo: '☀️ Mañana', items: [
        { hora: '10:00-11:00', texto: 'Llegada a Alcalá' },
        { hora: '11:00', texto: 'Paseo por el centro' },
        { hora: '13:30', texto: 'Comida' },
      ] },
      { grupo: '🌇 Tarde', items: [
        { hora: '16:00', texto: 'Turismo / paseo' },
        { hora: '18:00', texto: 'Prepararse para el partido' },
        { hora: '19:00', texto: 'Salida hacia el estadio' },
      ] },
      { grupo: '🏟️ Partido', items: [
        { hora: '19:30-20:00', texto: 'Llegada al campo' },
        { hora: '21:00', texto: '⚽ Atlético Madrileño - Real Zaragoza', destacado: true },
        { hora: '23:00 aprox.', texto: 'Final del partido' },
      ] },
    ],
  },
  {
    num: '12',
    titulo: 'Consejos para el zaragocista',
    parrafos: ['5 cosas que no debes olvidar:'],
    lista: [
      { etiqueta: '1️⃣', texto: 'Llega con tiempo al estadio.' },
      { etiqueta: '2️⃣', texto: 'Lleva tu entrada preparada.' },
      { etiqueta: '3️⃣', texto: 'Planifica dónde vas a aparcar.' },
      { etiqueta: '4️⃣', texto: 'Si vuelves en transporte público, comprueba los horarios antes del partido.' },
      { etiqueta: '5️⃣', texto: 'Anima, disfruta y representa al Real Zaragoza. 💙🤍' },
    ],
  },
]

export default function GuiaAlcala() {
  return (
    <div className="guia-page">
      <SEO
        title="Guía del zaragocista: Atlético Madrileño - Real Zaragoza | RZ Hub"
        description="Cómo llegar a Alcalá de Henares, dónde aparcar, comer y dormir, y el plan del día para ir al Atlético Madrileño - Real Zaragoza del domingo 11 de octubre."
        path="/guia-alcala"
        keywords="guía Atlético Madrileño Real Zaragoza, cómo llegar Alcalá de Henares Real Zaragoza, desplazamiento afición Real Zaragoza, Centro Deportivo Alcalá de Henares, viaje zaragocista Alcalá"
      />

      <header className="guia-hero">
        <p className="guia-hero__eyebrow">Guía del zaragocista</p>
        <h1 className="guia-hero__title">Atlético Madrileño <span className="guia-hero__vs">vs</span> Real Zaragoza</h1>
        <p className="guia-hero__subtitle">Todo lo que necesitas saber para el desplazamiento a Alcalá de Henares.</p>
        <dl className="guia-hero__datos">
          <div><dt>Fecha</dt><dd>Domingo, 11 de octubre</dd></div>
          <div><dt>Hora</dt><dd>21:00h</dd></div>
          <div><dt>Lugar</dt><dd>Centro Deportivo Alcalá de Henares · Campo 1</dd></div>
        </dl>
      </header>

      <div className="guia-body">
        <div className="guia-container">
          <img
            className="guia-cover"
            src="/images/guia-alcala-cover.png"
            alt="La guía de tu viaje para el Atlético Madrileño - Real Zaragoza"
            width="1080"
            height="1350"
            loading="lazy"
          />

          {SECCIONES.map(s => (
            <section key={s.num} className="guia-seccion">
              <p className="guia-seccion__num">{s.num}</p>
              <h2 className="guia-seccion__titulo">{s.titulo}</h2>

              {s.parrafos?.map((p, i) => <p key={`p${i}`} className="guia-texto">{p}</p>)}

              {s.datos && (
                <ul className="guia-datos">
                  {s.datos.map(d => <li key={d}>{d}</li>)}
                </ul>
              )}

              {s.destacado && <p className="guia-destacado">{s.destacado}</p>}

              {s.parrafos2?.map((p, i) => <p key={`q${i}`} className="guia-texto">{p}</p>)}

              {s.lista && (
                <ul className="guia-lista">
                  {s.lista.map((item, i) => (
                    <li key={i}>
                      {item.etiqueta && <span className="guia-lista__etiqueta">{item.etiqueta}</span>}
                      {item.texto && <span className="guia-lista__texto">{item.texto}</span>}
                    </li>
                  ))}
                </ul>
              )}

              {s.subtitulo && <h3 className="guia-subtitulo">{s.subtitulo}</h3>}

              {s.restaurantes && (
                <ul className="guia-restaurantes">
                  {s.restaurantes.map(r => (
                    <li key={r.nombre}>
                      <span className="guia-restaurantes__nombre">{r.nombre}</span>
                      <span className="guia-restaurantes__direccion">{r.direccion}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.horarios && (
                <div className="guia-horarios">
                  {s.horarios.map(bloque => (
                    <div key={bloque.grupo} className="guia-horarios__bloque">
                      <p className="guia-horarios__grupo">{bloque.grupo}</p>
                      <ul>
                        {bloque.items.map(it => (
                          <li key={it.hora} className={it.destacado ? 'is-destacado' : undefined}>
                            <span className="guia-horarios__hora">{it.hora}</span>
                            <span>{it.texto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {s.aviso && <p className="guia-aviso">{s.aviso}</p>}

              {s.recomendacion && (
                <div className="guia-callout">
                  <p className="guia-callout__titulo">{s.recomendacion.titulo}</p>
                  <p className="guia-callout__texto">{s.recomendacion.texto}</p>
                </div>
              )}

              {s.consejo && (
                <div className="guia-callout guia-callout--consejo">
                  <p className="guia-callout__titulo">{s.consejo.titulo}</p>
                  {s.consejo.texto && <p className="guia-callout__texto">{s.consejo.texto}</p>}
                </div>
              )}
            </section>
          ))}

          <footer className="guia-cierre">
            <p className="guia-cierre__titulo">🔵⚪ Nos vemos en Alcalá</p>
            <p className="guia-cierre__texto">Atlético Madrileño 🆚 Real Zaragoza · Domingo 11 de octubre · 21:00h · Centro Deportivo Alcalá de Henares</p>
            <p className="guia-cierre__aupa">🦁 AÚPA ZARAGOZA</p>
          </footer>
        </div>
      </div>

      <Footer />
    </div>
  )
}
