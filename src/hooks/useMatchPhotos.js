import { useEffect, useState } from 'react'
import { supabase } from './useAuth'

const BUCKET = 'matchphotos'

// Toda la metadata vive en el nombre del archivo, sin tabla en Supabase:
// YYYY-MM-DD_sede_rival-en-slug_NN.ext (p.ej. 2026-08-30_visitante_gimnastic-de-tarragona_01.jpg)
function parseFileName(name) {
  const base = name.replace(/\.[^.]+$/, '')
  const segments = base.split('_')
  if (segments.length < 3) return null

  const [dateStr, sede, rivalSlug, seq] = segments
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  if (sede !== 'local' && sede !== 'visitante') return null
  if (!rivalSlug) return null

  return {
    date: dateStr,
    sede,
    rivalSlug,
    rivalDisplay: rivalSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    seq: parseInt(seq, 10) || 0,
  }
}

export default function useMatchPhotos() {
  const [state, setState] = useState({ loading: true, error: null, matches: [] })

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
          const key = `${meta.date}__${meta.rivalSlug}`

          if (!grouped.has(key)) {
            grouped.set(key, { rival: meta.rivalDisplay, matchDate: meta.date, sede: meta.sede, photos: [] })
          }
          grouped.get(key).photos.push({ id: file.name, url: publicUrl, seq: meta.seq })
        }

        const matches = Array.from(grouped.values())
          .map(m => ({ ...m, photos: m.photos.sort((a, b) => a.seq - b.seq) }))
          .sort((a, b) => (a.matchDate < b.matchDate ? 1 : -1))

        setState({ loading: false, error: null, matches })
      })

    return () => { cancelado = true }
  }, [])

  return state
}
