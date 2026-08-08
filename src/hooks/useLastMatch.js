import { useState, useEffect } from 'react'
import { parseICS } from '../lib/ics'

export default function useLastMatch() {
  const [lastMatch, setLastMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/calendario.ics')
      .then(r => r.text())
      .then(text => {
        const events = parseICS(text)
        const now = new Date()
        const past = events
          .filter(e => e.date <= now)
          .sort((a, b) => b.date - a.date)
        setLastMatch(past[0] || null)
      })
      .catch(e => console.error('Error cargando .ics:', e))
      .finally(() => setLoading(false))
  }, [])

  return { lastMatch, loading }
}
