import { useEffect, useMemo, useRef, useState } from 'react'
import { compartirVarios, contextoGrafico, descargarVarios, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarCierreCarrusel, dibujarDiapositivaCarrusel, dibujarPortadaCarrusel } from '../../lib/graficoCarrusel'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Carrusel": una portada con foto y título y hasta 9
// diapositivas de texto para explicar algo paso a paso. Se descargan (o se
// comparten) todas de una vez, numeradas.
const MAX_DIAPOS = 9
const DIAPO = { seccion: '', titulo: '', texto: '', numero: '', etiquetaNumero: '' }
const CIERRE = {
  tipo: 'cierre', etiqueta: 'Súmate a RZ Hub', titulo: '¡Síguenos!',
  texto: 'Y no te pierdas más contenidos como este', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}
// El cierre de antes ("Somos RZ Hub") se cambia por el nuevo.
function leerCarrusel() {
  const d = leerLocal('redaccion_grafico_carrusel', INICIAL)
  return { ...d, diapos: (d.diapos || []).map(x => (x.tipo === 'cierre' && x.etiqueta === undefined ? { ...CIERRE } : x)) }
}
const INICIAL = {
  etiqueta: 'Te lo explicamos',
  titulo: '¿Por qué *Ademo* no está sancionado?',
  subtitulo: 'Le cuentan cinco amarillas, pero puede jugar. Así funciona el ciclo de tarjetas en Primera Federación.',
  desliza: 'Desliza para descubrirlo',
  credito: '',
  ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
  diapos: [
    {
      seccion: 'La regla', titulo: '5 amarillas, *1 partido*',
      texto: 'En Primera Federación, el jugador que llega a **cinco amarillas en liga** se pierde el **siguiente partido de liga**. Después, la cuenta vuelve a empezar.',
      numero: '5', etiquetaNumero: 'Amarillas = 1 partido de sanción',
    },
    {
      seccion: 'El matiz', titulo: 'Las de la *expulsión* no cuentan',
      texto: 'Si un jugador ve **dos amarillas en el mismo partido**, le expulsan y esas dos tarjetas **se castigan con la roja**. Por eso **no suman** para el ciclo de cinco.',
      numero: '', etiquetaNumero: '',
    },
    {
      seccion: 'El caso de Ademo', titulo: 'Contra el *Murcia*',
      texto: 'Peter Ademo vio **dos amarillas y fue expulsado** ante el Murcia: esas dos se castigaron con la roja. Muchas webs le cuentan cinco amarillas, pero **para la federación lleva tres**.',
      numero: '3', etiquetaNumero: 'Amarillas para la RFEF',
    },
    {
      seccion: '¿Y ahora qué?', titulo: 'A *dos* del ciclo',
      texto: 'A Ademo le faltan **dos amarillas en liga** para perderse un partido. La lista oficial de sancionados la publica cada semana el **Comité de Competición de la RFEF**.',
      numero: '2', etiquetaNumero: 'Amarillas para cumplir ciclo',
    },
    { ...CIERRE },
  ],
}

export default function GraficoCarrusel({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(leerCarrusel)
  useGuardarLocal('redaccion_grafico_carrusel', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  // Foto de fondo del cierre (opcional), con su encuadre guardado en esa diapositiva.
  const ajusteCierre = datos.diapos.find(d => d.tipo === 'cierre')?.ajusteFoto || { zoom: 1, dx: 0, dy: 0 }
  const setAjusteCierre = ajusteFoto => setDatos(d => ({ ...d, diapos: d.diapos.map(x => (x.tipo === 'cierre' ? { ...x, ajusteFoto } : x)) }))
  const fotoCierre = useFotoArrastrable(ZONA_FOTO, ajusteCierre, setAjusteCierre)
  const [actual, setActual] = useState(0) // 0 = portada
  const [aviso, setAviso] = useState('')
  const recursos = useMemo(() => ({ foto, logo, fotoCierre: fotoCierre.foto }), [foto, logo, fotoCierre.foto])
  const total = datos.diapos.length + 1
  const indice = Math.min(actual, total - 1)

  const dibujar = (canvas, i) => {
    const g = contextoGrafico(canvas)
    if (i === 0) dibujarPortadaCarrusel(g, datos, recursos)
    else if (datos.diapos[i - 1].tipo === 'cierre') dibujarCierreCarrusel(g, datos.diapos[i - 1], recursos)
    else dibujarDiapositivaCarrusel(g, datos.diapos[i - 1], recursos, { indice: i, total, desliza: 'Desliza' })
  }

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujar(c, indice)
  }) // tras cada render: dibujar es barato

  const base = `rzhub-${slug(datos.titulo.replace(/\*/g, ''))}`
  const nombre = i => `${base}-${String(i + 1).padStart(2, '0')}.jpg`
  const todas = () => Array.from({ length: total }, (_, i) => {
    const c = document.createElement('canvas')
    c.width = ANCHO * ESCALA
    c.height = ALTO * ESCALA
    dibujar(c, i)
    return c
  })
  const nombres = Array.from({ length: total }, (_, i) => nombre(i))
  const compartirTodas = async () => {
    const ok = await compartirVarios(todas(), nombres)
    setAviso(ok ? '' : 'Tu navegador no deja compartir varias: se han descargado.')
  }

  const diapo = indice > 0 ? datos.diapos[indice - 1] : null
  const esCierre = diapo?.tipo === 'cierre'
  const cambiarDiapo = c => cambiar({ diapos: datos.diapos.map((d, j) => (j === indice - 1 ? { ...d, ...c } : d)) })
  const anadir = (nueva = DIAPO) => {
    if (datos.diapos.length >= MAX_DIAPOS) return
    const diapos = [...datos.diapos]
    diapos.splice(indice, 0, { ...nueva })
    cambiar({ diapos })
    setActual(indice + 1)
  }
  const quitar = () => {
    if (indice === 0) return
    cambiar({ diapos: datos.diapos.filter((_, j) => j !== indice - 1) })
    setActual(indice - 1)
  }
  const mover = paso => {
    const a = indice - 1, b = a + paso
    if (indice === 0 || b < 0 || b >= datos.diapos.length) return
    const diapos = [...datos.diapos];
    [diapos[a], diapos[b]] = [diapos[b], diapos[a]]
    cambiar({ diapos })
    setActual(b + 1)
  }

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <div className="graficos-pestanas graficos-pestanas--sub" role="tablist">
          {Array.from({ length: total }, (_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === indice} className={i === indice ? 'es-activa' : ''} onClick={() => setActual(i)}>
              {i === 0 ? 'Portada' : i + 1}
            </button>
          ))}
          {datos.diapos.length < MAX_DIAPOS && <button type="button" onClick={() => anadir()}>+ Añadir</button>}
          {datos.diapos.length < MAX_DIAPOS && !datos.diapos.some(d => d.tipo === 'cierre') && (
            <button type="button" onClick={() => { cambiar({ diapos: [...datos.diapos, { ...CIERRE }] }); setActual(total) }}>+ Cierre RZ Hub</button>
          )}
        </div>
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className={`graficos-canvas${indice && !esCierre ? ' graficos-canvas--fijo' : ''}`} {...(indice === 0 ? handlers : esCierre ? fotoCierre.handlers : {})} data-fuentes={fuentesListas ? 1 : 0} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={nombre(indice)} />
        <div className="graficos-acciones">
          <button type="button" className="rz-btn rz-btn--primary" onClick={() => descargarVarios(todas(), nombres)}>Descargar las {total}</button>
          <button type="button" className="rz-btn rz-btn--ghost" onClick={compartirTodas}>Compartir las {total}</button>
        </div>
        {aviso && <p className="graficos-aviso">{aviso}</p>}
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        {indice === 0 ? (
          <>
            <fieldset>
              <legend>Portada</legend>
              <label className="graficos-campo">Etiqueta<input value={datos.etiqueta} onChange={e => cambiar({ etiqueta: e.target.value })} placeholder="Te lo explicamos" /></label>
              <label className="graficos-campo">Título<input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} /></label>
              <label className="graficos-campo">Subtítulo<textarea rows={3} value={datos.subtitulo} onChange={e => cambiar({ subtitulo: e.target.value })} /></label>
              <label className="graficos-campo">Texto de deslizar<input value={datos.desliza} onChange={e => cambiar({ desliza: e.target.value })} placeholder="Vacío: solo la flecha" /></label>
              <p className="graficos-nota">En el título, lo que va entre *asteriscos* sale en amarillo.</p>
            </fieldset>
            <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
          </>
        ) : esCierre ? (
          <>
          <fieldset>
            <legend>Cierre RZ Hub</legend>
            <label className="graficos-campo">Pastilla de arriba<input value={diapo.etiqueta} onChange={e => cambiarDiapo({ etiqueta: e.target.value })} placeholder="Vacío, no sale" /></label>
            <label className="graficos-campo">Título<input value={diapo.titulo} onChange={e => cambiarDiapo({ titulo: e.target.value })} /></label>
            <label className="graficos-campo">Texto<textarea rows={2} value={diapo.texto} onChange={e => cambiarDiapo({ texto: e.target.value })} /></label>
            <div className="graficos-acciones">
              <button type="button" className="graficos-mini-boton" disabled={indice <= 1} onClick={() => mover(-1)}>← Mover</button>
              <button type="button" className="graficos-mini-boton" disabled={indice >= datos.diapos.length} onClick={() => mover(1)}>Mover →</button>
              <button type="button" className="graficos-mini-boton" onClick={quitar}>Quitar</button>
            </div>
          </fieldset>
          <CampoFoto foto={fotoCierre.foto} retoque={fotoCierre.retoque} elegirFoto={fotoCierre.elegirFoto} ajuste={ajusteCierre} setAjuste={setAjusteCierre} />
          <p className="graficos-nota">La foto de fondo es opcional (p. ej. la grada): sale teñida de azul.</p>
          </>
        ) : (
          <fieldset>
            <legend>Diapositiva {indice + 1}</legend>
            <label className="graficos-campo">Sección<input value={diapo.seccion} onChange={e => cambiarDiapo({ seccion: e.target.value })} placeholder="La regla, El caso…" /></label>
            <label className="graficos-campo">Título<input value={diapo.titulo} onChange={e => cambiarDiapo({ titulo: e.target.value })} /></label>
            <label className="graficos-campo">Texto<textarea rows={5} value={diapo.texto} onChange={e => cambiarDiapo({ texto: e.target.value })} /></label>
            <div className="graficos-fila">
              <label className="graficos-campo graficos-campo--valor">Dato<input value={diapo.numero} onChange={e => cambiarDiapo({ numero: e.target.value })} placeholder="Vacío: no sale" /></label>
              <label className="graficos-campo">Qué es<input value={diapo.etiquetaNumero} onChange={e => cambiarDiapo({ etiquetaNumero: e.target.value })} /></label>
            </div>
            <p className="graficos-nota">Título: *asteriscos* = amarillo. Texto: **dos asteriscos** = negrita. El dato sale en una caja amarilla abajo.</p>
            <div className="graficos-acciones">
              <button type="button" className="graficos-mini-boton" disabled={indice <= 1} onClick={() => mover(-1)}>← Mover</button>
              <button type="button" className="graficos-mini-boton" disabled={indice >= datos.diapos.length} onClick={() => mover(1)}>Mover →</button>
              <button type="button" className="graficos-mini-boton" onClick={quitar}>Quitar</button>
            </div>
          </fieldset>
        )}
      </form>
    </div>
  )
}
