import { useEffect, useRef, useState } from 'react'
import { cargarImagen, desplazamientoValido, escudoDe, urlParaCanvas } from './graficosComun'
import { cargarEquiposGraficos, cargarJugadoresGraficos } from './graficosDatos'
import { RETOQUE_NEUTRO, esNeutro, retocar } from './retoqueFoto'

// Hooks y utilidades compartidas por las plantillas de /redaccion-graficos.

export function leerLocal(clave, porDefecto) {
  try { return { ...porDefecto, ...JSON.parse(localStorage.getItem(clave)) } } catch { return porDefecto }
}

export function useGuardarLocal(clave, valor) {
  useEffect(() => {
    try { localStorage.setItem(clave, JSON.stringify(valor)) } catch { /* privado o lleno */ }
  }, [clave, valor])
}

// Foto retocada (tipo Camera Raw). Mientras se mueve un deslizador se
// calcula una versión pequeña al momento y, al parar, la buena.
const LADO_PREVIO = 1200
const LADO_FINAL = 2600
function useRetoque(original) {
  const [valores, setValores] = useState(RETOQUE_NEUTRO)
  const [retocada, setRetocada] = useState(null)
  const [verOriginal, setVerOriginal] = useState(false)
  useEffect(() => {
    if (!original || esNeutro(valores)) return
    const guardar = lado => () => setRetocada({ original, valores, img: retocar(original, valores, lado) })
    const rapido = requestAnimationFrame(guardar(LADO_PREVIO))
    const fino = setTimeout(guardar(LADO_FINAL), 350)
    return () => { cancelAnimationFrame(rapido); clearTimeout(fino) }
  }, [original, valores])
  const activa = original && !verOriginal && !esNeutro(valores) && retocada?.original === original
  return {
    foto: activa ? retocada.img : original,
    control: {
      valores,
      cambiar: (clave, valor) => setValores(v => ({ ...v, [clave]: valor })),
      restablecer: () => setValores(RETOQUE_NEUTRO),
      verOriginal, setVerOriginal,
    },
  }
}

// Foto subida por el usuario que se encuadra arrastrándola dentro de `zona`
// (coordenadas del gráfico de 1080 de ancho). Los retoques se mantienen al
// cambiar de foto (para sacar varias con el mismo estilo).
export function useFotoArrastrable(zona, ajuste, setAjuste) {
  const [original, setOriginal] = useState(null)
  const { foto, control: retoque } = useRetoque(original)
  const arrastre = useRef(null)

  const elegirFoto = e => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    cargarImagen(URL.createObjectURL(archivo)).then(img => { setOriginal(img); setAjuste({ zoom: 1, dx: 0, dy: 0 }) })
  }

  const enZona = e => {
    const escala = 1080 / e.currentTarget.clientWidth
    const x = e.nativeEvent.offsetX * escala
    const y = e.nativeEvent.offsetY * escala
    return x >= zona.x && x <= zona.x + zona.w && y >= zona.y && y <= zona.y + zona.h
  }
  const handlers = {
    onPointerDown: e => {
      if (!foto || !enZona(e)) return
      e.currentTarget.setPointerCapture(e.pointerId)
      arrastre.current = { x: e.clientX, y: e.clientY, ...ajuste }
    },
    onPointerMove: e => {
      const a = arrastre.current
      if (!a || !foto) return
      const escala = 1080 / e.currentTarget.clientWidth
      setAjuste(desplazamientoValido(foto, zona, a.zoom, a.dx + (e.clientX - a.x) * escala, a.dy + (e.clientY - a.y) * escala))
    },
    onPointerUp: () => { arrastre.current = null },
    onPointerCancel: () => { arrastre.current = null },
  }
  return { foto, elegirFoto, handlers, retoque }
}

// Equipos (Real Zaragoza + rivales con plantilla), una sola carga.
let equiposCache = null
export function useEquiposGraficos() {
  const [equipos, setEquipos] = useState(equiposCache || [])
  useEffect(() => {
    if (equiposCache) return
    cargarEquiposGraficos().then(lista => { equiposCache = lista; setEquipos(lista) })
  }, [])
  return equipos
}

const jugadoresCache = {}
export function useJugadores(equipoId) {
  const [, setVersion] = useState(0)
  useEffect(() => {
    if (!equipoId || jugadoresCache[equipoId]) return
    let activo = true
    cargarJugadoresGraficos(equipoId).then(l => { jugadoresCache[equipoId] = l; if (activo) setVersion(v => v + 1) })
    return () => { activo = false }
  }, [equipoId])
  return equipoId ? jugadoresCache[equipoId] || null : null
}

// Foto (con CORS, para poder exportar) y escudo de cada jugador elegido.
// Las fotos de webs que no lo permiten salen como null: la tarjeta pone el escudo.
export function useRecursosJugadores(selecciones, equipos) {
  const [recursos, setRecursos] = useState([])
  const clave = selecciones.map(s => `${s.equipoId || ''}:${s.jugadorId || ''}`).join('|')
  useEffect(() => {
    let activo = true
    const lista = clave.split('|').map(t => { const [equipoId, jugadorId] = t.split(':'); return { equipoId, jugadorId } })
    Promise.all(lista.map(async s => {
      const equipo = equipos.find(e => e.id === s.equipoId)
      // Con un borrador guardado, la plantilla del equipo puede no estar cargada aún.
      if (s.equipoId && s.jugadorId && !jugadoresCache[s.equipoId]) jugadoresCache[s.equipoId] = await cargarJugadoresGraficos(s.equipoId)
      const jugador = jugadoresCache[s.equipoId]?.find(j => j.id === s.jugadorId)
      const [foto, escudo] = await Promise.all([
        jugador?.foto ? cargarImagen(urlParaCanvas(jugador.foto), { cors: true }) : null,
        equipo ? cargarImagen(encodeURI(escudoDe(equipo.nombre) || equipo.escudo || '')) : null,
      ])
      return { foto, escudo, esZaragoza: s.equipoId === 'real-zaragoza' }
    })).then(r => { if (activo) setRecursos(r) })
    return () => { activo = false }
  }, [clave, equipos])
  return recursos
}

// Fotos subidas a mano para las tarjetas (cuando la de la web no carga).
export function useFotosManuales() {
  const [fotos, setFotos] = useState({})
  const subir = (clave, archivo) => {
    if (!archivo) return
    cargarImagen(URL.createObjectURL(archivo)).then(img => setFotos(f => ({ ...f, [clave]: img })))
  }
  const quitar = clave => setFotos(f => { const n = { ...f }; delete n[clave]; return n })
  return { fotos, subir, quitar }
}
