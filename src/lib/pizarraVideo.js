// Grava la reproducción de las instantáneas como vídeo (.webm) usando
// MediaRecorder sobre un <canvas> propio — nada de html2canvas ni de
// capturar la pantalla: se dibuja fotograma a fotograma con la misma
// interpolación que ya usa la reproducción en pantalla
// (src/lib/pizarraInterpolacion.js), reutilizando los helpers de
// dibujo de pizarraCanvas.js. A diferencia de esa exportación a PNG
// (que crea un canvas nuevo y carga cada imagen una vez), aquí las
// imágenes se precargan UNA sola vez al principio y se reutilizan en
// cada fotograma — cargarlas de nuevo en cada tick de la animación
// sería demasiado lento para ir a 30fps.

import { DEFAULT_PHOTO, W, H, CARD_W, CARD_H, NAME_BAR_H, loadImage, roundRect, drawCover, truncate } from './pizarraCanvas'
import { DURACION_TRANSICION_MS, interpolarInstantaneas } from './pizarraInterpolacion'

const ESCALA = 2

function dibujarFichaSync(ctx, ficha, imagenes) {
  const cx = (W * ficha.x) / 100
  const cy = (H * ficha.y) / 100
  const x = cx - CARD_W / 2
  const y = cy - (CARD_H + NAME_BAR_H) / 2
  const borderColor = ficha.isZaragoza ? '#0B4390' : '#f5c400'
  const opacity = ficha.opacity ?? 1

  ctx.save()
  ctx.globalAlpha = opacity
  roundRect(ctx, x, y, CARD_W, CARD_H + NAME_BAR_H, 6)
  ctx.clip()

  const photo = imagenes.get(ficha.foto || DEFAULT_PHOTO) || imagenes.get(DEFAULT_PHOTO)
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

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.lineWidth = 2
  ctx.strokeStyle = borderColor
  roundRect(ctx, x, y, CARD_W, CARD_H + NAME_BAR_H, 6)
  ctx.stroke()
  ctx.restore()
}

function dibujarBalonSync(ctx, balon, imagenes) {
  const cx = (W * balon.x) / 100
  const cy = (H * balon.y) / 100
  const size = 20
  const img = imagenes.get('/balon.webp')
  if (!img) return
  ctx.save()
  ctx.globalAlpha = balon.opacity ?? 1
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 5
  ctx.shadowOffsetY = 2
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
  ctx.restore()
}

function dibujarFrameSync(ctx, fichas, balon, imagenes) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#060D1A'
  ctx.fillRect(0, 0, W, H)
  const bg = imagenes.get('/CAMPO_PARA_WEB.png')
  if (bg) ctx.drawImage(bg, 0, 0, W, H)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 11px Archivo, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  const pitchTopY = H * (179 / 1350)
  const pitchRightX = W * (997.409 / 1080)
  ctx.fillText('rzhub.es', pitchRightX, pitchTopY - 8)
  ctx.textAlign = 'left'

  for (const ficha of fichas) dibujarFichaSync(ctx, ficha, imagenes)
  if (balon) dibujarBalonSync(ctx, balon, imagenes)
}

async function precargarImagenes(instantaneas) {
  const urlsFotos = new Set([DEFAULT_PHOTO])
  instantaneas.forEach(inst => inst.fichas.forEach(f => urlsFotos.add(f.foto || DEFAULT_PHOTO)))

  const mapa = new Map()
  await Promise.all([
    loadImage('/CAMPO_PARA_WEB.png').then(img => mapa.set('/CAMPO_PARA_WEB.png', img)),
    loadImage('/balon.webp').then(img => mapa.set('/balon.webp', img)),
    ...[...urlsFotos].map(url => loadImage(url, { crossOrigin: 'anonymous' }).then(img => mapa.set(url, img))),
  ])
  return mapa
}

function esperar(ms) { return new Promise(r => setTimeout(r, ms)) }

function animarTransicion(ctx, desde, hasta, imagenes, duracionMs) {
  return new Promise(resolve => {
    let inicio = null
    function tick(ts) {
      if (inicio === null) inicio = ts
      const t = Math.min(1, (ts - inicio) / duracionMs)
      const frame = interpolarInstantaneas(desde, hasta, t)
      dibujarFrameSync(ctx, frame.fichas, frame.balon, imagenes)
      if (t >= 1) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

const MIME_CANDIDATOS = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

function elegirMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  return MIME_CANDIDATOS.find(m => MediaRecorder.isTypeSupported(m)) || null
}

export function soportaGrabacionVideo() {
  return typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
}

export async function grabarVideoPizarra(instantaneas, { fps = 30, pausaInicialMs = 500, pausaFinalMs = 500 } = {}) {
  if (instantaneas.length < 2) throw new Error('Hacen falta al menos 2 instantáneas para grabar un vídeo')
  if (!soportaGrabacionVideo()) throw new Error('Este navegador no permite grabar vídeo desde el lienzo')

  const canvas = document.createElement('canvas')
  canvas.width = W * ESCALA
  canvas.height = H * ESCALA
  const ctx = canvas.getContext('2d')
  ctx.scale(ESCALA, ESCALA)

  await Promise.all([document.fonts.load('700 16px Archivo')])
  await document.fonts.ready
  const imagenes = await precargarImagenes(instantaneas)

  dibujarFrameSync(ctx, instantaneas[0].fichas, instantaneas[0].balon, imagenes)

  const mimeType = elegirMimeType()
  const stream = canvas.captureStream(fps)
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 3_500_000 } : undefined)
  const chunks = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
  const detenido = new Promise(resolve => { recorder.onstop = resolve })

  recorder.start()
  await esperar(pausaInicialMs)

  for (let i = 0; i < instantaneas.length - 1; i++) {
    await animarTransicion(ctx, instantaneas[i], instantaneas[i + 1], imagenes, DURACION_TRANSICION_MS)
  }

  await esperar(pausaFinalMs)
  recorder.stop()
  await detenido

  return new Blob(chunks, { type: recorder.mimeType || 'video/webm' })
}

export async function descargarVideoPizarra(instantaneas) {
  const blob = await grabarVideoPizarra(instantaneas)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = 'pizarra-real-zaragoza.webm'
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
