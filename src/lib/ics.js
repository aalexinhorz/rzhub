export function parseICSDate(str) {
  if (!str) return null

  // Fecha sin hora confirmada (DTSTART;VALUE=DATE:20260830): solo YYYYMMDD, sin "T"
  if (!str.includes('T')) {
    const y = str.slice(0, 4)
    const mo = str.slice(4, 6)
    const d = str.slice(6, 8)
    return new Date(`${y}-${mo}-${d}T00:00:00Z`)
  }

  // Formato con Z (UTC): 20260801T183000Z
  if (str.endsWith('Z')) {
    const clean = str.replace('Z', '')
    const y = clean.slice(0, 4)
    const mo = clean.slice(4, 6)
    const d = clean.slice(6, 8)
    const h = clean.slice(9, 11)
    const mi = clean.slice(11, 13)
    const s = clean.slice(13, 15) || '00'
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`)
  }

  // Formato con TZID (Europe/Madrid): 20260801T183000
  // Lo tratamos como hora local española (UTC+2 en verano, UTC+1 en invierno)
  const y = str.slice(0, 4)
  const mo = str.slice(4, 6)
  const d = str.slice(6, 8)
  const h = str.slice(9, 11)
  const mi = str.slice(11, 13)
  const s = str.slice(13, 15) || '00'

  // Los partidos son de agosto en adelante → verano español = UTC+2
  const month = parseInt(mo, 10)
  const offset = (month >= 4 && month <= 10) ? '+02:00' : '+01:00'
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`)
}

export function parseICS(text) {
  const events = []
  const blocks = text.split('BEGIN:VEVENT')
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]

    const summaryMatch = block.match(/SUMMARY:([^\r\n]+)/)
    const summary = summaryMatch ? summaryMatch[1].trim() : null

    // DTSTART puede venir con TZID o sin
    const dtstartMatch = block.match(/DTSTART(?:[^:]*):([^\r\n]+)/)
    const dtstart = dtstartMatch ? dtstartMatch[1].trim() : null

    if (dtstart && summary) {
      const date = parseICSDate(dtstart)
      if (date && !isNaN(date)) {
        events.push({ date, summary })
      }
    }
  }
  return events
}

// "Real Zaragoza vs Utebo (Amistoso)" → "Utebo"
export function extractRival(summary) {
  return summary
    .replace(/Real Zaragoza\s*[-vs]+\s*/i, '')
    .replace(/\s*[-vs]+\s*Real Zaragoza/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
}

export function isFriendly(summary) {
  return /\(amistoso\)/i.test(summary)
}

export function isAway(summary) {
  return !/^real zaragoza/i.test(summary.trim())
}