import { useEffect, useState } from 'react'
import { supabase } from '../../hooks/useAuth'

// "Generar copy": manda el gráfico (como imagen) a la función generar-copy,
// que escribe el copy con IA (Gemini, plan gratuito) imitando los copys de
// referencia. Se puede editar a mano, darle instrucciones (también para
// retocar el copy ya escrito), pedir otra versión, copiarlo y guardar los
// buenos como referencia (así se va "entrenando" con el estilo de la redacción).

// Miniatura JPG del canvas (más ligera que el original a 2x).
function imagenDe(canvas) {
  const c = document.createElement('canvas')
  c.width = 720
  c.height = Math.round(720 * canvas.height / canvas.width)
  const g = c.getContext('2d')
  g.imageSmoothingQuality = 'high'
  g.drawImage(canvas, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.82)
}

// Longitud como la cuenta X (emojis y negritas cuentan 2).
const largoX = t => [...t].reduce((n, c) => n + (c.codePointAt(0) > 0x2FFF ? 2 : 1), 0)

function Copiable({ titulo, valor, onCambiar, limite }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try { await navigator.clipboard.writeText(valor); setCopiado(true); setTimeout(() => setCopiado(false), 1500) } catch { /* sin permiso */ }
  }
  const largo = limite ? largoX(valor) : null
  return (
    <div className="copy-bloque">
      <div className="copy-bloque__cabecera">
        <span>{titulo}{largo != null && <em className={largo > limite ? 'es-largo' : ''}> · {largo}/{limite}</em>}</span>
        <button type="button" className="graficos-mini-boton" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar'}</button>
      </div>
      <textarea rows={titulo === 'X' ? 4 : 9} value={valor} onChange={e => onCambiar(e.target.value)} />
    </div>
  )
}

export default function GeneradorCopy({ canvasRef, plantilla }) {
  const [abierto, setAbierto] = useState(false)
  const [instrucciones, setInstrucciones] = useState('')
  const [copy, setCopy] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)
  const [refs, setRefs] = useState(null)
  const [verRefs, setVerRefs] = useState(false)
  const [nueva, setNueva] = useState('')

  const cargarRefs = () => supabase.from('copys_referencia').select('id, texto, plantilla').order('created_at', { ascending: false })
    .then(({ data }) => setRefs(data || []))
  useEffect(() => { if (abierto && !refs) cargarRefs() }, [abierto]) // eslint-disable-line react-hooks/exhaustive-deps

  // modo: 'nuevo' | 'otra' (otra versión) | 'ajustar' (aplica las instrucciones al copy actual, con tus cambios)
  const generar = async modo => {
    if (!canvasRef.current) return
    setCargando(true); setError(''); setGuardado(false)
    const { data, error: err } = await supabase.functions.invoke('generar-copy', {
      body: {
        imagen: imagenDe(canvasRef.current), plantilla, instrucciones, modo,
        anterior: modo !== 'nuevo' && copy ? copy.instagram : '', anterior_x: modo === 'ajustar' && copy ? copy.x : '',
      },
    })
    setCargando(false)
    if (err || data?.error) {
      let msg = data?.error
      if (!msg && err?.context?.json) msg = (await err.context.json().catch(() => ({}))).error
      setError(msg || 'No se ha podido generar. Inténtalo otra vez.')
      return
    }
    setCopy(data)
  }

  const guardarReferencia = async texto => {
    const { error: err } = await supabase.from('copys_referencia').insert({ texto, plantilla })
    if (err) { setError('No se ha podido guardar la referencia.'); return false }
    cargarRefs()
    return true
  }
  const borrarRef = async id => {
    if (!window.confirm('¿Quitar este copy de las referencias?')) return
    await supabase.from('copys_referencia').delete().eq('id', id)
    cargarRefs()
  }

  if (!abierto) {
    return <button type="button" className="rz-btn rz-btn--ghost copy-abrir" onClick={() => setAbierto(true)}>✍️ Generar copy</button>
  }

  return (
    <div className="copy-panel">
      <div className="copy-panel__cabecera">
        <strong>✍️ Copy para redes</strong>
        <button type="button" className="graficos-mini-boton" onClick={() => setAbierto(false)}>Cerrar</button>
      </div>
      <p className="graficos-nota">Lee lo que sale en el gráfico y escribe el copy con el estilo de las referencias.</p>
      <label className="graficos-campo">
        Instrucciones (opcional)
        <textarea rows={3} value={instrucciones} onChange={e => setInstrucciones(e.target.value)}
          placeholder={copy ? 'Para retocarlo: «hazlo más corto», «quita la lista», «cambia la pregunta final», «menciona a @usuario»…' : 'Lo que no se ve en el gráfico o cómo lo quieres: «es su primer gol», «tono más serio», «termina invitando a la porra»…'} />
      </label>
      <div className="graficos-acciones">
        {copy && instrucciones.trim()
          ? <button type="button" className="rz-btn rz-btn--primary" disabled={cargando} onClick={() => generar('ajustar')}>{cargando ? 'Escribiendo…' : 'Aplicar instrucciones'}</button>
          : <button type="button" className="rz-btn rz-btn--primary" disabled={cargando} onClick={() => generar('nuevo')}>{cargando ? 'Escribiendo…' : copy ? 'Generar de nuevo' : 'Generar copy'}</button>}
        {copy && <button type="button" className="rz-btn rz-btn--ghost" disabled={cargando} onClick={() => generar('otra')}>Otra versión</button>}
      </div>
      {error && <p className="graficos-aviso graficos-aviso--error">{error}</p>}
      {copy && (
        <>
          <Copiable titulo="Instagram" valor={copy.instagram} onCambiar={v => setCopy(c => ({ ...c, instagram: v }))} />
          <Copiable titulo="X" valor={copy.x} limite={280} onCambiar={v => setCopy(c => ({ ...c, x: v }))} />
          <button type="button" className="graficos-mini-boton" disabled={guardado} onClick={async () => { if (await guardarReferencia(copy.instagram)) setGuardado(true) }}>
            {guardado ? '✓ Guardado como referencia' : '⭐ Guardar como referencia (lo usará de modelo)'}
          </button>
          <p className="graficos-nota">Puedes editar los dos textos a mano. Para que la IA lo retoque sobre tu versión, escribe arriba qué cambiar y pulsa «Aplicar instrucciones». Revísalo antes de publicar: puede equivocarse con algún dato.</p>
        </>
      )}
      <button type="button" className="copy-refs-toggle" onClick={() => setVerRefs(v => !v)}>
        {verRefs ? '▾' : '▸'} Copys de referencia ({refs ? refs.length : '…'})
      </button>
      {verRefs && (
        <div className="copy-refs">
          <p className="graficos-nota">Son los que la IA imita. Añade los que más te gusten (tuyos o de otras cuentas) y quita los que no.</p>
          <textarea rows={4} value={nueva} onChange={e => setNueva(e.target.value)} placeholder="Pega aquí un copy de referencia…" />
          <button type="button" className="graficos-mini-boton" disabled={!nueva.trim()} onClick={async () => { if (await guardarReferencia(nueva.trim())) setNueva('') }}>Añadir referencia</button>
          {(refs || []).map(r => (
            <div key={r.id} className="copy-ref">
              <pre>{r.texto}</pre>
              <button type="button" className="graficos-mini-boton" onClick={() => borrarRef(r.id)}>Quitar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
