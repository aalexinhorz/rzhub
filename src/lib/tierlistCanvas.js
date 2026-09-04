// Genera la imagen del Tier List dibujando a mano en un <canvas>, igual
// que lineupCanvas.js — no con html2canvas. html2canvas reimplementa su
// propio layout/texto en vez de usar el motor real del navegador, y aquí
// se veía exactamente el mismo síntoma que ya se dio en el Line-Up: el
// nombre del pie de cada card se cortaba (a veces por arriba, a veces por
// abajo) al descargar la imagen, aunque en pantalla se viera bien.
// Canvas 2D con textBaseline='middle' no tiene ese problema.

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

const CARD_W = 72
const PHOTO_H = 68
const FOOTER_H = 16
const CARD_H = PHOTO_H + FOOTER_H
const GAP = 6
const LABEL_W = 140
const ROW_PAD = 8
const ROW_MIN_H = 100
const ROW_GAP = 4
const ADD_ROW_H = 36
const POOL_PAD = 12
const POOL_SECTION_GAP = 16
const POOL_HEADER_H = 21

function loadImage(src, { crossOrigin } = {}) {
  return new Promise(resolve => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawCover(ctx, img, dx, dy, dw, dh, focusX = 0.5, focusY = 0.15) {
  if (!img) return
  const scale = Math.max(dw / img.width, dh / img.height)
  const sw = dw / scale
  const sh = dh / scale
  const sx = Math.max(0, Math.min(img.width - sw, (img.width - sw) * focusX))
  const sy = Math.max(0, Math.min(img.height - sh, (img.height - sh) * focusY))
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let lo = 0, hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const candidate = text.slice(0, mid) + '…'
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid
    else hi = mid - 1
  }
  return text.slice(0, lo) + '…'
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) current = test
    else { if (current) lines.push(current); current = word }
  }
  if (current) lines.push(current)
  return lines
}

function drawWrappedCenter(ctx, text, cx, cy, maxWidth, lineHeight) {
  const lines = wrapLines(ctx, text, maxWidth)
  let ly = cy - ((lines.length - 1) * lineHeight) / 2
  for (const line of lines) {
    ctx.fillText(line, cx, ly)
    ly += lineHeight
  }
}

function itemsPerRow(containerW) {
  return Math.max(1, Math.floor((containerW + GAP) / (CARD_W + GAP)))
}

function gridLines(count, containerW) {
  return count === 0 ? 0 : Math.ceil(count / itemsPerRow(containerW))
}

function gridHeight(count, containerW) {
  const lines = gridLines(count, containerW)
  return lines === 0 ? 0 : lines * CARD_H + (lines - 1) * GAP
}

function rowContentHeight(count, containerW) {
  if (count === 0) return ROW_MIN_H
  return Math.max(ROW_MIN_H, gridHeight(count, containerW) + ROW_PAD * 2)
}

async function drawCard(ctx, item, x, y) {
  const color = item.isZaragoza ? '#0B4390' : '#f5c400'

  ctx.save()
  roundRect(ctx, x, y, CARD_W, CARD_H, 6)
  ctx.clip()

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, CARD_W, CARD_H)

  let photo = await loadImage(item.photo || DEFAULT_PHOTO, { crossOrigin: 'anonymous' })
  if (!photo && item.photo) photo = await loadImage(DEFAULT_PHOTO, { crossOrigin: 'anonymous' })
  drawCover(ctx, photo, x, y, CARD_W, PHOTO_H, 0.5, 0.15)

  ctx.fillStyle = color
  ctx.fillRect(x, y + PHOTO_H, CARD_W, FOOTER_H)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 9px Archivo, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const label = truncate(ctx, item.shortName || item.name, CARD_W - 6)
  ctx.fillText(label, x + CARD_W / 2, y + PHOTO_H + FOOTER_H / 2 + 0.5)
  ctx.textAlign = 'left'

  ctx.restore()
  ctx.lineWidth = 2
  ctx.strokeStyle = color
  roundRect(ctx, x, y, CARD_W, CARD_H, 6)
  ctx.stroke()
}

async function drawCardGrid(ctx, items, x, y, containerW) {
  const perRow = itemsPerRow(containerW)
  for (let i = 0; i < items.length; i++) {
    const col = i % perRow
    const row = Math.floor(i / perRow)
    await drawCard(ctx, items[i], x + col * (CARD_W + GAP), y + row * (CARD_H + GAP))
  }
}

async function drawTierRow(ctx, tier, items, x, y, width, rowH) {
  ctx.fillStyle = '#060D1A'
  ctx.fillRect(x, y, width, rowH)
  ctx.strokeStyle = '#1a2436'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, rowH - 1)

  ctx.fillStyle = tier.color
  ctx.fillRect(x, y, LABEL_W, rowH)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  drawWrappedCenter(ctx, tier.label, x + LABEL_W / 2, y + rowH / 2, LABEL_W - 16, 17)
  ctx.textAlign = 'left'

  const contentW = width - LABEL_W - ROW_PAD * 2
  await drawCardGrid(ctx, items, x + LABEL_W + ROW_PAD, y + ROW_PAD, contentW)
}

async function drawPoolSection(ctx, label, items, x, y, width) {
  ctx.fillStyle = '#999999'
  ctx.font = '700 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(label, x, y + 11)
  await drawCardGrid(ctx, items, x, y + POOL_HEADER_H, width)
}

export async function drawTierlistCanvas({ tiers, tierPlayers, poolAltas, poolBajas }) {
  const scale = 2
  const PAD = 16
  const W = 1000

  await Promise.all([
    document.fonts.load('700 9px Archivo'),
    document.fonts.load('700 14px Archivo'),
  ])
  await document.fonts.ready

  const innerW = W - PAD * 2
  const rowContentW = innerW - LABEL_W - ROW_PAD * 2
  const rowHeights = tiers.map(tier => rowContentHeight((tierPlayers[tier.id] || []).length, rowContentW))

  const poolInnerW = innerW - POOL_PAD * 2
  const altasH = poolAltas.length ? POOL_HEADER_H + gridHeight(poolAltas.length, poolInnerW) : 0
  const bajasH = poolBajas.length ? POOL_HEADER_H + gridHeight(poolBajas.length, poolInnerW) : 0
  const poolH = (poolAltas.length ? POOL_PAD : 0) + altasH
    + (poolAltas.length && poolBajas.length ? POOL_SECTION_GAP : 0)
    + bajasH + (poolBajas.length ? POOL_PAD : (poolAltas.length ? POOL_PAD : 0))

  const rowsTotalH = rowHeights.reduce((acc, h) => acc + h + ROW_GAP, 0)
  const H = PAD + rowsTotalH + ADD_ROW_H + ROW_GAP + poolH + PAD

  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = '#060D1A'
  ctx.fillRect(0, 0, W, H)

  let cursorY = PAD
  for (let i = 0; i < tiers.length; i++) {
    await drawTierRow(ctx, tiers[i], tierPlayers[tiers[i].id] || [], PAD, cursorY, innerW, rowHeights[i])
    cursorY += rowHeights[i] + ROW_GAP
  }

  ctx.strokeStyle = '#cccccc'
  ctx.setLineDash([4, 4])
  ctx.strokeRect(PAD + 0.5, cursorY + 0.5, innerW - 1, ADD_ROW_H - 1)
  ctx.setLineDash([])
  ctx.fillStyle = '#999999'
  ctx.font = '400 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('+ Añadir fila', PAD + innerW / 2, cursorY + ADD_ROW_H / 2 + 0.5)
  ctx.textAlign = 'left'
  cursorY += ADD_ROW_H + ROW_GAP

  let poolY = cursorY + (poolAltas.length || poolBajas.length ? POOL_PAD : 0)
  if (poolAltas.length) {
    await drawPoolSection(ctx, 'ALTAS', poolAltas, PAD + POOL_PAD, poolY, poolInnerW)
    poolY += altasH + POOL_SECTION_GAP
  }
  if (poolBajas.length) {
    await drawPoolSection(ctx, 'BAJAS', poolBajas, PAD + POOL_PAD, poolY, poolInnerW)
  }

  return canvas
}
