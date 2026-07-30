/**
 * mercado.js — rzhub.es
 * Inserta un movimiento de mercado (alta o baja) en la tabla 'mercado' de Supabase.
 * También actualiza is_zaragoza en la tabla 'players'.
 *
 * Uso:
 *   node --env-file=.env.local scripts/mercado.js "Bazdar" baja "Teruel"
 *   node --env-file=.env.local scripts/mercado.js "De Miguel" alta "Villarreal"
 */

import { createClient } from '@supabase/supabase-js'

const [,, nombre, tipo, club, posicionArg] = process.argv

// ── Validación de argumentos ──────────────────────────────────
if (!nombre || !tipo || !club) {
  console.error('❌ Uso: node --env-file=.env.local scripts/mercado.js "Nombre" alta|baja "Club"')
  process.exit(1)
}
if (!['alta', 'baja'].includes(tipo.toLowerCase())) {
  console.error('❌ El tipo debe ser "alta" o "baja"')
  process.exit(1)
}

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno.')
  process.exit(1)
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function registrarMovimiento() {
  const tipoNorm = tipo.toLowerCase()
  const isAlta   = tipoNorm === 'alta'

  console.log(`\n${'═'.repeat(52)}`)
  console.log(`  rzhub.es — Mercado`)
  console.log(`  ${isAlta ? '🟢 ALTA' : '🔴 BAJA'}: ${nombre} ${isAlta ? `← ${club}` : `→ ${club}`}`)
  console.log(`${'═'.repeat(52)}\n`)

  // ── 1. Buscar jugador en tabla players para sacar foto y posición ──
  const { data: jugadores, error: errorBuscar } = await supabase
    .from('players')
    .select('id, name, photo, position, is_zaragoza')
    .ilike('name', `%${nombre}%`)
    .limit(5)

  if (errorBuscar) {
    console.error('❌ Error buscando jugador:', errorBuscar.message)
    process.exit(1)
  }

  if (!jugadores || jugadores.length === 0) {
    console.error(`❌ No se encontró "${nombre}" en la tabla players.`)
    console.error('   Añádelo primero con: python3 scripts/sync_jugador.py "' + nombre + '"')
    process.exit(1)
  }

  // Si hay varios resultados, usar el primero (Claude Code habrá especificado el nombre exacto)
  const jugador = jugadores[0]
  const fotoUrl = jugador.photo || null
  const posicion = jugador.position || posicionArg || 'MED'
  const nombreCompleto = jugador.name || nombre

  console.log(`  → Jugador encontrado: ${nombreCompleto} (${posicion})`)

  // ── 2. Insertar en tabla mercado ──────────────────────────────
  const movimiento = {
    tipo        : tipoNorm,
    nombre      : nombreCompleto,
    posicion    : posicion,
    club_origen : isAlta ? club : 'Real Zaragoza',
    club_destino: isAlta ? 'Real Zaragoza' : club,
    foto_url    : fotoUrl,
    fecha       : new Date().toISOString().split('T')[0], // hoy
  }

  const { error: errorMercado } = await supabase
    .from('mercado')
    .insert(movimiento)

  if (errorMercado) {
    console.error('❌ Error insertando en mercado:', errorMercado.message)
    process.exit(1)
  }

  console.log(`  ✅ Movimiento registrado en mercado`)

  // ── 3. Actualizar is_zaragoza en players ──────────────────────
  const { error: errorUpdate } = await supabase
    .from('players')
    .update({ is_zaragoza: isAlta })
    .ilike('name', `%${nombre}%`)

  if (errorUpdate) {
    console.error('❌ Error actualizando players:', errorUpdate.message)
    process.exit(1)
  }

  console.log(`  ✅ Players actualizado: is_zaragoza = ${isAlta}`)

  // ── Resumen final ─────────────────────────────────────────────
  console.log(`\n${'═'.repeat(52)}`)
  if (isAlta) {
    console.log(`  🟢 ${nombreCompleto} llega desde ${club}`)
  } else {
    console.log(`  🔴 ${nombreCompleto} sale hacia ${club}`)
  }
  console.log(`${'═'.repeat(52)}\n`)
}

registrarMovimiento()
