import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const OUT = 'public/icons'
mkdirSync(OUT, { recursive: true })

const SS = 3 // 超采样倍数，用于抗锯齿

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const c = Buffer.alloc(4)
  c.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, c])
}

function encodePng(size, px) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0
    px.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const ACCENT = [46, 125, 107] // #2E7D6B
const WHITE = [255, 255, 255]

// 在 S*S 的画布上绘制（返回高分辨率 RGBA，供降采样）
function drawHiRes(S) {
  const px = Buffer.alloc(S * S * 4)
  const fill = (x, y, c) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return
    const i = (y * S + x) * 4
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255
  }
  // 背景（accent 全铺，maskable 友好）
  for (let i = 0; i < S * S; i++) {
    px[i * 4] = ACCENT[0]; px[i * 4 + 1] = ACCENT[1]; px[i * 4 + 2] = ACCENT[2]; px[i * 4 + 3] = 255
  }
  const cx = S / 2
  const cy = S / 2
  const R = S * 0.30 // 表盘半径

  // 白色表盘
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (Math.hypot(x - cx, y - cy) <= R) fill(x, y, WHITE)
    }
  }

  // 刻度（12 个点状刻度，3/6/9/12 更粗更长）
  for (let t = 0; t < 12; t++) {
    const a = (t * Math.PI) / 6
    const major = t % 3 === 0
    const r1 = R * (major ? 0.70 : 0.76)
    const r2 = R * 0.90
    const w = major ? S * 0.030 : S * 0.016
    const x1 = cx + Math.sin(a) * r1
    const y1 = cy - Math.cos(a) * r1
    const x2 = cx + Math.sin(a) * r2
    const y2 = cy - Math.cos(a) * r2
    line(px, fill, S, x1, y1, x2, y2, w, ACCENT)
  }

  // 时针（短粗，指向 10 点）
  const ha = -Math.PI / 3
  line(px, fill, S, cx, cy, cx + Math.sin(ha) * R * 0.45, cy - Math.cos(ha) * R * 0.45, S * 0.034, ACCENT)
  // 分针（长细，指向 2 点）
  const ma = Math.PI / 6
  line(px, fill, S, cx, cy, cx + Math.sin(ma) * R * 0.62, cy - Math.cos(ma) * R * 0.62, S * 0.020, ACCENT)

  // 中心点
  const cr = S * 0.038
  for (let y = Math.floor(cy - cr); y <= Math.ceil(cy + cr); y++) {
    for (let x = Math.floor(cx - cr); x <= Math.ceil(cx + cr); x++) {
      if (Math.hypot(x - cx, y - cy) <= cr) fill(x, y, ACCENT)
    }
  }
  return px
}

function line(px, fill, S, x1, y1, x2, y2, w, c) {
  const vx = x2 - x1
  const vy = y2 - y1
  const len = Math.hypot(vx, vy) || 1
  const minx = Math.max(0, Math.floor(Math.min(x1, x2) - w - 1))
  const maxx = Math.min(S - 1, Math.ceil(Math.max(x1, x2) + w + 1))
  const miny = Math.max(0, Math.floor(Math.min(y1, y2) - w - 1))
  const maxy = Math.min(S - 1, Math.ceil(Math.max(y1, y2) + w + 1))
  for (let y = miny; y <= maxy; y++) {
    for (let x = minx; x <= maxx; x++) {
      const t = ((x - x1) * vx + (y - y1) * vy) / (len * len)
      const tt = Math.max(0, Math.min(1, t))
      const d = Math.hypot(x - (x1 + vx * tt), y - (y1 + vy * tt))
      if (d <= w) fill(x, y, c)
    }
  }
}

// 降采样（SSxSS 块平均）
function downsample(hi, S, target) {
  const px = Buffer.alloc(target * target * 4)
  for (let y = 0; y < target; y++) {
    for (let x = 0; x < target; x++) {
      let r = 0, g = 0, b = 0
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const i = ((y * SS + dy) * S + (x * SS + dx)) * 4
          r += hi[i]; g += hi[i + 1]; b += hi[i + 2]
        }
      }
      const n = SS * SS
      const i = (y * target + x) * 4
      px[i] = Math.round(r / n); px[i + 1] = Math.round(g / n); px[i + 2] = Math.round(b / n); px[i + 3] = 255
    }
  }
  return px
}

function makeIcon(size) {
  const S = size * SS
  const hi = drawHiRes(S)
  const px = downsample(hi, S, size)
  return encodePng(size, px)
}

writeFileSync(`${OUT}/icon-192.png`, makeIcon(192))
writeFileSync(`${OUT}/icon-512.png`, makeIcon(512))
writeFileSync(`${OUT}/maskable-512.png`, makeIcon(512))
writeFileSync(`${OUT}/apple-touch-icon.png`, makeIcon(180))
console.log('icons generated ->', OUT)
