import { useEffect, useState } from 'react'
import { supabase } from './useAuth'

export const BUCKET = 'matchphotos'

export const EQUIPOS = {
  'primer-equipo': 'Real Zaragoza',
  'aragon': 'Deportivo Aragón',
}

// Toda la metadata vive en el nombre del archivo, sin tabla en Supabase:
// YYYY-MM-DD_equipo_sede_rival-en-slug_NN.ext
// (p.ej. 2026-08-30_primer-equipo_visitante_gimnastic-de-tarragona_01.jpg)
// Compatible con el formato antiguo sin equipo (YYYY-MM-DD_sede_rival_NN),
// que se asume del primer equipo.
function parseFileName(name) {
  const base = name.replace(/\.[^.]+$/, '')
  const segments = base.split('_')
  if (segments.length < 3) return null

  const [dateStr, ...rest] = segments
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null

  let equipo = 'primer-equipo'
  let sede, rivalSlug, seq

  if (rest[0] === 'local' || rest[0] === 'visitante') {
    [sede, rivalSlug, seq] = rest
  } else {
    [equipo, sede, rivalSlug, seq] = rest
  }

  if (!EQUIPOS[equipo]) return null
  if (sede !== 'local' && sede !== 'visitante') return null
  if (!rivalSlug) return null

  return {
    date: dateStr,
    equipo,
    sede,
    rivalSlug,
    rivalDisplay: rivalSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    seq: parseInt(seq, 10) || 0,
  }
}

export default function useMatchPhotos() {
  const [state, setState] = useState({ loading: true, error: null, matches: [] })
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let cancelado = false

    supabase.storage
      .from(BUCKET)
      .list('', { limit: 1000, sortBy: { column: 'name', order: 'desc' } })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) { setState({ loading: false, error, matches: [] }); return }

        const grouped = new Map()
        for (const file of data || []) {
          const meta = parseFileName(file.name)
          if (!meta) continue

          const { publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(file.name).data
          const key = `${meta.date}__${meta.equipo}__${meta.rivalSlug}`

          if (!grouped.has(key)) {
            grouped.set(key, {
              key,
              equipo: meta.equipo,
              rival: meta.rivalDisplay,
              rivalSlug: meta.rivalSlug,
              matchDate: meta.date,
              sede: meta.sede,
              photos: [],
            })
          }
          grouped.get(key).photos.push({ id: file.name, url: publicUrl, seq: meta.seq })
        }

        const matches = Array.from(grouped.values())
          .map(m => ({ ...m, photos: m.photos.sort((a, b) => a.seq - b.seq) }))
          .sort((a, b) => (a.matchDate < b.matchDate ? 1 : -1))

        setState({ loading: false, error: null, matches })
      })

    return () => { cancelado = true }
  }, [reloadTick])

  return { ...state, refetch: () => setReloadTick(t => t + 1) }
}

// El autor de una galería es el único dato "editorial" que no cabe en el
// nombre de archivo: vive en un JSON suelto junto a las fotos del partido
// (_meta/<key>.json), sin necesidad de tabla en Supabase.
export async function fetchMatchAuthor(matchKey) {
  if (!matchKey) return null
  const { publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(`_meta/${matchKey}.json`).data
  try {
    const r = await fetch(publicUrl)
    const data = r.ok ? await r.json() : null
    return data?.author || null
  } catch {
    return null
  }
}

export function useMatchAuthor(matchKey) {
  const [author, setAuthor] = useState(null)

  useEffect(() => {
    let cancelado = false
    fetchMatchAuthor(matchKey).then(a => { if (!cancelado) setAuthor(a) })
    return () => { cancelado = true }
  }, [matchKey])

  return author
}
