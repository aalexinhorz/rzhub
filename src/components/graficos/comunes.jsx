import { useJugadores } from '../../lib/graficosHooks'

// Campos de formulario compartidos por las plantillas de /redaccion-graficos.

export function CampoFoto({ foto, elegirFoto, ajuste, setAjuste, credito, onCredito }) {
  return (
    <fieldset>
      <legend>Foto</legend>
      <label className="graficos-archivo">
        <input type="file" accept="image/*" onChange={elegirFoto} />
        <span>{foto ? 'Cambiar foto' : 'Subir foto'}</span>
      </label>
      {foto && (
        <label className="graficos-campo">
          Zoom
          <input type="range" min="1" max="3" step="0.01" value={ajuste.zoom} onChange={e => setAjuste({ ...ajuste, zoom: Number(e.target.value) })} />
        </label>
      )}
      <label className="graficos-campo">
        Crédito de la foto
        <input value={credito} onChange={e => onCredito(e.target.value)} placeholder="Foto: Nombre Apellido" />
      </label>
    </fieldset>
  )
}

// Foto a la izquierda (por defecto) o a la derecha (plantillas de lista).
// Al cambiar de lado se recoloca la foto en el centro.
export function CampoDisposicion({ datos, cambiar }) {
  return (
    <fieldset>
      <legend>Disposición</legend>
      <label className="graficos-campo">
        Foto
        <select value={datos.fotoDerecha ? 'derecha' : 'izquierda'} onChange={e => cambiar({ fotoDerecha: e.target.value === 'derecha', ajusteFoto: { zoom: datos.ajusteFoto.zoom, dx: 0, dy: 0 } })}>
          <option value="izquierda">A la izquierda (datos a la derecha)</option>
          <option value="derecha">A la derecha (datos a la izquierda)</option>
        </select>
      </label>
    </fieldset>
  )
}

export function CamposTexto({ datos, cambiar, conTitulo = true, ayudaExplicacion }) {
  return (
    <fieldset>
      <legend>Texto</legend>
      {conTitulo && (
        <label className="graficos-campo">
          Título
          <input value={datos.titulo} onChange={e => cambiar({ titulo: e.target.value })} />
        </label>
      )}
      <label className="graficos-campo">
        Subtítulo
        <input value={datos.subtitulo} onChange={e => cambiar({ subtitulo: e.target.value })} />
      </label>
      <label className="graficos-campo">
        Explicación (abajo)
        <textarea rows={2} value={datos.explicacion} onChange={e => cambiar({ explicacion: e.target.value })} placeholder={ayudaExplicacion} />
      </label>
    </fieldset>
  )
}

// Equipo + jugador de la base de datos (rellena el nombre); el nombre se
// puede cambiar a mano.
export function SelectorJugador({ valor, onChange, equipos, etiqueta = 'Jugador', fotoManual, onFoto, onQuitarFoto }) {
  const jugadores = useJugadores(valor.equipoId)
  return (
    <div className="graficos-fila graficos-fila--jugador">
      <label className="graficos-campo">
        Equipo
        <select value={valor.equipoId || ''} onChange={e => onChange({ equipoId: e.target.value, jugadorId: '', nombre: '' })}>
          <option value="">—</option>
          {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </label>
      <label className="graficos-campo">
        {etiqueta}
        <select
          value={valor.jugadorId || ''} disabled={!jugadores}
          onChange={e => { const j = jugadores.find(x => x.id === e.target.value); onChange({ jugadorId: e.target.value, nombre: j?.corto || '' }) }}
        >
          <option value="">—</option>
          {(jugadores || []).map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
        </select>
      </label>
      <label className="graficos-campo">
        Nombre en la tarjeta
        <input value={valor.nombre || ''} onChange={e => onChange({ nombre: e.target.value })} />
      </label>
      {onFoto && (
        <span className="graficos-foto-jugador">
          <label className="graficos-mini-boton">
            <input type="file" accept="image/*" onChange={e => onFoto(e.target.files?.[0])} />
            {fotoManual ? 'Cambiar foto' : 'Subir foto'}
          </label>
          {fotoManual && <button type="button" className="graficos-mini-boton" onClick={onQuitarFoto}>Quitar</button>}
        </span>
      )}
    </div>
  )
}

