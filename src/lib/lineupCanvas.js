// Genera la imagen de la alineación dibujando directamente en un
// <canvas> con la API Canvas 2D, en vez de "capturar" el DOM con
// html2canvas o dom-to-image-more. Esas librerías reimplementan (cada
// una a su manera) el layout/texto en vez de usar el motor real del
// navegador, y se comportan de forma distinta e inconsistente entre
// Chrome, Safari de escritorio y Safari de iPhone. Canvas 2D
// (drawImage/fillText/arc) sí es consistente entre navegadores, así
// que el resultado es idéntico en cualquiera de ellos.

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/default.png'

const W = 540
const H = 675
const CARD_W = 78
const CARD_H = 80
const NAME_BAR_H = 18
const SUB_ROW_H = 20
const PLUS_SIZE = 44

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

// Dibuja una imagen tipo object-fit:cover dentro de un rectángulo destino.
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

async function drawSubRow(ctx, sub, x, y, w) {
  const isZaragoza = sub.isZaragoza
  ctx.fillStyle = isZaragoza ? '#0B4390' : '#f5c400'
  ctx.fillRect(x, y, w, SUB_ROW_H)
  const photo = await loadImage(sub.photo || DEFAULT_PHOTO, { crossOrigin: 'anonymous' })
  const photoSize = 16
  const photoX = x + 3
  const photoY = y + (SUB_ROW_H - photoSize) / 2
  ctx.save()
  ctx.beginPath()
  ctx.rect(photoX, photoY, photoSize, photoSize)
  ctx.clip()
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(photoX, photoY, photoSize, photoSize)
  drawCover(ctx, photo, photoX, photoY, photoSize, photoSize, 0.5, 0.1)
  ctx.restore()

  ctx.fillStyle = isZaragoza ? '#ffffff' : '#000000'
  ctx.font = '600 7px Archivo, sans-serif'
  ctx.textBaseline = 'middle'
  const textX = photoX + photoSize + 4
  const label = truncate(ctx, sub.shortName || sub.name, x + w - textX - 3)
  ctx.fillText(label, textX, y + SUB_ROW_H / 2 + 0.5)
}

function drawSubEmpty(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.04)'
  ctx.fillRect(x, y, w, SUB_ROW_H)
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.font = '400 7px Archivo, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('+ suplente', x + 4, y + SUB_ROW_H / 2 + 0.5)
}

async function drawSlot(ctx, slot, player, sub1, sub2) {
  const cx = (W * slot.x) / 100
  const cy = (H * slot.y) / 100

  if (!player) {
    ctx.fillStyle = 'rgba(10,22,40,0.75)'
    ctx.beginPath()
    ctx.arc(cx, cy, PLUS_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = '400 20px Archivo, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('+', cx, cy + 1)

    const labelY = cy + PLUS_SIZE / 2 + 6
    ctx.font = '700 7px Archivo, sans-serif'
    const labelW = ctx.measureText(slot.label).width + 12
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    roundRect(ctx, cx - labelW / 2, labelY, labelW, 14, 3)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(slot.label, cx, labelY + 7.5)
    ctx.textAlign = 'left'
    return
  }

  const isZaragoza = player.isZaragoza
  const borderColor = isZaragoza ? '#0B4390' : '#f5c400'
  const cardH = CARD_H + NAME_BAR_H + SUB_ROW_H * 2
  const x = cx - CARD_W / 2
  const y = cy - cardH / 2

  ctx.save()
  roundRect(ctx, x, y, CARD_W, cardH, 6)
  ctx.clip()

  const gradient = ctx.createLinearGradient(0, y, 0, y + cardH)
  if (isZaragoza) {
    gradient.addColorStop(0, '#c5d8f0'); gradient.addColorStop(0.4, '#ddeaf8')
    gradient.addColorStop(0.7, '#eef4fc'); gradient.addColorStop(1, '#f5f8fd')
  } else {
    gradient.addColorStop(0, '#f5e6b0'); gradient.addColorStop(0.4, '#faf0cc')
    gradient.addColorStop(0.7, '#fdf7e8'); gradient.addColorStop(1, '#fefcf3')
  }
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, CARD_W, cardH)

  const photo = await loadImage(player.photo || DEFAULT_PHOTO, { crossOrigin: 'anonymous' })
  drawCover(ctx, photo, x, y, CARD_W, CARD_H, 0.5, 0.15)

  if (player.teamLogo) {
    const logo = await loadImage(player.teamLogo, { crossOrigin: 'anonymous' })
    if (logo) ctx.drawImage(logo, x + 3, y + 3, 14, 14)
  }

  const nameBarY = y + CARD_H
  ctx.fillStyle = isZaragoza ? '#0B4390' : '#f5c400'
  ctx.fillRect(x, nameBarY, CARD_W, NAME_BAR_H)
  ctx.fillStyle = isZaragoza ? '#ffffff' : '#000000'
  ctx.font = '700 9px Archivo, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const name = truncate(ctx, player.shortName || player.name, CARD_W - 8)
  ctx.fillText(name, x + CARD_W / 2, nameBarY + NAME_BAR_H / 2 + 0.5)
  ctx.textAlign = 'left'

  const subsY = nameBarY + NAME_BAR_H
  if (sub1) await drawSubRow(ctx, sub1, x, subsY, CARD_W)
  else drawSubEmpty(ctx, x, subsY, CARD_W)
  if (sub2) await drawSubRow(ctx, sub2, x, subsY + SUB_ROW_H, CARD_W)
  else drawSubEmpty(ctx, x, subsY + SUB_ROW_H, CARD_W)

  ctx.restore()
  ctx.lineWidth = 2
  ctx.strokeStyle = borderColor
  roundRect(ctx, x, y, CARD_W, cardH, 6)
  ctx.stroke()
}

export async function drawLineupCanvas({ slotsLayout, slots, subs, teamName, formation }) {
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  await Promise.all([
    document.fonts.load('400 16px Archivo'),
    document.fonts.load('600 16px Archivo'),
    document.fonts.load('700 16px Archivo'),
    document.fonts.load('900 16px Archivo'),
    document.fonts.load('700 40px Humane'),
  ])
  await document.fonts.ready

  // El PNG del campo es transparente fuera del rectángulo de juego (para
  // que en pantalla se vea el fondo panorámico de la página). En la
  // imagen exportada no hay esa página detrás, así que rellenamos antes
  // con el mismo color de fondo oscuro de la web para que no quede
  // transparente/a cuadros.
  ctx.fillStyle = '#060D1A'
  ctx.fillRect(0, 0, W, H)
  const bg = await loadImage('/CAMPO_PARA_WEB.png')
  if (bg) ctx.drawImage(bg, 0, 0, W, H)

  // Nombre y formación van en la misma fila si caben; si el nombre del
  // equipo no deja hueco, la formación baja a una segunda línea (mismo
  // comportamiento que el flex-wrap del overlay en pantalla).
  const nameText = (teamName || '').toUpperCase()
  ctx.font = '700 40px Humane, sans-serif'
  const nameW = ctx.measureText(nameText).width

  ctx.font = '800 10px Archivo, sans-serif'
  const badgeW = ctx.measureText(formation).width + 16
  const badgeH = 18
  const gap = 12
  const margin = 16
  const sameLine = margin + nameW + gap + badgeW <= W - margin

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 40px Humane, sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText(nameText, margin, 8)

  const badgeX = sameLine ? margin + nameW + gap : margin
  const badgeY = sameLine ? 15 : 52

  ctx.font = '800 10px Archivo, sans-serif'
  ctx.fillStyle = '#FFC800'
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4)
  ctx.fill()
  ctx.fillStyle = '#060D1A'
  ctx.textBaseline = 'middle'
  ctx.fillText(formation, badgeX + 8, badgeY + badgeH / 2 + 0.5)

  for (const slot of slotsLayout) {
    await drawSlot(ctx, slot, slots[slot.id] || null, subs[slot.id]?.[0] || null, subs[slot.id]?.[1] || null)
  }

  return canvas
}