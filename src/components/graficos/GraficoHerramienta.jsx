import { useEffect, useMemo, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cargarImagen, contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarGraficoHerramienta, zonaCaptura } from '../../lib/graficoHerramienta'
import { AMARILLO } from '../../lib/graficosTexto'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import { TOOLS } from '../../lib/tools'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Herramienta": presenta una herramienta de la web (nueva o no).
// Al elegirla se rellenan su icono, nombre, descripción y dirección (de
// lib/tools.jsx); todo se puede cambiar. La captura es opcional y va dentro
// de un marco de navegador o de móvil; se arrastra para encuadrarla.
const INICIAL = {
  herramienta: 'prediccion', formato: 'navegador', pastilla: 'Nueva herramienta',
  titulo: '', descripcion: '', url: '', puntos: ['', '', ''], credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}

// El icono de la herramienta (JSX con currentColor) como imagen amarilla.
function iconoComoImagen(icono) {
  if (!icono) return Promise.resolve(null)
  let svg = renderToStaticMarkup(icono).replace(/currentColor/g, AMARILLO)
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  svg = svg.replace(/width="\d+"/, 'width="256"').replace(/height="\d+"/, 'height="256"')
  return cargarImagen(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
}

export default function GraficoHerramienta({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_herramienta', INICIAL))
  useGuardarLocal('redaccion_grafico_herramienta', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const zona = zonaCaptura(datos.formato)
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(zona, datos.ajusteFoto, setAjuste)

  const tool = TOOLS.find(t => t.id === datos.herramienta) || null
  const auto = {
    titulo: tool?.title || '',
    descripcion: tool?.description || '',
    url: tool ? `rzhub.es${tool.href}` : 'rzhub.es',
  }
  const final = { titulo: datos.titulo || auto.titulo, descripcion: datos.descripcion || auto.descripcion, url: datos.url || auto.url }

  const [icono, setIcono] = useState({ id: null, img: null })
  useEffect(() => {
    let activo = true
    iconoComoImagen(tool?.icon).then(img => { if (activo) setIcono({ id: datos.herramienta, img }) })
    return () => { activo = false }
  }, [tool, datos.herramienta])

  const recursos = useMemo(() => ({ logo, foto: datos.formato === 'sin' ? null : foto, icono: icono.id === datos.herramienta ? icono.img : null }),
    [logo, foto, datos.formato, icono, datos.herramienta])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoHerramienta(contextoGrafico(c), { ...datos, ...final }, recursos)
  }) // tras cada render: los textos automáticos se calculan en cada uno y dibujar es barato

  const campo = (clave, etiqueta, area) => (
    <label className="graficos-campo">
      {etiqueta}
      {area
        ? <textarea rows={3} value={datos[clave]} placeholder={auto[clave]} onChange={e => cambiar({ [clave]: e.target.value })} />
        : <input value={datos[clave]} placeholder={auto[clave]} onChange={e => cambiar({ [clave]: e.target.value })} />}
    </label>
  )
  const conCaptura = datos.formato !== 'sin'

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA}
          className={`graficos-canvas${conCaptura ? '' : ' graficos-canvas--fijo'}`} {...(conCaptura ? handlers : {})} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-herramienta-${slug(final.titulo)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Herramienta</legend>
          <label className="graficos-campo">
            Cuál
            <select value={datos.herramienta} onChange={e => cambiar({ herramienta: e.target.value, titulo: '', descripcion: '', url: '' })}>
              {TOOLS.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              <option value="otra">Otra (sin icono)</option>
            </select>
          </label>
          {campo('titulo', 'Nombre (en grande)')}
          {campo('descripcion', 'Descripción', true)}
          {campo('url', 'Dirección')}
          <label className="graficos-campo">Pastilla de arriba<input value={datos.pastilla} onChange={e => cambiar({ pastilla: e.target.value })} placeholder="Vacío, no sale" /></label>
        </fieldset>
        <fieldset>
          <legend>Qué ofrece (hasta 3)</legend>
          {[0, 1, 2].map(i => (
            <label key={i} className="graficos-campo">
              Punto {i + 1}
              <input value={datos.puntos[i] || ''} placeholder={['Ej.: 50.000 simulaciones de la liga', 'Ej.: Se actualiza sola tras cada jornada', 'Ej.: Gratis y sin registrarte'][i]}
                onChange={e => cambiar({ puntos: datos.puntos.map((p, j) => (j === i ? e.target.value : p)) })} />
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Captura</legend>
          <label className="graficos-campo">
            Formato
            <select value={datos.formato} onChange={e => cambiar({ formato: e.target.value, ajusteFoto: { zoom: 1, dx: 0, dy: 0 } })}>
              <option value="navegador">Captura de ordenador (marco de navegador)</option>
              <option value="movil">Captura de móvil (marco de móvil)</option>
              <option value="sin">Sin captura (los puntos en grande)</option>
            </select>
          </label>
          <p className="graficos-nota">Haz una captura de la herramienta en la web, súbela abajo y arrástrala para encuadrarla.</p>
        </fieldset>
        {conCaptura && <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />}
      </form>
    </div>
  )
}
