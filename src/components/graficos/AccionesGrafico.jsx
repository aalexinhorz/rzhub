import { useState } from 'react'
import { compartirCanvas, descargarCanvas } from '../../lib/graficosComun'
import GeneradorCopy from './GeneradorCopy'

// Botones de Descargar JPG y Compartir bajo la vista previa.
// Debajo, el generador de copys (Instagram y X) con IA.
export default function AccionesGrafico({ canvasRef, nombreArchivo, plantilla }) {
  const [aviso, setAviso] = useState('')
  const compartir = async () => {
    const compartido = await compartirCanvas(canvasRef.current, nombreArchivo)
    if (!compartido) setAviso('Tu navegador no deja compartir: se ha descargado.')
  }
  return (
    <>
      <div className="graficos-acciones">
        <button type="button" className="rz-btn rz-btn--primary" onClick={() => descargarCanvas(canvasRef.current, nombreArchivo)}>Descargar JPG</button>
        <button type="button" className="rz-btn rz-btn--ghost" onClick={compartir}>Compartir</button>
      </div>
      {aviso && <p className="graficos-aviso">{aviso}</p>}
      <GeneradorCopy canvasRef={canvasRef} plantilla={plantilla || new URLSearchParams(window.location.search).get('plantilla') || nombreArchivo} />
    </>
  )
}
