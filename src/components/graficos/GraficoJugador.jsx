import { useEffect, useMemo, useRef, useState } from 'react'
import { contextoGrafico, ESCALA, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoJugador } from '../../lib/graficoJugador'
import { leerLocal, useEquiposGraficos, useFotoArrastrable, useFotosManuales, useGuardarLocal, useJugadores, useRecursosJugadores } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto, SelectorJugador } from './comunes'

// Plantilla "Foto de jugador": foto a toda página con la tarjeta del Lineup
// del jugador, su nombre en grande, una etiqueta y una pastilla amarilla.
const INICIAL = {
  carta: { equipoId: 'real-zaragoza', jugadorId: '', nombre: '' }, nombre: '', etiqueta: '', pastilla: '2026/27',
  credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}

export default function GraficoJugador({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(() => leerLocal('redaccion_grafico_jugador', INICIAL))
  useGuardarLocal('redaccion_grafico_jugador', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers, retoque } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const equipos = useEquiposGraficos()
  const jugadores = useJugadores(datos.carta.equipoId) || []
  const [recCarta] = useRecursosJugadores([datos.carta], equipos)
  const { fotos: fotosManuales, subir, quitar } = useFotosManuales()

  const recursos = useMemo(() => ({
    foto, logo,
    carta: datos.carta.jugadorId || datos.carta.nombre
      ? { ...recCarta, foto: fotosManuales.carta || recCarta?.foto, nombre: datos.carta.nombre }
      : null,
  }), [foto, logo, recCarta, fotosManuales, datos.carta])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoJugador(contextoGrafico(c), datos, recursos)
  }, [datos, recursos, fuentesListas])

  // Al elegir un jugador, su nombre completo pasa al nombre grande.
  const cambiarCarta = c => {
    const j = c.jugadorId ? jugadores.find(x => x.id === c.jugadorId) : null
    setDatos(d => ({ ...d, carta: { ...d.carta, ...c }, ...(j ? { nombre: j.nombre } : {}) }))
  }

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-jugador-${slug(datos.nombre)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Jugador</legend>
          <SelectorJugador
            valor={datos.carta} onChange={cambiarCarta} equipos={equipos}
            fotoManual={fotosManuales.carta} onFoto={archivo => subir('carta', archivo)} onQuitarFoto={() => quitar('carta')}
          />
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <label className="graficos-campo">Nombre en grande<input value={datos.nombre} onChange={e => cambiar({ nombre: e.target.value })} /></label>
          <div className="graficos-fila">
            <label className="graficos-campo">Etiqueta (encima, opcional)<input value={datos.etiqueta} onChange={e => cambiar({ etiqueta: e.target.value })} placeholder="P. ej. Jugador del mes" /></label>
            <label className="graficos-campo">Pastilla (debajo)<input value={datos.pastilla} onChange={e => cambiar({ pastilla: e.target.value })} placeholder="2026/27" /></label>
          </div>
        </fieldset>
        <CampoFoto foto={foto} retoque={retoque} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
