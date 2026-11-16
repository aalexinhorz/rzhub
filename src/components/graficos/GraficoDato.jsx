import { useEffect, useMemo, useRef, useState } from 'react'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoDato } from '../../lib/graficoDatoJugador'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "El dato": un número enorme con su etiqueta y una explicación
// (lo que va entre **dos asteriscos** sale en negrita), con la foto a la
// derecha.
const INICIAL = {
  tema: 'claro', numero: '0', etiqueta: 'Remates a puerta',
  texto: 'Jugador aún **no ha rematado a puerta esta temporada.** En los últimos tres partidos ni ha realizado ningún remate.',
  seccion: 'El dato', nota: 'Datos de la temporada 2026/27', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}

export default function GraficoDato({ logo }) { // al cargar las fuentes cambia la prop fuentesListas y se vuelve a dibujar
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_dato', INICIAL))
  useGuardarLocal('redaccion_grafico_dato', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const recursos = useMemo(() => ({ foto, logo }), [foto, logo])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoDato(contextoGrafico(c), datos, recursos)
  }, [datos, recursos])

  const campo = (clave, etiqueta, placeholder, area) => (
    <label className="graficos-campo">
      {etiqueta}
      {area
        ? <textarea rows={4} value={datos[clave]} placeholder={placeholder} onChange={e => cambiar({ [clave]: e.target.value })} />
        : <input value={datos[clave]} placeholder={placeholder} onChange={e => cambiar({ [clave]: e.target.value })} />}
    </label>
  )

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-dato-${slug(`${datos.numero} ${datos.etiqueta}`)}.jpg`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>El dato</legend>
          <div className="graficos-fila">
            <label className="graficos-campo graficos-campo--valor">Número<input value={datos.numero} onChange={e => cambiar({ numero: e.target.value })} /></label>
            {campo('etiqueta', 'Qué es (en grande)', 'Remates a puerta')}
          </div>
          {campo('texto', 'Explicación', 'Lo que va entre **asteriscos** sale en negrita', true)}
          <p className="graficos-nota">Pon entre **dos asteriscos** lo que quieras en negrita.</p>
        </fieldset>
        <fieldset>
          <legend>Abajo</legend>
          {campo('seccion', 'Sección', 'El dato')}
          {campo('nota', 'Nota', 'Datos entre todas las competiciones…')}
          <label className="graficos-campo">
            Tema
            <select value={datos.tema} onChange={e => cambiar({ tema: e.target.value })}>
              <option value="claro">Claro</option>
              <option value="azul">Azul</option>
            </select>
          </label>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
