import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../hooks/useAuth'
import { ESCUDOS_CLUBS } from '../../lib/escudos'
import { escudoDe } from '../../lib/graficosComun'

// Partidos y horarios desde el móvil: añadir un partido (sobre todo de Copa)
// y cambiar día y hora cuando se confirma. Lo guarda la función
// gestionar-partido en la porra (y en el calendario de liga), y GitHub rehace
// solo el calendario.ics de la web.

const RONDAS = ['1.ª Eliminatoria', '2.ª Eliminatoria', '3.ª Eliminatoria', 'Dieciseisavos de final', 'Octavos de final', 'Cuartos de final', 'Semifinales', 'Final']
const VACIO = { id: null, tipo: 'copa', jornada: '', ronda: RONDAS[1], rival: '', sede: 'local', fecha: '', hora: '', sinHora: false, tv: '' }

const horaDe = iso => new Date(iso).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
const fechaLarga = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })

function aFormulario(p) {
  const copa = !!p.competicion
  return {
    id: p.id, tipo: copa ? 'copa' : 'liga', jornada: p.jornada || '', ronda: copa ? p.competicion.split('·')[1]?.trim() || RONDAS[1] : RONDAS[1],
    rival: p.rival, sede: p.sede, fecha: p.fecha, hora: p.hora_confirmada ? horaDe(p.kickoff) : '', sinHora: !p.hora_confirmada, tv: p.tv || '',
  }
}

function Formulario({ inicial, rivales, onCancelar, onGuardado }) {
  const [f, setF] = useState(inicial)
  const [estado, setEstado] = useState({ cargando: false, error: '' })
  const cambiar = c => setF(x => ({ ...x, ...c }))
  const editandoLiga = !!f.id && f.tipo === 'liga'

  const guardar = async () => {
    setEstado({ cargando: true, error: '' })
    const { data, error } = await supabase.functions.invoke('gestionar-partido', {
      body: { accion: 'guardar', id: f.id, tipo: f.tipo, jornada: f.jornada, ronda: f.ronda, rival: f.rival, sede: f.sede, fecha: f.fecha, hora: f.sinHora ? '' : f.hora, tv: f.tv },
    })
    let msg = data?.error
    if (!msg && error) msg = (await error.context?.json?.().catch(() => ({})))?.error || 'No se ha podido guardar'
    if (msg) { setEstado({ cargando: false, error: msg }); return }
    setEstado({ cargando: false, error: '' })
    onGuardado(data?.calendario)
  }
  const borrar = async () => {
    if (!window.confirm(`¿Borrar ${f.rival} de la porra y del calendario?`)) return
    setEstado({ cargando: true, error: '' })
    const { data, error } = await supabase.functions.invoke('gestionar-partido', { body: { accion: 'borrar', id: f.id } })
    let msg = data?.error
    if (!msg && error) msg = (await error.context?.json?.().catch(() => ({})))?.error || 'No se ha podido borrar'
    if (msg) { setEstado({ cargando: false, error: msg }); return }
    onGuardado(data?.calendario, true)
  }

  return (
    <form className="partidos-form graficos-form" onSubmit={e => { e.preventDefault(); guardar() }}>
      <fieldset>
        <legend>{f.id ? 'Cambiar partido' : 'Nuevo partido'}</legend>
        {!editandoLiga && (
          <div className="graficos-fila">
            <label className="graficos-campo">
              Competición
              <select value={f.tipo} onChange={e => cambiar({ tipo: e.target.value })} disabled={!!f.id}>
                <option value="copa">Copa del Rey</option>
                <option value="liga">Liga</option>
              </select>
            </label>
            {f.tipo === 'copa'
              ? <label className="graficos-campo">Ronda<select value={f.ronda} onChange={e => cambiar({ ronda: e.target.value })}>{RONDAS.map(r => <option key={r}>{r}</option>)}</select></label>
              : <label className="graficos-campo graficos-campo--valor">Jornada<input type="number" min="1" max="50" value={f.jornada} onChange={e => cambiar({ jornada: e.target.value })} /></label>}
          </div>
        )}
        {editandoLiga
          ? <p className="graficos-nota">Jornada {f.jornada} · {f.sede === 'local' ? 'Real Zaragoza - ' + f.rival : f.rival + ' - Real Zaragoza'}</p>
          : (
            <>
              <datalist id="partidos-rivales">{rivales.map(r => <option key={r} value={r} />)}</datalist>
              <div className="graficos-fila">
                <label className="graficos-campo">Rival<input list="partidos-rivales" value={f.rival} onChange={e => cambiar({ rival: e.target.value })} placeholder="Burgos CF" /></label>
                <label className="graficos-campo">
                  Dónde
                  <select value={f.sede} onChange={e => cambiar({ sede: e.target.value })}>
                    <option value="local">En casa</option>
                    <option value="visitante">Fuera</option>
                  </select>
                </label>
              </div>
              {f.rival && !escudoDe(f.rival) && <p className="graficos-nota graficos-nota--aviso">No tengo escudo de «{f.rival}»: elige el nombre de la lista o avísame para añadirlo.</p>}
            </>
          )}
        <div className="graficos-fila">
          <label className="graficos-campo">Día<input type="date" value={f.fecha} onChange={e => cambiar({ fecha: e.target.value })} required /></label>
          <label className="graficos-campo graficos-campo--valor">Hora<input type="time" value={f.hora} disabled={f.sinHora} onChange={e => cambiar({ hora: e.target.value })} /></label>
        </div>
        <label className="graficos-check"><input type="checkbox" checked={f.sinHora} onChange={e => cambiar({ sinHora: e.target.checked })} /> Aún sin hora oficial (sale como «todo el día» en el calendario)</label>
        <label className="graficos-campo">Televisión (opcional)<input value={f.tv} onChange={e => cambiar({ tv: e.target.value })} placeholder="Aragón TV, DAZN…" /></label>
        {estado.error && <p className="graficos-aviso graficos-aviso--error">{estado.error}</p>}
        <div className="graficos-acciones">
          <button type="submit" className="rz-btn rz-btn--primary" disabled={estado.cargando || !f.fecha || (!f.sinHora && !f.hora)}>{estado.cargando ? 'Guardando…' : 'Guardar'}</button>
          <button type="button" className="rz-btn rz-btn--ghost" onClick={onCancelar}>Cancelar</button>
        </div>
        {f.id && f.tipo === 'copa' && <button type="button" className="graficos-mini-boton" onClick={borrar} disabled={estado.cargando}>Borrar este partido</button>}
      </fieldset>
    </form>
  )
}

export default function GestionPartidos() {
  const [partidos, setPartidos] = useState(null)
  const [rivales, setRivales] = useState([])
  const [editando, setEditando] = useState(null)
  const [aviso, setAviso] = useState('')

  const cargar = () => supabase.from('porra_partidos').select('id, rival, sede, fecha, kickoff, jornada, competicion, hora_confirmada, tv, abierto')
    .eq('finalizado', false).order('kickoff').then(({ data }) => setPartidos(data || []))
  useEffect(() => {
    cargar()
    supabase.from('rivales').select('nombre').then(({ data }) => setRivales([...new Set([...(data || []).map(r => r.nombre), ...Object.keys(ESCUDOS_CLUBS)])].sort((a, b) => a.localeCompare(b, 'es'))))
  }, [])

  const guardado = (calendario, borrado) => {
    setEditando(null)
    cargar()
    setAviso(`${borrado ? 'Borrado' : 'Guardado'} en la porra.${calendario === 'ok' ? ' El calendario de la web se actualiza solo en 1-2 minutos.' : ` Ojo: no se ha podido avisar para el calendario (${calendario}).`}`)
  }

  const lista = useMemo(() => partidos || [], [partidos])

  return (
    <div className="partidos">
      {aviso && <p className="graficos-nota partidos-aviso">{aviso}</p>}
      {editando
        ? <Formulario inicial={editando} rivales={rivales} onCancelar={() => setEditando(null)} onGuardado={guardado} />
        : <button type="button" className="rz-btn rz-btn--primary partidos-nuevo" onClick={() => { setAviso(''); setEditando({ ...VACIO }) }}>+ Añadir partido</button>}
      {!partidos ? <p className="graficos-nota">Cargando…</p> : (
        <ul className="partidos-lista">
          {lista.map(p => (
            <li key={p.id} className={p.abierto ? 'es-abierto' : ''}>
              <div className="partidos-lista__info">
                <span className="partidos-lista__comp">{p.competicion ? p.competicion.replace('Copa del Rey · ', 'Copa · ') : `J${p.jornada}`}{p.abierto ? ' · porra abierta' : ''}</span>
                <strong>{p.sede === 'local' ? `Real Zaragoza - ${p.rival}` : `${p.rival} - Real Zaragoza`}</strong>
                <span>{fechaLarga(p.fecha)} · {p.hora_confirmada ? horaDe(p.kickoff) : <em>sin hora</em>}{p.tv ? ` · ${p.tv}` : ''}</span>
              </div>
              <button type="button" className="graficos-mini-boton" onClick={() => { setAviso(''); setEditando(aFormulario(p)); window.scrollTo(0, 0) }}>Cambiar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
