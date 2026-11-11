import { useEffect, useMemo, useRef, useState } from 'react'
import { ESCUDOS_CLUBS } from '../../lib/escudos'
import { cargarImagen, contextoGrafico, ESCALA, escudoDe, slug } from '../../lib/graficosComun'
import { ANCHO, ALTO, ZONA_FOTO, dibujarGraficoMercado } from '../../lib/graficoMercado'
import { leerLocal, useFotoArrastrable, useGuardarLocal } from '../../lib/graficosHooks'
import AccionesGrafico from './AccionesGrafico'
import { CampoFoto } from './comunes'

// Plantilla "Fichaje / salida": anuncio de un fichaje o una salida del Real
// Zaragoza, con el esquema de la plantilla de estadísticas.
const ZARAGOZA = 'Real Zaragoza'
const CLUBES = [...new Set([ZARAGOZA, ...Object.keys(ESCUDOS_CLUBS)])].sort((a, b) => a.localeCompare(b, 'es'))
const OPERACIONES = ['Fichaje', 'Cesión', 'Traspaso', 'Libre', 'Renovación', 'Fin de contrato', 'Rescisión', 'Vuelve']
const INICIAL = {
  tipo: 'alta', de: '', a: ZARAGOZA, operacion: 'Fichaje', detalle: '', nombre: '', apellido: '',
  credito: '', ajusteFoto: { zoom: 1, dx: 0, dy: 0 },
}

// Borradores guardados con la versión anterior (un solo campo "club").
function leerBorrador() {
  const { club, ...d } = leerLocal('redaccion_grafico_mercado', INICIAL)
  if (club === undefined) return d
  return { ...d, ...(d.tipo === 'baja' ? { de: ZARAGOZA, a: club } : { de: club, a: ZARAGOZA }) }
}

// Escudo de un club por su nombre (null mientras carga o si no lo tenemos).
function useEscudo(nombre) {
  const [cargado, setCargado] = useState({ nombre: null, img: null })
  useEffect(() => {
    let activo = true
    cargarImagen(encodeURI(escudoDe(nombre) || '')).then(img => { if (activo) setCargado({ nombre, img }) })
    return () => { activo = false }
  }, [nombre])
  return cargado.nombre === nombre ? cargado.img : null
}

function CampoClub({ etiqueta, valor, onChange, escudo, manual, onManual }) {
  const subir = archivo => { if (archivo) cargarImagen(URL.createObjectURL(archivo)).then(onManual) }
  return (
    <div className="graficos-fila graficos-fila--jugador">
      <label className="graficos-campo">
        {etiqueta}
        <input list="graficos-clubes-mercado" value={valor} onChange={e => { onChange(e.target.value); onManual(null) }} />
      </label>
      <span className="graficos-foto-jugador">
        <label className="graficos-mini-boton">
          <input type="file" accept="image/*" onChange={e => subir(e.target.files?.[0])} />
          {manual ? 'Cambiar escudo' : 'Subir escudo'}
        </label>
        {manual && <button type="button" className="graficos-mini-boton" onClick={() => onManual(null)}>Quitar</button>}
      </span>
      {valor && !escudo && !manual && <p className="graficos-nota graficos-nota--aviso">No tenemos el escudo de «{valor}»: escríbelo como en la lista o súbelo.</p>}
    </div>
  )
}

export default function GraficoMercado({ logo, fuentesListas }) {
  const canvasRef = useRef(null)
  const [datos, setDatos] = useState(leerBorrador)
  useGuardarLocal('redaccion_grafico_mercado', datos)
  const cambiar = c => setDatos(d => ({ ...d, ...c }))
  const setAjuste = ajusteFoto => cambiar({ ajusteFoto })
  const { foto, elegirFoto, handlers } = useFotoArrastrable(ZONA_FOTO, datos.ajusteFoto, setAjuste)
  const escudoDeOrigen = useEscudo(datos.de)
  const escudoDeDestino = useEscudo(datos.a)
  const [manual, setManual] = useState({ de: null, a: null })
  const recursos = useMemo(() => ({
    foto, logo, escudoDe: manual.de || escudoDeOrigen, escudoA: manual.a || escudoDeDestino,
  }), [foto, logo, manual, escudoDeOrigen, escudoDeDestino])

  useEffect(() => {
    const c = canvasRef.current
    if (c) dibujarGraficoMercado(contextoGrafico(c), datos, recursos)
  }, [datos, recursos, fuentesListas])

  const intercambiar = () => {
    cambiar({ de: datos.a, a: datos.de })
    setManual(m => ({ de: m.a, a: m.de }))
  }
  // Al cambiar de tipo, el Real Zaragoza pasa a su lado (destino si llega,
  // origen si se va).
  const cambiarTipo = tipo => {
    cambiar({ tipo })
    if ((tipo === 'baja' && datos.a === ZARAGOZA) || (tipo === 'alta' && datos.de === ZARAGOZA)) intercambiar()
  }

  return (
    <div className="graficos-cuerpo">
      <div className="graficos-vista">
        <canvas ref={canvasRef} width={ANCHO * ESCALA} height={ALTO * ESCALA} className="graficos-canvas" {...handlers} />
        <AccionesGrafico canvasRef={canvasRef} nombreArchivo={`rzhub-mercado-${slug(`${datos.nombre} ${datos.apellido}`)}.png`} />
      </div>
      <form className="graficos-form" onSubmit={e => e.preventDefault()}>
        <fieldset>
          <legend>Movimiento</legend>
          <div className="graficos-fila">
            <label className="graficos-campo">
              Tipo
              <select value={datos.tipo} onChange={e => cambiarTipo(e.target.value)}>
                <option value="alta">Llega al Real Zaragoza</option>
                <option value="baja">Se va del Real Zaragoza</option>
              </select>
            </label>
            <label className="graficos-campo">
              Operación
              <input list="graficos-operaciones" value={datos.operacion} onChange={e => cambiar({ operacion: e.target.value })} />
              <datalist id="graficos-operaciones">{OPERACIONES.map(o => <option key={o} value={o} />)}</datalist>
            </label>
          </div>
          <datalist id="graficos-clubes-mercado">{CLUBES.map(c => <option key={c} value={c} />)}</datalist>
          <CampoClub
            etiqueta="De (club de origen)" valor={datos.de} onChange={de => cambiar({ de })}
            escudo={escudoDeOrigen} manual={manual.de} onManual={img => setManual(m => ({ ...m, de: img }))}
          />
          <CampoClub
            etiqueta="A (club de destino)" valor={datos.a} onChange={a => cambiar({ a })}
            escudo={escudoDeDestino} manual={manual.a} onManual={img => setManual(m => ({ ...m, a: img }))}
          />
          <button type="button" className="graficos-mini-boton" onClick={intercambiar}>⇅ Intercambiar clubes</button>
        </fieldset>
        <fieldset>
          <legend>Texto</legend>
          <div className="graficos-fila">
            <label className="graficos-campo">
              Nombre (pequeño, en amarillo)
              <input value={datos.nombre} onChange={e => cambiar({ nombre: e.target.value })} />
            </label>
            <label className="graficos-campo">
              Apellido (grande)
              <input value={datos.apellido} onChange={e => cambiar({ apellido: e.target.value })} />
            </label>
          </div>
          <label className="graficos-campo">
            Detalle (opcional)
            <input value={datos.detalle} onChange={e => cambiar({ detalle: e.target.value })} placeholder="P. ej. Hasta junio de 2028" />
          </label>
        </fieldset>
        <CampoFoto foto={foto} elegirFoto={elegirFoto} ajuste={datos.ajusteFoto} setAjuste={setAjuste} credito={datos.credito} onCredito={credito => cambiar({ credito })} />
      </form>
    </div>
  )
}
