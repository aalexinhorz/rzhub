import { useEffect, useState } from 'react'
import useAuth, { supabase } from '../hooks/useAuth'

// Solo para las cuentas de RZ Hub: avisa cuando el cierre automático de la
// porra (edge function porra-automatica) se ha quedado parado por una duda,
// o cuando ha cerrado pero con algo que mirar (p. ej. notas sin abrir).
// porra_auto tiene RLS: al resto de usuarios la consulta les vuelve vacía.
const ADMINS = new Set([
  '20cca270-3dfa-4a7c-8cab-918eeffa5940', // rzhub1932
  '8c70d58c-bf4f-446e-8bbc-b91461647dac', // aalexinho_
])
const REFRESCO_MS = 5 * 60_000
const VENTANA_AVISOS_MS = 24 * 3600_000

const claveDescartado = a => `porra_auto_visto_${a.partido_id}_${a.actualizado_at}`

function leerDescartado(a) {
  try { return sessionStorage.getItem(claveDescartado(a)) === '1' } catch { return false }
}

export default function AvisoPorraAuto() {
  const { user } = useAuth()
  const esAdmin = !!user && ADMINS.has(user.id)
  const [avisos, setAvisos] = useState([])

  useEffect(() => {
    if (!esAdmin) return
    let activo = true
    function cargar() {
      supabase.from('porra_auto')
        .select('partido_id, estado, motivo, cerrado_at, actualizado_at, alineacion_estado, alineacion_motivo, porra_partidos(rival)')
        .or('estado.in.(revisar,cerrado),alineacion_estado.eq.revisar')
        .then(({ data }) => {
          if (!activo || !data) return
          const ahora = Date.now()
          const lista = []
          for (const a of data) {
            if (a.estado === 'revisar' || (a.estado === 'cerrado' && a.motivo && ahora - Date.parse(a.cerrado_at) < VENTANA_AVISOS_MS)) {
              lista.push({ ...a, tipo: a.estado })
            }
            // El once del Vestuario Blanquillo es aparte: avisa sin tapar el de la porra.
            if (a.alineacion_estado === 'revisar') {
              lista.push({ ...a, tipo: 'once', motivo: a.alineacion_motivo, actualizado_at: `once-${a.actualizado_at}` })
            }
          }
          setAvisos(lista.filter(a => !leerDescartado(a)))
        })
    }
    cargar()
    const id = setInterval(cargar, REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [esAdmin])

  if (!esAdmin || avisos.length === 0) return null

  function descartar(a) {
    try { sessionStorage.setItem(claveDescartado(a), '1') } catch { /* sin sessionStorage */ }
    setAvisos(lista => lista.filter(x => x !== a))
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 'min(380px, calc(100vw - 32px))' }}>
      {avisos.map(a => {
        const revisar = a.tipo !== 'cerrado'
        const titulo = a.tipo === 'once' ? '⚠️ Once sin completar' : revisar ? '⚠️ Porra sin cerrar' : '✅ Porra cerrada sola'
        return (
          <div key={`${a.partido_id}-${a.tipo}`} role="alert" style={{
            background: revisar ? '#3b0d0d' : '#0d2a4a', border: `1px solid ${revisar ? '#ef4444' : '#38bdf8'}`,
            borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, lineHeight: 1.45,
            boxShadow: '0 12px 30px rgba(0,0,0,.45)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
              <strong>{titulo} · {a.porra_partidos?.rival}</strong>
              <button type="button" onClick={() => descartar(a)} aria-label="Ocultar aviso" style={{ background: 'none', border: 0, color: 'rgba(255,255,255,.6)', fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.8)' }}>{a.motivo}</p>
            {revisar && <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.55)', fontSize: 12 }}>{a.tipo === 'once' ? 'Pásaselo a Claude y lo completamos a mano.' : 'Pásale a Claude el resultado y lo cerramos a mano.'}</p>}
          </div>
        )
      })}
    </div>
  )
}
