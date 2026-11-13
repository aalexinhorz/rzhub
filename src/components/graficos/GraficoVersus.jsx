import { useEffect, useMemo, useRef, useState } from 'react'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarVersus, zonaFotoRecta } from '../../lib/graficoListas'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useFotosManuales, useGuardarLocal, useRecursosJugadores } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoDisposicion, CampoFoto, CamposTexto, SelectorJugador } from './comunes'

// Plantilla "Versus": dos jugadores frente a frente con hasta 5 estadísticas.
const JUGADOR = { equipoId: 'real-zaragoza', jugadorId: '', nombre: '', extra: '' }
const FILA = { etiqueta: '', a: '', b: '' }
const INICIAL = {
  titulo: '', subtitulo: '', explicacion: '', credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
  a: JUGADOR, b: JUGADOR,
  filas: [{ ...FILA, etiqueta: 'Partidos' }, { ...FILA, etiqueta: 'Goles' }, { ...FILA, etiqueta: 'Asistencias' }, { ...FILA, etiqueta: 'Remates' }, FILA],
}

export default function GraficoVersus({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_versus', INICIAL))
  useGuardarLocal('redaccion_grafico_versus', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const zona = useMemo(() => zonaFotoRecta(datos.fotoDerecha), [datos.fotoDerecha])
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(zona, datos.ajusteFoto, setAjuste)
  const equipos = useEquiposGraficos()
  const seleccion = useMemo(() => [datos.a, datos.b], [datos.a, datos.b])
  const [recA, recB] = useRecursosJugadores(seleccion, equipos)
  const { fotos: manuales, subir, quitar } = useFotosManuales()
  const recursos = useMemo(() => ({
    foto, logo,
    a: { esZaragoza: datos.a.equipoId === 'real-zaragoza', ...recA, foto: manuales.a || recA?.foto },
    b: { esZaragoza: datos.b.equipoId === 'real-zaragoza', ...recB, foto: manuales.b || recB?.foto },
  }), [foto, logo, recA, recB, manuales, datos.a.equipoId, datos.b.equipoId])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarVersus(contextoGrafico(c), datos, recursos)
  }, [datos, recursos, fuentesListas])

  const cambiarFila = (i, c) => setDatos(d => ({ ...d, filas: d.filas.map((f, j) => (j === i ? { ...f, ...c } : f)) }))

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-versus-${slug(`${datos.a.nombre}-${datos.b.nombre}`)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        {[['a', 'Izquierda (números en blanco)'], ['b', 'Derecha (números en amarillo)']].map(([lado, titulo]) => (
          <fieldset key={lado}>
            <legend>{titulo}</legend>
            <SelectorJugador
              valor={datos[lado]} equipos={equipos} onChange={c => cambiar({ [lado]: { ...datos[lado], ...c } })}
              fotoManual={manuales[lado]} onFoto={a => subir(lado, a)} onQuitarFoto={() => quitar(lado)}
            />
            <label className="graficos-campo">
              Debajo de la tarjeta
              <input value={datos[lado].extra} onChange={e => cambiar({ [lado]: { ...datos[lado], extra: e.target.value } })} placeholder="812' minutos" />
            </label>
          </fieldset>
        ))}
        <fieldset>
          <legend>Estadísticas</legend>
          {datos.filas.map((f, i) => (
            <div className="graficos-fila" key={i}>
              <label className="graficos-campo graficos-campo--valor">
                Izq.
                <input value={f.a} onChange={e => cambiarFila(i, { a: e.target.value })} />
              </label>
              <label className="graficos-campo">
                Estadística
                <input value={f.etiqueta} onChange={e => cambiarFila(i, { etiqueta: e.target.value })} />
              </label>
              <label className="graficos-campo graficos-campo--valor">
                Der.
                <input value={f.b} onChange={e => cambiarFila(i, { b: e.target.value })} />
              </label>
            </div>
          ))}
          <p className="graficos-nota">Las filas vacías no salen.</p>
        </fieldset>
        <CamposTexto datos={datos} cambiar={cambiar} ayudaExplicacion="Jaume Jardí vs Edu Espiau en Liga 26/27" />
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <CampoDisposicion datos={datos} cambiar={cambiar} />
      </form>
    </div>
  )
}
