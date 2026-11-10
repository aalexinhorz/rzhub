import { useState } from 'react'
import { compartirCanvas, descargarCanvas } from '../../lib/graficosComun'

// Botones de Descargar PNG y Compartir bajo la vista previa.
export default function AccionesGrafico({ canvasRef, nombreArchivo }) {
  const [aviso, setAviso] = useState('')
  const compartir = async () => {
    const compartido = await compartirCanvas(canvasRef.current, nombreArchivo)
    if (!compartido) setAviso('Tu navegador no deja compartir: se ha descargado.')
  }
  return (
    <>
      <div className="graficos-acciones">
        <button type="button" className="rz-btn rz-btn--primary" onClick={() => descargarCanvas(canvasRef.current, nombreArchivo)}>Descargar PNG</button>
        <button type="button" className="rz-btn rz-btn--ghost" onClick={compartir}>Compartir</button>
      </div>
      {aviso && <p className="graficos-aviso">{aviso}</p>}
    </>
  )
}
