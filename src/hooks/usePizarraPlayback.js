import { useCallback, useRef, useState } from 'react'
import { DURACION_TRANSICION_MS, interpolarInstantaneas } from '../lib/pizarraInterpolacion'

export default function usePizarraPlayback(instantaneas) {
  const [reproduciendo, setReproduciendo] = useState(false)
  const [frame, setFrame] = useState(null)
  const rafRef = useRef(null)

  const detener = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setReproduciendo(false)
    setFrame(null)
  }, [])

  const reproducir = useCallback(() => {
    if (instantaneas.length < 2) return
    setReproduciendo(true)
    let index = 0
    let inicio = null

    function tick(ts) {
      if (inicio === null) inicio = ts
      const t = Math.min(1, (ts - inicio) / DURACION_TRANSICION_MS)
      setFrame(interpolarInstantaneas(instantaneas[index], instantaneas[index + 1], t))

      if (t >= 1) {
        index++
        if (index >= instantaneas.length - 1) {
          rafRef.current = null
          setReproduciendo(false)
          setTimeout(() => setFrame(null), 400)
          return
        }
        inicio = null
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [instantaneas])

  return { reproduciendo, frame, reproducir, detener }
}
