import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  let crc = 0xFFFFFFFF
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length)
  const body = Buffer.concat([typeBytes, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(body))
  return Buffer.concat([lenBuf, body, crcBuf])
}

const SIZE = 512

// Colors
const BG   = [111, 76, 179]   // #6f4cb3 — purple
const MID  = [89, 55, 153]    // slightly darker for depth
const FG   = [255, 255, 255]  // white bars
const EDGE = [147, 112, 210]  // lighter purple for rounded feel

function lerp(a, b, t) { return Math.round(a + (b - a) * t) }
function lerpColor(c1, c2, t) { return c1.map((v, i) => lerp(v, c2[i], t)) }

// Build pixel grid
const pixels = []
for (let y = 0; y < SIZE; y++) {
  const row = []
  for (let x = 0; x < SIZE; x++) {
    // Rounded rectangle mask (corner radius 88px)
    const R = 88
    const dx = Math.max(0, Math.max(R - x, x - (SIZE - 1 - R)))
    const dy = Math.max(0, Math.max(R - y, y - (SIZE - 1 - R)))
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > R + 1) {
      row.push([0, 0, 0, 0]) // transparent outside rounded corners
      continue
    }

    // Background gradient (top lighter, bottom darker)
    const grad = y / SIZE
    const bg = lerpColor(BG, MID, grad * 0.5)

    // Three cascade column bars
    // Bar layout: left pad 112, bar width 72, gap 28
    const barH = 260
    const barY = (SIZE - barH) / 2
    const bar1x = 112, bar2x = 212, bar3x = 312
    const bw = 72

    // Each bar is slightly taller (staggered effect)
    const b1h = barH, b2h = barH - 36, b3h = barH - 72
    const b1y = barY, b2y = barY + 18, b3y = barY + 36

    const inBar1 = x >= bar1x && x < bar1x + bw && y >= b1y && y < b1y + b1h
    const inBar2 = x >= bar2x && x < bar2x + bw && y >= b2y && y < b2y + b2h
    const inBar3 = x >= bar3x && x < bar3x + bw && y >= b3y && y < b3y + b3h

    // Rounded bar corners (4px radius)
    function inRoundedBar(bx, by, bw, bh, r = 8) {
      if (x < bx || x >= bx + bw || y < by || y >= by + bh) return false
      const lx = Math.max(0, Math.max(r - (x - bx), (x - bx) - (bw - 1 - r)))
      const ly = Math.max(0, Math.max(r - (y - by), (y - by) - (bh - 1 - r)))
      return Math.sqrt(lx * lx + ly * ly) <= r + 0.5
    }

    const inAnyBar = inRoundedBar(bar1x, b1y, bw, b1h) ||
                     inRoundedBar(bar2x, b2y, bw, b2h) ||
                     inRoundedBar(bar3x, b3y, bw, b3h)

    // Anti-aliased edge for rounded corners of canvas
    let alpha = 255
    if (dist > R - 1) alpha = Math.round(255 * (1 - (dist - (R - 1))))

    const color = inAnyBar
      ? FG.map(c => Math.round(c * 0.95 + bg[c] * 0.05)).map((c, i) => Math.round(FG[i] * 0.97 + bg[i] * 0.03))
      : bg

    row.push([...color, alpha])
  }
  pixels.push(row)
}

// Build RGBA scanlines (each row: filter byte 0 + RGBA pixels)
const scanlines = []
for (const row of pixels) {
  const line = [0x00]
  for (const [r, g, b, a] of row) {
    line.push(r, g, b, a)
  }
  scanlines.push(Buffer.from(line))
}
const rawData = Buffer.concat(scanlines)
const compressed = deflateSync(rawData, { level: 6 })

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)   // width
ihdr.writeUInt32BE(SIZE, 4)   // height
ihdr[8] = 8                   // bit depth
ihdr[9] = 6                   // color type: RGBA
ihdr[10] = 0                  // compression
ihdr[11] = 0                  // filter
ihdr[12] = 0                  // interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', compressed),
  pngChunk('IEND', Buffer.alloc(0)),
])

mkdirSync('resources', { recursive: true })
writeFileSync('resources/icon.png', png)
console.log(`Generated resources/icon.png (${SIZE}x${SIZE}, ${png.length} bytes)`)
