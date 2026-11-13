import { useEffect, useMemo, useRef, useState } from 'react'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, dibujarRankingJugadores, zonaFotoRecta } from '../../lib/graficoListas'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useFotosManuales, useGuardarLocal, useRecursosJugadores } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoDisposicion, CampoFoto, CamposTexto, SelectorJugador } from './comunes'

// Plantilla "Ránking de jugadores": hasta 5, cada uno con su tarjeta y su número.
const FILA = { equipoId: 'real-zaragoza', jugadorId: '', nombre: '', valor: '' }
const INICIAL = {
  titulo: 'Goles y asistencias', subtitulo: 'Real Zaragoza · Liga 26/27', explicacion: '', credito: '',
  ajusteFoto: { zoom: 1, dx: 0, dy: 0 }, filas: [FILA, FILA, FILA, FILA, FILA],
}

export default function GraficoRankingJugadores({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_ranking_jugadores', INICIAL))
  useGuardarLocal('redaccion_grafico_ranking_jugadores', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const zona = useMemo(() => zonaFotoRecta(datos.fotoDerecha), [datos.fotoDerecha])
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(zona, datos.ajusteFoto, setAjuste)
  const equipos = useEquiposGraficos()
  const filasRec = useRecursosJugadores(datos.filas, equipos)
  const { fotos: manuales, subir, quitar } = useFotosManuales()
  const recursos = useMemo(() => ({
    foto, logo,
    filas: datos.filas.map((f, i) => ({ esZaragoza: f.equipoId === 'real-zaragoza', ...filasRec[i], foto: manuales[i] || filasRec[i]?.foto })),
  }), [foto, logo, filasRec, manuales, datos.filas])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarRankingJugadores(contextoGrafico(c), datos, recursos)
  }, [datos, recursos, fuentesListas])

  const cambiarFila = (i, c) => setDatos(d => ({ ...d, filas: d.filas.map((f, j) => (j === i ? { ...f, ...c } : f)) }))

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-ranking-${slug(datos.titulo)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <CamposTexto datos={datos} cambiar={cambiar} ayudaExplicacion="Jugadores del Real Zaragoza con más goles y asistencias en liga." />
        <fieldset>
          <legend>Jugadores (el primero, en amarillo)</legend>
          {datos.filas.map((f, i) => (
            <div className="graficos-stat" key={i}>
              <SelectorJugador
                valor={f} equipos={equipos} etiqueta={`Jugador ${i + 1}`} onChange={c => cambiarFila(i, c)}
                fotoManual={manuales[i]} onFoto={a => subir(i, a)} onQuitarFoto={() => quitar(i)}
              />
              <label className="graficos-campo graficos-campo--valor">
                Número
                <input value={f.valor} onChange={e => cambiarFila(i, { valor: e.target.value })} placeholder="5" />
              </label>
            </div>
          ))}
          <p className="graficos-nota">Los que dejes sin nombre ni número no salen. Si la foto de un jugador no carga (FotMob a veces la bloquea), sale su escudo: sube una a mano con "Subir foto".</p>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
        <CampoDisposicion datos={datos} cambiar={cambiar} />
      </form>
    </div>
  )
}
