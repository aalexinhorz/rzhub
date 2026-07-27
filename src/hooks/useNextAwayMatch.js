import { useState, useEffect } from 'react'
import { parseICS, extractRival, isFriendly, isAway } from '../lib/ics'

export default function useNextAwayMatch() {
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/calendario.ics')
      .then(r => r.text())
      .then(text => {
        const events = parseICS(text)
        const now = new Date()
        const proximos = events
          .filter(e => e.date > now)
          .filter(e => !isFriendly(e.summary))
          .filter(e => isAway(e.summary))
          .sort((a, b) => a.date - b.date)
        const next = proximos[0]
        setMatch(next ? { date: next.date, rival: extractRival(next.summary) } : null)
      })
      .catch(e => console.error('Error cargando .ics:', e))
      .finally(() => setLoading(false))
  }, [])

  return { match, loading }
}