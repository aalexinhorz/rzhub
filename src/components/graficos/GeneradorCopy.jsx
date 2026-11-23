import { useState } from 'react'

// "Copy con ChatGPT": copia el gráfico al portapapeles y abre el proyecto de
// ChatGPT "Community Manager RZ Hub" (instrucciones y copys de referencia
// guardados allí). Solo hay que pegar la imagen y enviar. Se hace así porque
// la suscripción de ChatGPT no da acceso por API a los proyectos.
const PROYECTO = 'https://chatgpt.com/g/g-p-6b049ebe30348191981313be512a8383-community-manager-rzhub/project'

const blobDe = canvas => new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

export default function GeneradorCopy({ canvasRef }) {
  const [aviso, setAviso] = useState('')

  const abrir = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setAviso('')
    // El portapapeles se escribe dentro del propio toque (iOS lo exige): se le
    // pasa la promesa del PNG en vez de esperar a tenerlo.
    let copiado = false
    try {
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blobDe(canvas) })])
        copiado = true
      }
    } catch { /* sin permiso: se avisa abajo */ }
    window.open(PROYECTO, '_blank', 'noopener')
    setAviso(copiado
      ? 'Gráfico copiado. En ChatGPT, mantén pulsado el cuadro de texto → Pegar (Cmd+V en el ordenador), añade si quieres una indicación y envía.'
      : 'Tu navegador no deja copiar la imagen: descárgala con «Descargar JPG» y súbela en el chat de ChatGPT que se ha abierto.')
  }

  return (
    <div className="copy-chatgpt">
      <button type="button" className="rz-btn rz-btn--ghost copy-abrir" onClick={abrir}>✍️ Copy con ChatGPT</button>
      {aviso && <p className="graficos-nota">{aviso}</p>}
    </div>
  )
}
