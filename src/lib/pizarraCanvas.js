// Exporta la Pizarra a PNG dibujando a mano en Canvas 2D — mismo
// motivo que src/lib/lineupCanvas.js: html2canvas/dom-to-image-more
// reimplementan el layout y no coinciden entre navegadores; Canvas 2D
// (drawImage/fillText/roundRect) sí es consistente. A diferencia de
// lineupCanvas.js, aquí las fichas están en posiciones libres (x/y %),
// no en casillas fijas de una formación.

export const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

export const W = 540
export const H = 675
export const CARD_W = 60
export const CARD_H = 62
export const NAME_BAR_H = 15

export function loadImage(src, { crossOrigin } = {}) {
  return new Promise(resolve => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function drawCover(ctx, img, dx, dy, dw, dh, focusX = 0.5, focusY = 0.15) {
  if (!img) return
  const scale = Math.max(dw / img.width, dh / img.height)
  const sw = dw / scale
  const sh = dh / scale
  const sx = Math.max(0, Math.min(img.width - sw, (img.width - sw) * focusX))
  const sy = Math.max(0, Math.min(img.height - sh, (img.height - sh) * focusY))
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

export function truncate(ctx, text, maxWidth) {
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

async function drawFicha(ctx, ficha) {
  const cx = (W * ficha.x) / 100
  const cy = (H * ficha.y) / 100
  const x = cx - CARD_W / 2
  const y = cy - (CARD_H + NAME_BAR_H) / 2
  const borderColor = ficha.isZaragoza ? '#0B4390' : '#f5c400'

  ctx.save()
  roundRect(ctx, x, y, CARD_W, CARD_H + NAME_BAR_H, 6)
  ctx.clip()

  let photo = await loadImage(ficha.foto || DEFAULT_PHOTO, { crossOrigin: 'anonymous' })
  if (!photo && ficha.foto) photo = await loadImage(DEFAULT_PHOTO, { crossOrigin: 'anonymous' })
  ctx.fillStyle = '#152445'
  ctx.fillRect(x, y, CARD_W, CARD_H)
  drawCover(ctx, photo, x, y, CARD_W, CARD_H, 0.5, 0.15)

  ctx.fillStyle = borderColor
  ctx.fillRect(x, y + CARD_H, CARD_W, NAME_BAR_H)
  ctx.fillStyle = ficha.isZaragoza ? '#ffffff' : '#000000'
  ctx.font = '700 8px Archivo, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const label = truncate(ctx, ficha.nombreCorto || ficha.nombre, CARD_W - 6)
  ctx.fillText(label, x + CARD_W / 2, y + CARD_H + NAME_BAR_H / 2 + 0.5)
  ctx.textAlign = 'left'

  ctx.restore()
  ctx.lineWidth = 2
  ctx.strokeStyle = borderColor
  roundRect(ctx, x, y, CARD_W, CARD_H + NAME_BAR_H, 6)
  ctx.stroke()
}

async function drawBalon(ctx, balon) {
  const cx = (W * balon.x) / 100
  const cy = (H * balon.y) / 100
  const size = 20

  const img = await loadImage('/balon.webp', { crossOrigin: 'anonymous' })
  if (!img) return

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 5
  ctx.shadowOffsetY = 2
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
  ctx.restore()
}

export async function drawPizarraCanvas(fichas, balon) {
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  await Promise.all([
    document.fonts.load('700 16px Archivo'),
  ])
  await document.fonts.ready

  ctx.fillStyle = '#060D1A'
  ctx.fillRect(0, 0, W, H)
  const bg = await loadImage('/CAMPO_PARA_WEB.png')
  if (bg) ctx.drawImage(bg, 0, 0, W, H)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 20px Archivo, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const pitchTopY = H * (179 / 1350)
  ctx.fillText('rzhub.es', W / 2, pitchTopY / 2)
  ctx.textAlign = 'left'

  for (const ficha of fichas) {
    await drawFicha(ctx, ficha)
  }
  if (balon) await drawBalon(ctx, balon)

  return canvas
}

export async function descargarPizarra(fichas, balon) {
  const canvas = await drawPizarraCanvas(fichas, balon)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = 'pizarra-real-zaragoza.png'
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
