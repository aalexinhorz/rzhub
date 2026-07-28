import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Faltan variables de entorno. Ejecuta con: node --env-file=.env.local scripts/upload-match-photos.js ...')
  process.exit(1)
}

const EQUIPOS = ['primer-equipo', 'aragon']

const [, , equipo, rival, matchDate, sede, folder] = process.argv

if (!equipo || !rival || !matchDate || !sede || !folder) {
  console.error(`
Uso: node --env-file=.env.local scripts/upload-match-photos.js <primer-equipo|aragon> "<rival>" <YYYY-MM-DD> <local|visitante> <carpeta>

Ejemplo:
  node --env-file=.env.local scripts/upload-match-photos.js primer-equipo "Gimnàstic de Tarragona" 2026-08-30 visitante ./fotos/tarragona

Sube cada imagen de la carpeta al bucket "matchphotos" con un nombre que
codifica equipo, fecha, sede y rival (sin necesidad de tabla en Supabase):
  2026-08-30_primer-equipo_visitante_gimnastic-de-tarragona_01.jpg
`)
  process.exit(1)
}

if (!EQUIPOS.includes(equipo)) {
  console.error('El campo <equipo> debe ser "primer-equipo" o "aragon"')
  process.exit(1)
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) {
  console.error('La fecha debe tener el formato YYYY-MM-DD')
  process.exit(1)
}

if (sede !== 'local' && sede !== 'visitante') {
  console.error('El campo <sede> debe ser "local" o "visitante"')
  process.exit(1)
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function uploadMatchPhotos() {
  const files = fs.readdirSync(folder).filter(f => EXTENSIONS.has(path.extname(f).toLowerCase())).sort()

  if (files.length === 0) {
    console.log(`No se encontraron imágenes en ${folder}`)
    return
  }

  console.log(`📋 ${files.length} fotos encontradas para ${rival} (${matchDate})`)

  const rivalSlug = slugify(rival)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      const filePath = path.join(folder, file)
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(file).toLowerCase()
      const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
      const seq = String(i + 1).padStart(2, '0')
      const destName = `${matchDate}_${equipo}_${sede}_${rivalSlug}_${seq}${ext}`

      console.log(`📤 Subiendo ${file} → ${destName}...`)

      const { error: uploadError } = await supabase.storage
        .from('matchphotos')
        .upload(destName, buffer, { contentType, upsert: true })

      if (uploadError) { console.log(`❌ Error subiendo ${file}:`, uploadError.message); continue }

      console.log(`✅ ${destName}`)

    } catch (e) {
      console.log(`❌ ${file}: ${e.message}`)
    }
  }

  console.log('\n🎉 Proceso completado')
}

uploadMatchPhotos()
