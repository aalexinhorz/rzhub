import { createClient } from '@supabase/supabase-js'

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Faltan variables de entorno. Ejecuta con: node --env-file=.env.local scripts/set-kickoff.js <jornada> <kickoff>')
  process.exit(1)
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const [, , jornadaArg, kickoffArg] = process.argv

if (!jornadaArg || !kickoffArg) {
  console.error('Uso: node --env-file=.env.local scripts/set-kickoff.js <jornada> <kickoff ISO, ej: 2026-09-06T18:00:00+02:00>')
  process.exit(1)
}

const jornada = parseInt(jornadaArg, 10)
const kickoff = new Date(kickoffArg)

if (Number.isNaN(jornada) || Number.isNaN(kickoff.getTime())) {
  console.error('Jornada o fecha inválida.')
  process.exit(1)
}

const fecha = kickoff.toISOString().slice(0, 10)

const { data, error } = await supabase
  .from('porra_partidos')
  .update({ kickoff: kickoff.toISOString(), fecha })
  .eq('jornada', jornada)
  .select()

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
if (!data || data.length === 0) {
  console.error(`⚠️ No se encontró ningún partido con jornada ${jornada}`)
  process.exit(1)
}

console.log(`✅ Jornada ${jornada} (${data[0].rival}) → ${kickoff.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}`)