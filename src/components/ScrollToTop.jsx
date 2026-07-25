import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop — React Router (a diferencia de una navegación clásica
 * entre páginas) no resetea el scroll al cambiar de ruta: la nueva
 * página hereda la posición de scroll de la anterior. Este componente
 * no pinta nada, solo escucha cada cambio de ruta y lleva la ventana
 * al inicio.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
