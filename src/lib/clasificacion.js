// Clasificación de Primera Federación (Grupo 2) a partir de liga_calendario.
// La usan el Simulador (con resultados inventados encima, `edits`) y la
// clasificación de la home. Desempate: puntos, diferencia de goles, goles a
// favor y nombre (aproximación: la RFEF desempata primero por el cara a cara).

export function calcularClasificacion(fixtures, edits = {}) {
  const equipos = new Map()
  function equipoDe(nombre) {
    if (!equipos.has(nombre)) equipos.set(nombre, { equipo: nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, forma: [] })
    return equipos.get(nombre)
  }
  const ordenados = [...fixtures].sort((a, b) => (a.jornada - b.jornada) || String(a.fecha).localeCompare(String(b.fecha)))
  ordenados.forEach(f => {
    equipoDe(f.equipo_local)
    equipoDe(f.equipo_visitante)
    const edit = edits[f.id] || {}
    const golesLocal = f.goles_local ?? edit.local
    const golesVisitante = f.goles_visitante ?? edit.visitante
    if (golesLocal === undefined || golesVisitante === undefined || golesLocal === null || golesVisitante === null) return
    const local = equipoDe(f.equipo_local)
    const visitante = equipoDe(f.equipo_visitante)
    local.pj++; visitante.pj++
    local.gf += golesLocal; local.gc += golesVisitante
    visitante.gf += golesVisitante; visitante.gc += golesLocal
    if (golesLocal > golesVisitante) { local.g++; visitante.p++; local.forma.push('V'); visitante.forma.push('D') }
    else if (golesLocal < golesVisitante) { visitante.g++; local.p++; local.forma.push('D'); visitante.forma.push('V') }
    else { local.e++; visitante.e++; local.forma.push('E'); visitante.forma.push('E') }
  })
  return [...equipos.values()]
    .map(t => ({ ...t, dg: t.gf - t.gc, pts: t.g * 3 + t.e, forma: t.forma.slice(-5) }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.equipo.localeCompare(b.equipo))
}

// Zonas del Grupo 2 de Primera Federación 2026/27.
export function zonaDe(posicion) {
  if (posicion === 1) return 'ascenso'
  if (posicion >= 2 && posicion <= 5) return 'playoff'
  if (posicion >= 16) return 'descenso'
  return ''
}
