// Retoque de la foto subida en /redaccion-graficos, con los ajustes básicos
// de Camera Raw / Lightroom: luz (exposición, contraste, iluminaciones,
// sombras, blancos, negros), presencia (textura, claridad, intensidad,
// saturación) y color (temperatura, tinte). No es una copia exacta de Adobe:
// son curvas parecidas, calculadas píxel a píxel en un canvas.
//
// Devuelve un <canvas> con naturalWidth/naturalHeight/complete puestos a mano
// para que las plantillas lo traten igual que la <img> original (encajeEn,
// hayImagen y drawImage solo miran eso).

export const AJUSTES_RETOQUE = [
  {
    grupo: 'Luz',
    ajustes: [
      { clave: 'exposicion', nombre: 'Exposición', min: -3, max: 3, paso: 0.05 },
      { clave: 'contraste', nombre: 'Contraste' },
      { clave: 'iluminaciones', nombre: 'Iluminaciones' },
      { clave: 'sombras', nombre: 'Sombras' },
      { clave: 'blancos', nombre: 'Blancos' },
      { clave: 'negros', nombre: 'Negros' },
    ],
  },
  {
    grupo: 'Presencia',
    ajustes: [
      { clave: 'textura', nombre: 'Textura' },
      { clave: 'claridad', nombre: 'Claridad' },
      { clave: 'intensidad', nombre: 'Intensidad' },
      { clave: 'saturacion', nombre: 'Saturación' },
    ],
  },
  {
    grupo: 'Color',
    ajustes: [
      { clave: 'temperatura', nombre: 'Temperatura' },
      { clave: 'tinte', nombre: 'Tinte' },
    ],
  },
]

export const RETOQUE_NEUTRO = Object.fromEntries(AJUSTES_RETOQUE.flatMap(g => g.ajustes.map(a => [a.clave, 0])))

export const esNeutro = r => !r || Object.keys(RETOQUE_NEUTRO).every(k => !r[k])

// --- Cachés por foto (la base reescalada y los desenfoques) ---------------

const caches = new WeakMap()
function cacheDe(img) {
  let c = caches.get(img)
  if (!c) { c = new Map(); caches.set(img, c) }
  return c
}

function lienzo(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function pixeles(c) {
  return c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data
}

function base(img, w, h) {
  const cache = cacheDe(img)
  const clave = `base ${w}x${h}`
  if (!cache.has(clave)) {
    const c = lienzo(w, h)
    const g = c.getContext('2d', { willReadFrequently: true })
    g.imageSmoothingQuality = 'high'
    g.drawImage(img, 0, 0, w, h)
    cache.set(clave, pixeles(c))
  }
  return cache.get(clave)
}

// Desenfoque barato: se reduce la foto a mitades hasta ~1 píxel por radio y
// se vuelve a ampliar (suavizado bilineal + blur del navegador si lo hay).
function desenfoque(img, w, h, radio) {
  const cache = cacheDe(img)
  const clave = `blur ${w}x${h} ${Math.round(radio * 10)}`
  if (!cache.has(clave)) {
    const tw = Math.max(1, Math.round(w / radio))
    const th = Math.max(1, Math.round(h / radio))
    let src = img
    let sw = img.naturalWidth
    let sh = img.naturalHeight
    while (sw / 2 > tw && sh / 2 > th) {
      const c = lienzo(Math.round(sw / 2), Math.round(sh / 2))
      const g = c.getContext('2d')
      g.imageSmoothingQuality = 'high'
      g.drawImage(src, 0, 0, c.width, c.height)
      src = c; sw = c.width; sh = c.height
    }
    const peq = lienzo(tw, th)
    const gp = peq.getContext('2d')
    gp.imageSmoothingQuality = 'high'
    gp.drawImage(src, 0, 0, tw, th)
    const out = lienzo(w, h)
    const g = out.getContext('2d', { willReadFrequently: true })
    g.imageSmoothingQuality = 'high'
    // En los bordes el blur del navegador mezcla con transparente, pero
    // getImageData devuelve el color sin premultiplicar: sale bien.
    if ('filter' in g) g.filter = `blur(${Math.max(1, radio / 2)}px)`
    g.drawImage(peq, 0, 0, w, h)
    cache.set(clave, pixeles(out))
  }
  return cache.get(clave)
}

// --- Curvas -----------------------------------------------------------------

const aLineal = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const aSrgb = v => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)

// Curva tonal (0..1 → 0..1), igual para los tres canales. Todas las piezas
// son monótonas con los valores extremos (-100/+100).
function curva(x, r) {
  const c = (r.contraste / 100) * 0.5
  if (c) x -= c * Math.sin(2 * Math.PI * x) / (2 * Math.PI)
  const t = Math.min(1, Math.max(0, x))
  // Más fuerza hacia donde la curva no puede dar la vuelta (subir sombras,
  // bajar iluminaciones), menos hacia el otro lado.
  const sh = r.sombras / 100
  const hi = r.iluminaciones / 100
  x += sh * (sh > 0 ? 1.6 : 0.9) * t * (1 - t) ** 2
  x += hi * (hi < 0 ? 1.6 : 0.9) * t * t * (1 - t)
  x += (r.blancos / 100) * 0.25 * t ** 3
  x += (r.negros / 100) * 0.2 * (1 - t) ** 3
  return x
}

function luts(r) {
  // Balance de blancos en lineal, normalizado para no cambiar el brillo.
  const temp = r.temperatura / 100
  const tinte = r.tinte / 100
  let gr = (1 + 0.2 * temp) * (1 + 0.06 * tinte)
  let gg = 1 - 0.12 * tinte
  let gb = (1 - 0.2 * temp) * (1 + 0.06 * tinte)
  const y = 0.2126 * gr + 0.7152 * gg + 0.0722 * gb
  gr /= y; gg /= y; gb /= y
  const exp = 2 ** r.exposicion
  const hacer = gan => {
    const l = new Uint8ClampedArray(256)
    for (let i = 0; i < 256; i++) l[i] = Math.round(curva(aSrgb(aLineal(i / 255) * gan * exp), r) * 255)
    return l
  }
  return [hacer(gr), hacer(gg), hacer(gb)]
}

/** Foto retocada a `maxLado` píxeles de lado mayor como mucho. */
export function retocar(img, r, maxLado) {
  const W = img.naturalWidth
  const H = img.naturalHeight
  const s = Math.min(1, maxLado / Math.max(W, H))
  const w = Math.max(1, Math.round(W * s))
  const h = Math.max(1, Math.round(H * s))
  const lado = Math.max(w, h)
  const d = new Uint8ClampedArray(base(img, w, h))
  const tex = r.textura ? desenfoque(img, w, h, Math.max(1.5, lado * 0.0025)) : null
  const cla = r.claridad ? desenfoque(img, w, h, lado * 0.025) : null
  const aT = (r.textura / 100) * 1.2
  const aC = (r.claridad / 100) * 0.9
  const [lr, lg, lb] = luts(r)
  const sat = r.saturacion / 100
  const vib = r.intensidad / 100
  const color = sat || vib

  for (let i = 0; i < d.length; i += 4) {
    let R = d[i]
    let G = d[i + 1]
    let B = d[i + 2]
    if (tex || cla) {
      let dR = 0, dG = 0, dB = 0
      if (tex) {
        dR += aT * (R - tex[i]); dG += aT * (G - tex[i + 1]); dB += aT * (B - tex[i + 2])
      }
      if (cla) {
        // La claridad actúa sobre todo en los medios tonos.
        const L = (0.299 * R + 0.587 * G + 0.114 * B) / 255
        const k = aC * (1 - (2 * L - 1) ** 2)
        dR += k * (R - cla[i]); dG += k * (G - cla[i + 1]); dB += k * (B - cla[i + 2])
      }
      R += dR; G += dG; B += dB
      R = R < 0 ? 0 : R > 255 ? 255 : R | 0
      G = G < 0 ? 0 : G > 255 ? 255 : G | 0
      B = B < 0 ? 0 : B > 255 ? 255 : B | 0
    }
    R = lr[R]; G = lg[G]; B = lb[B]
    if (color) {
      const mx = R > G ? (R > B ? R : B) : (G > B ? G : B)
      const mn = R < G ? (R < B ? R : B) : (G < B ? G : B)
      // La intensidad sube más los colores apagados que los ya saturados.
      let k = 1 + sat + vib * (1 - (mx - mn) / 255)
      if (k < 0) k = 0
      const y = 0.299 * R + 0.587 * G + 0.114 * B
      R = y + (R - y) * k; G = y + (G - y) * k; B = y + (B - y) * k
    }
    d[i] = R; d[i + 1] = G; d[i + 2] = B
  }

  const c = lienzo(w, h)
  c.getContext('2d').putImageData(new ImageData(d, w, h), 0, 0)
  c.naturalWidth = w
  c.naturalHeight = h
  c.complete = true
  return c
}
