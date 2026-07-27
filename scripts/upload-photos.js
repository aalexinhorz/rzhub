import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Faltan variables de entorno. Ejecuta con: node --env-file=.env.local scripts/upload-photos.js')
  process.exit(1)
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function uploadPhotos() {
  const { data: players, error } = await supabase.from('players').select('id, name, photo')
  if (error) { console.error('Error leyendo jugadores:', error); return }

  console.log(`📋 ${players.length} jugadores encontrados`)

  for (const player of players) {
    if (!player.photo) { console.log(`⏭ ${player.name} sin foto`); continue }
    if (player.photo.includes('supabase.co')) { console.log(`⏭ ${player.name} ya en Supabase`); continue }

    try {
      console.log(`📥 Descargando ${player.name}...`)
      const res = await fetch(player.photo)
      if (!res.ok) { console.log(`❌ Error descargando ${player.name}: ${res.status}`); continue }

      const buffer = await res.arrayBuffer()
      const fileName = `${player.id}.png`

      const { error: uploadError } = await supabase.storage
        .from('photoplayers')
        .upload(fileName, buffer, { contentType: 'image/png', upsert: true })

      if (uploadError) { console.log(`❌ Error subiendo ${player.name}:`, uploadError.message); continue }

      const { data: { publicUrl } } = supabase.storage.from('photoplayers').getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('players')
        .update({ photo: publicUrl })
        .eq('id', player.id)

      if (updateError) console.log(`❌ Error actualizando ${player.name}:`, updateError.message)
      else console.log(`✅ ${player.name} → ${publicUrl}`)

    } catch (e) {
      console.log(`❌ ${player.name}: ${e.message}`)
    }
  }

  console.log('\n🎉 Proceso completado')
}

uploadPhotos()