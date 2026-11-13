import { T, ROOFS, ROOF_PART, rnd, DOWN, UP, RIGHT } from './sprites'
import type { Dir } from './sprites'
import type { MapDef, Warp } from './types'

export const ANCH: Record<string, Record<string, [number, number]>> = {}

export class MB {
  id: string
  name: string
  area: string
  w: number
  h: number
  g: number[]
  o: number[]
  road: boolean[]
  warps: Warp[] = []
  weather?: MapDef['weather']
  tint?: string
  dark?: number
  enc?: MapDef['enc']
  constructor(id: string, name: string, area: string, w: number, h: number, base: number) {
    this.id = id
    this.name = name
    this.area = area
    this.w = w
    this.h = h
    this.g = new Array(w * h).fill(base)
    this.o = new Array(w * h).fill(-1)
    this.road = new Array(w * h).fill(false)
    ANCH[id] = {}
  }
  in(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h
  }
  gr(x: number, y: number, t: number) {
    if (this.in(x, y)) this.g[y * this.w + x] = t
  }
  ob(x: number, y: number, t: number) {
    if (this.in(x, y)) this.o[y * this.w + x] = t
  }
  getG(x: number, y: number) {
    return this.in(x, y) ? this.g[y * this.w + x] : -1
  }
  getO(x: number, y: number) {
    return this.in(x, y) ? this.o[y * this.w + x] : -1
  }
  rect(x: number, y: number, w: number, h: number, t: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.gr(x + i, y + j, t)
  }
  orect(x: number, y: number, w: number, h: number, t: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.ob(x + i, y + j, t)
  }
  ell(cx: number, cy: number, rx: number, ry: number, t: number, layer: 'g' | 'o' = 'g') {
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry
        if (dx * dx + dy * dy <= 1) {
          if (layer === 'g') {
            this.gr(x, y, t)
            this.ob(x, y, -1)
          } else this.ob(x, y, t)
        }
      }
    }
  }
  path(pts: [number, number][], t: number, r = 1, bridge = false) {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x1, y1] = pts[k], [x2, y2] = pts[k + 1]
      const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1)
      for (let s = 0; s <= n; s++) {
        const cx = Math.round(x1 + ((x2 - x1) * s) / n)
        const cy = Math.round(y1 + ((y2 - y1) * s) / n)
        for (let j = -r; j <= r; j++) {
          for (let i = -r; i <= r; i++) {
            const x = cx + i, y = cy + j
            if (!this.in(x, y)) continue
            const wasWater = this.getG(x, y) === T.WATER
            this.gr(x, y, bridge && wasWater ? T.BRIDGE : t)
            this.ob(x, y, -1)
            this.road[y * this.w + x] = true
          }
        }
      }
    }
  }
  nearRoad(x: number, y: number, r: number) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (this.in(x + i, y + j) && this.road[(y + j) * this.w + x + i]) return true
    return false
  }
  forest(box: [number, number, number, number], density: number, seed: number, tiles: number[], clear = 2) {
    const [bx, by, bw, bh] = box
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + bw; x++) {
        if (!this.in(x, y) || this.getO(x, y) !== -1) continue
        const gg = this.getG(x, y)
        if (gg === T.WATER || gg === T.BRIDGE || gg === T.LAVA) continue
        if (this.nearRoad(x, y, clear)) continue
        if (rnd(x, y, seed) > 1 - density) this.ob(x, y, tiles[Math.floor(rnd(y, x, seed + 1) * tiles.length)])
      }
    }
  }
  border(t: number, th: number, gap?: [number, number, number, number]) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (x < th || y < th || x >= this.w - th || y >= this.h - th) {
          if (gap && x >= gap[0] && x <= gap[1] && y >= gap[2] && y <= gap[3]) continue
          this.ob(x, y, t)
        }
      }
    }
  }
  house(x: number, y: number, w: number, color: number, doorRel: number) {
    const R = ROOFS[color]
    for (let i = 0; i < w; i++) {
      const p = i === 0 ? 0 : i === w - 1 ? 2 : 1
      this.ob(x + i, y, R[ROOF_PART.TL + p])
      this.ob(x + i, y + 1, R[ROOF_PART.BL + p])
      if (i === doorRel) {
        this.gr(x + i, y + 2, T.DOOR)
        this.ob(x + i, y + 2, -1)
      } else this.ob(x + i, y + 2, i % 2 === 1 ? T.WINDOW : T.WALL)
    }
    return [x + doorRel, y + 2] as [number, number]
  }
  warp(x: number, y: number, to: string, tx: number, ty: number, dir?: Dir, extra?: Partial<Warp>) {
    this.warps.push({ x, y, to, tx, ty, dir, ...extra })
  }
  anchor(name: string, x: number, y: number) {
    ANCH[this.id][name] = [x, y]
  }
  clearAnchors(r = 1) {
    for (const [x, y] of Object.values(ANCH[this.id])) {
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (this.getG(x + i, y + j) !== T.WATER) this.ob(x + i, y + j, -1)
    }
  }
  build(): MapDef {
    return {
      id: this.id, name: this.name, area: this.area, w: this.w, h: this.h, g: this.g, o: this.o, warps: this.warps,
      weather: this.weather, tint: this.tint, dark: this.dark, enc: this.enc,
    }
  }
}

const MAPS: Record<string, MapDef> = {}
const CLEAR_IDS = ['dragonmt', 'hake', 'harbor', 'island', 'elfwood', 'goldtree', 'desert', 'lanisle', 'sealplat', 'xilin', 'lioncity', 'hamburg', 'redcity', 'capital']
const reg = (m: MB) => {
  if (CLEAR_IDS.includes(m.id)) m.clearAnchors(1)
  MAPS[m.id] = m.build()
}

// 通用室内：四周墙壁，floor 为地面
function room(id: string, name: string, area: string, w: number, h: number, floor: number, exit: [number, number, string, number, number, Dir?]) {
  const m = new MB(id, name, area, w, h, floor)
  for (let x = 0; x < w; x++) {
    m.ob(x, 0, T.INWALL)
    m.ob(x, h - 1, T.INWALL)
  }
  for (let y = 0; y < h; y++) {
    m.ob(0, y, T.INWALL)
    m.ob(w - 1, y, T.INWALL)
  }
  const [ex, ey, to, tx, ty, d] = exit
  m.ob(ex, ey, -1)
  m.gr(ex, ey, T.CARPET)
  m.warp(ex, ey, to, tx, ty, d)
  return m
}

// ───── 地牢生成：保证连通 ─────
function dungeon(id: string, name: string, w: number, h: number, floor: number, wall: number, seed: number, o: {
  tint?: string; dark?: number; weather?: MapDef['weather']; deco?: number[]; dens?: number; enc?: MapDef['enc']
}) {
  const m = new MB(id, name, '地下城', w, h, floor)
  m.orect(0, 0, w, h, wall)
  const carve = (x: number, y: number, rw: number, rh: number) => {
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
      m.ob(x + i, y + j, -1)
      m.gr(x + i, y + j, floor)
    }
  }
  const S: [number, number] = [4, h - 4]
  const E: [number, number] = [w - 5, 3]
  const wps: [number, number][] = [S]
  const n = 3
  for (let i = 1; i <= n; i++) {
    wps.push([
      Math.round(4 + ((w - 9) * i) / (n + 1) + (rnd(i, seed, 1) - 0.5) * 6),
      Math.round(h - 4 - ((h - 7) * i) / (n + 1) + (rnd(seed, i, 2) - 0.5) * 6),
    ])
  }
  wps.push(E)
  const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
  const pts = wps.map(([x, y]) => [cl(x, 3, w - 4), cl(y, 3, h - 4)] as [number, number])
  for (const [x, y] of pts) carve(x - 2, y - 2, 5, 5)
  for (let k = 0; k < pts.length - 1; k++) {
    const [x1, y1] = pts[k], [x2, y2] = pts[k + 1]
    const sx = Math.sign(x2 - x1) || 1, sy = Math.sign(y2 - y1) || 1
    for (let x = x1; x !== x2 + sx; x += sx) carve(x - 1, y1 - 1, 3, 3)
    for (let y = y1; y !== y2 + sy; y += sy) carve(x2 - 1, y - 1, 3, 3)
  }
  // 额外岔路房间
  for (let i = 0; i < 3; i++) {
    const rx = 4 + Math.floor(rnd(i, seed, 9) * (w - 12)), ry = 4 + Math.floor(rnd(seed, i, 8) * (h - 12))
    carve(rx, ry, 5, 4)
    const near = pts[Math.min(pts.length - 1, i + 1)]
    for (let x = Math.min(rx + 2, near[0]); x <= Math.max(rx + 2, near[0]); x++) carve(x - 1, ry + 1, 3, 2)
    for (let y = Math.min(ry + 1, near[1]); y <= Math.max(ry + 1, near[1]); y++) carve(near[0] - 1, y - 1, 3, 3)
  }
  m.anchor('start', S[0], S[1])
  m.anchor('end', E[0], E[1])
  // 装饰障碍
  if (o.deco) {
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (m.getO(x, y) !== -1) continue
      const nearKey = pts.some(([px, py]) => Math.abs(px - x) <= 2 && Math.abs(py - y) <= 2)
      if (nearKey) continue
      if (rnd(x, y, seed + 5) > 1 - (o.dens ?? 0.05)) m.ob(x, y, o.deco[Math.floor(rnd(y, x, seed) * o.deco.length)])
    }
  }
  m.tint = o.tint
  m.dark = o.dark
  m.weather = o.weather
  m.enc = o.enc
  return m
}

// ───── 城镇生成 ─────
function town(id: string, name: string, area: string, w: number, h: number, o: {
  ground?: number; road?: number; roofs?: number[]; seed?: number; weather?: MapDef['weather']; wall?: number; trees?: number[]; plaza?: number
}) {
  const g = o.ground ?? T.GRASS
  const m = new MB(id, name, area, w, h, g)
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2)
  const road = o.road ?? T.DIRT
  const seed = o.seed ?? 1
  m.path([[cx, h - 1], [cx, 3]], road, 1)
  m.path([[2, cy], [w - 3, cy]], road, 1)
  m.rect(cx - 4, cy - 3, 9, 6, o.plaza ?? T.STONE)
  m.ob(cx, cy, -1)
  const roofs = o.roofs ?? [0, 1, 2, 4]
  let k = 0
  for (let x = 3; x <= w - 9; x += 7) {
    for (const y of [4, cy + 5]) {
      if (Math.abs(x + 2 - cx) < 5 || y + 3 >= h - 2) continue
      if (y === 4 && x + 5 > w - 3) continue
      m.house(x, y, 5, roofs[k++ % roofs.length], -1)
      if (y === 4 && rnd(x, y, seed) > 0.4) m.ob(x + 5, y + 2, T.BARREL)
    }
  }
  m.border(o.wall ?? T.PINE, 2, [cx - 1, cx + 1, h - 2, h - 1])
  if (o.trees) m.forest([2, 2, w - 4, h - 4], 0.06, seed + 3, o.trees, 2)
  for (let x = 2; x < w - 2; x++) {
    if (m.getO(x, cy + 3) === -1 && !m.road[(cy + 3) * w + x] && m.getG(x, cy + 3) !== o.plaza) {
      // 花坛点缀
      if (rnd(x, 7, seed) > 0.85) m.gr(x, cy + 3, T.FLOWER)
    }
  }
  m.anchor('gate', cx, h - 3)
  m.anchor('plaza', cx, cy)
  m.anchor('north', cx, 6)
  m.anchor('west', 6, cy)
  m.anchor('east', w - 7, cy)
  return m
}

// ═════════════════ 第一章区域 ═════════════════
{
  // 海克村
  const m = new MB('hake', '海克村', '冰封大陆', 40, 30, T.SNOW)
  m.path([[19, 0], [19, 20]], T.DIRT, 1)
  m.path([[10, 15], [20, 15], [20, 11]], T.DIRT, 1)
  m.path([[24, 9], [24, 15]], T.DIRT, 0)
  m.path([[20, 16], [30, 16]], T.DIRT, 0)
  m.path([[6, 22], [19, 22]], T.DIRT, 0)
  m.path([[19, 16], [19, 24]], T.DIRT, 1)
  m.rect(0, 25, 40, 2, T.WATER)
  m.rect(18, 25, 3, 2, T.BRIDGE)
  m.ell(33, 21, 5, 3, T.WATER)
  m.path([[19, 24], [19, 28]], T.DIRT, 1, true)
  m.border(T.PINE, 2, [18, 21, 0, 1])
  const h1 = m.house(8, 11, 5, 2, 2)
  m.warp(h1[0], h1[1], 'home', 6, 7, UP)
  m.house(22, 6, 5, 1, -1)
  m.house(29, 13, 4, 4, -1)
  const st = m.house(5, 19, 4, 5, 1)
  m.warp(st[0], st[1], 'store', 5, 6, UP)
  m.house(13, 21, 4, 0, -1)
  m.house(27, 4, 4, 2, -1)
  for (let x = 7; x <= 13; x++) if (x !== 10) m.ob(x, 16, T.FENCE)
  m.ob(7, 15, T.FENCE)
  m.ob(13, 15, T.FENCE)
  m.ob(12, 18, T.CRATE)
  m.ob(10, 19, T.BARREL)
  m.ob(17, 11, T.SNOWROCK)
  m.ob(26, 11, T.BARREL)
  m.forest([2, 2, 36, 22], 0.06, 4, [T.PINE, T.SNOWROCK], 2)
  m.forest([2, 28, 36, 2], 0.3, 5, [T.PINE], 1)
  for (const [x, y] of [[18, 3], [21, 3]]) m.ob(x, y, T.PINE)
  m.warp(18, 0, 'frost', 12, 63, UP)
  m.warp(19, 0, 'frost', 12, 63, UP)
  m.warp(20, 0, 'frost', 12, 63, UP)
  m.warp(21, 0, 'frost', 12, 63, UP)
  m.anchor('start', 11, 14)
  m.anchor('chick1', 15, 18)
  m.anchor('chick2', 25, 20)
  m.anchor('gate', 19, 3)
  m.anchor('well', 20, 13)
  m.anchor('wood', 12, 17)
  m.anchor('lake', 26, 21)
  m.anchor('home', 10, 14)
  m.anchor('elder', 24, 10)
  m.anchor('grandpa', 11, 15)
  m.anchor('hunter', 19, 8)
  m.weather = 'snow'
  reg(m)
}
{
  const m = room('home', '哈伯家', '海克村', 12, 9, T.WOOD, [6, 8, 'hake', 10, 14, DOWN])
  m.ob(1, 1, T.SHELF)
  m.ob(2, 1, T.SHELF)
  m.ob(5, 0, T.TORCH)
  m.ob(10, 1, T.BED)
  m.ob(9, 1, T.BED)
  m.ob(4, 4, T.TABLE)
  m.ob(5, 4, T.TABLE)
  m.ob(3, 5, T.CHAIR)
  m.ob(6, 5, T.CHAIR)
  m.ob(1, 5, T.BARREL)
  m.rect(4, 6, 4, 2, T.CARPET)
  m.rect(7, 8, 1, 1, T.CARPET)
  m.anchor('bed', 9, 3)
  m.anchor('table', 5, 5)
  m.anchor('door', 6, 7)
  reg(m)
}
{
  const m = room('store', '杂货铺', '海克村', 10, 8, T.WOOD, [5, 7, 'hake', 6, 22, DOWN])
  m.ob(1, 1, T.SHELF)
  m.ob(2, 1, T.SHELF)
  m.ob(7, 1, T.SHELF)
  m.ob(8, 1, T.SHELF)
  for (let x = 2; x <= 7; x++) m.ob(x, 3, T.COUNTER)
  m.ob(1, 5, T.BARREL)
  m.ob(8, 5, T.CRATE)
  m.anchor('clerk', 4, 2)
  reg(m)
}
{
  const m = new MB('cellar', '地窖', '海克村', 9, 7, T.CAVE)
  m.orect(0, 0, 9, 1, T.CAVEWALL)
  m.orect(0, 6, 9, 1, T.CAVEWALL)
  m.orect(0, 0, 1, 7, T.CAVEWALL)
  m.orect(8, 0, 1, 7, T.CAVEWALL)
  m.ob(1, 1, T.BARREL)
  m.ob(2, 1, T.CRATE)
  m.ob(7, 1, T.BARREL)
  m.ob(6, 1, T.BARREL)
  m.rect(3, 2, 3, 3, T.WOOD)
  m.tint = 'rgba(30,20,10,0.25)'
  m.anchor('mid', 4, 4)
  m.anchor('hatch', 4, 1)
  reg(m)
}
{
  // 冰封原野（大世界）
  const W = 96, H = 72
  const m = new MB('frost', '冰封原野', '冰封大陆', W, H, T.SNOW)
  // 冰湖、雪月湖与暖水河
  m.ell(24, 56, 8, 4, T.WATER)
  m.path([[17, 56], [8, 58], [0, 59]], T.WATER, 1)
  m.ell(32, 22, 8, 5, T.ICE)
  m.ell(70, 14, 5, 3, T.ICE)
  m.ell(40, 62, 4, 3, T.ICE)
  // 道路
  const R1: [number, number][] = [[12, 63], [12, 50], [26, 50], [38, 44], [44, 40], [44, 38]]
  m.path(R1, T.DIRT, 1, true)
  m.path([[44, 38], [48, 38], [52, 38]], T.DIRT, 1)
  m.path([[44, 38], [44, 26], [48, 18], [48, 3]], T.DIRT, 1)
  m.path([[52, 38], [70, 38], [78, 34], [80, 30]], T.DIRT, 1)
  m.path([[52, 38], [58, 46], [64, 54], [68, 59]], T.DIRT, 1)
  m.path([[68, 59], [76, 62], [84, 64]], T.DIRT, 1)
  m.path([[70, 38], [72, 24], [80, 16], [85, 11]], T.DIRT, 1)
  // 山脉边界
  m.border(T.MOUNTAIN, 2)
  m.orect(2, 2, 18, 5, T.MOUNTAIN)
  m.orect(20, 2, 26, 6, T.MOUNTAIN)
  m.orect(50, 2, 28, 6, T.MOUNTAIN)
  m.orect(2, 7, 4, 40, T.MOUNTAIN)
  m.orect(89, 12, 5, 56, T.MOUNTAIN)
  m.path([[48, 3], [48, 8]], T.DIRT, 1)
  // 哈米人王国都城城墙
  m.orect(79, 3, 14, 8, T.BRICK)
  m.ob(85, 10, -1)
  m.gr(85, 10, T.STONE)
  m.ob(84, 10, T.TORCH)
  m.ob(86, 10, T.TORCH)
  // 海克村门
  m.ob(10, 64, T.FENCE)
  m.ob(14, 64, T.FENCE)
  m.ob(11, 65, T.SIGN)
  // 树屋酒吧：巨树
  m.orect(46, 31, 5, 3, T.TREE)
  m.ob(48, 34, T.TREE)
  m.ob(47, 34, T.BUSH)
  m.ob(49, 34, T.BUSH)
  m.gr(48, 36, T.PORTAL)
  m.ob(48, 36, -1)
  m.ob(50, 37, T.SIGN)
  m.ob(46, 37, T.BARREL)
  // 乞愿塔
  m.orect(77, 22, 7, 7, T.ICEBRICK)
  m.ob(80, 28, T.SWORDDOOR)
  m.ob(79, 28, T.CRYSTAL)
  m.ob(81, 28, T.CRYSTAL)
  m.ob(77, 29, T.CRYSTAL)
  m.ob(83, 29, T.CRYSTAL)
  m.orect(77, 21, 7, 1, T.CRYSTAL)
  // 旅者之居
  const inn = m.house(66, 55, 5, 3, 2)
  m.warp(inn[0], inn[1], 'inn', 8, 10, UP)
  m.ob(65, 58, T.BARREL)
  m.ob(71, 58, T.CRATE)
  // 地下城入口
  m.orect(81, 58, 7, 4, T.CAVEWALL)
  m.ob(84, 62, -1)
  m.gr(84, 62, T.STAIRS)
  // 龙牙山入口
  m.warp(47, 2, 'dragonmt', 24, 46, UP)
  m.warp(48, 2, 'dragonmt', 25, 46, UP)
  m.warp(49, 2, 'dragonmt', 26, 46, UP)
  m.warp(48, 36, 'treebar', 10, 12, UP)
  m.warp(84, 62, 'dg1', 4, 0, UP)
  m.warp(85, 10, 'capital', 22, 32, UP)
  for (const x of [12, 13]) m.warp(x, 65, 'hake', 19, 3, DOWN)
  // 森林
  m.forest([6, 8, 40, 60], 0.17, 11, [T.PINE, T.PINE, T.SNOWROCK], 2)
  m.forest([52, 8, 36, 28], 0.15, 12, [T.PINE, T.SNOWROCK], 2)
  m.forest([54, 40, 36, 28], 0.45, 13, [T.PINE], 2)
  m.forest([6, 40, 46, 28], 0.1, 14, [T.PINE, T.SNOWROCK], 2)
  m.forest([20, 8, 24, 24], 0.12, 15, [T.PINE], 2)
  // 保险：关键地点周围留白
  for (const [x, y] of [[48, 38], [80, 30], [68, 58], [84, 64], [85, 11], [12, 62]]) {
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      if (m.getO(x + i, y + j) !== -1 && ![T.TREE, T.SWORDDOOR, T.ICEBRICK, T.CRYSTAL, T.SIGN, T.BARREL, T.CRATE, T.BRICK, T.CAVEWALL, T.BUSH, T.TORCH].includes(m.getO(x + i, y + j)) && !(m.getO(x + i, y + j) >= ROOFS[0][0])) m.ob(x + i, y + j, -1)
    }
  }
  m.anchor('hakegate', 12, 62)
  m.anchor('bar', 48, 38)
  m.anchor('tower', 80, 30)
  m.anchor('innfront', 68, 58)
  m.anchor('dgfront', 84, 63)
  m.anchor('capfront', 85, 12)
  m.anchor('mtpass', 48, 6)
  m.anchor('crossroad', 44, 40)
  m.anchor('eastroad', 66, 38)
  m.weather = 'snow'
  m.enc = { rate: 0.06, groups: [{ ids: ['wolf'], w: 3 }, { ids: ['wolf', 'wolf'], w: 2 }, { ids: ['bear'], w: 1 }] }
  reg(m)
}
{
  // 树屋酒吧
  const m = room('treebar', '树屋酒吧', '冰封大陆', 22, 14, T.WOOD, [10, 13, 'frost', 48, 37, DOWN])
  m.warp(11, 13, 'frost', 48, 37, DOWN)
  m.gr(11, 13, T.CARPET)
  m.ob(11, 13, -1)
  for (const x of [2, 8, 14, 19]) m.ob(x, 0, T.TORCH)
  for (let x = 2; x <= 5; x++) m.ob(x, 2, T.COUNTER)
  for (let x = 9; x <= 12; x++) m.ob(x, 2, T.COUNTER)
  for (let x = 16; x <= 19; x++) m.ob(x, 2, T.COUNTER)
  m.ob(1, 1, T.SHELF)
  m.ob(20, 1, T.SHELF)
  m.ob(7, 1, T.SIGN)
  for (const [x, y] of [[4, 6], [4, 9], [16, 6], [16, 8]]) {
    m.ob(x, y, T.TABLE)
    m.ob(x - 1, y, T.CHAIR)
    m.ob(x + 1, y, T.CHAIR)
  }
  m.rect(8, 5, 6, 6, T.CARPET)
  for (let x = 15; x <= 20; x++) m.ob(x, 11, T.COUNTER)
  m.ob(20, 12, T.BARREL)
  m.ob(1, 11, T.BARREL)
  m.ob(1, 12, T.CRATE)
  m.anchor('center', 10, 7)
  m.anchor('guild', 11, 1)
  m.anchor('mage', 3, 1)
  m.anchor('thief', 17, 1)
  m.anchor('shop', 18, 12)
  m.anchor('door', 10, 12)
  reg(m)
}
{
  // 龙牙山
  const W = 50, H = 50
  const m = new MB('dragonmt', '龙牙山', '冰封大陆', W, H, T.SNOW)
  const pts: [number, number][] = [[24, 49], [24, 38], [12, 32], [12, 22], [26, 16], [38, 12], [25, 6]]
  const mask = new Array(W * H).fill(false)
  for (let k = 0; k < pts.length - 1; k++) {
    const [x1, y1] = pts[k], [x2, y2] = pts[k + 1]
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
    for (let s = 0; s <= n; s++) {
      const cx = Math.round(x1 + ((x2 - x1) * s) / n), cy = Math.round(y1 + ((y2 - y1) * s) / n)
      const rr = 3 + Math.floor(rnd(cx, cy, 3) * 2)
      for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) if (i * i + j * j <= rr * rr + 2 && m.in(cx + i, cy + j)) mask[(cy + j) * W + cx + i] = true
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!mask[y * W + x]) m.ob(x, y, T.MOUNTAIN)
  m.path(pts, T.DIRT, 0)
  m.ell(36, 14, 2, 1, T.ICE)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (mask[y * W + x] && m.getO(x, y) === -1 && !m.road[y * W + x] && rnd(x, y, 21) > 0.9) m.ob(x, y, rnd(y, x, 22) > 0.5 ? T.PINE : T.SNOWROCK)
  }
  m.ob(25, 6, -1)
  m.gr(25, 6, T.STAIRS)
  m.ob(24, 6, T.CAVEWALL)
  m.ob(26, 6, T.CAVEWALL)
  m.orect(22, 4, 6, 2, T.CAVEWALL)
  m.warp(25, 6, 'dragoncave', 4, 21, UP)
  for (const x of [22, 23, 24, 25, 26, 27]) m.warp(x, 49, 'frost', 48, 4, DOWN)
  m.anchor('foot', 24, 46)
  m.anchor('bear', 12, 28)
  m.anchor('camp', 12, 24)
  m.anchor('top', 25, 8)
  m.anchor('mid', 26, 16)
  m.weather = 'snow'
  m.enc = { rate: 0.07, groups: [{ ids: ['wolf'], w: 3 }, { ids: ['bear'], w: 2 }, { ids: ['wolf', 'wolf'], w: 2 }] }
  reg(m)
}
{
  const m = dungeon('dragoncave', '龙穴', 32, 24, T.CAVE, T.CAVEWALL, 7, { tint: 'rgba(40,60,110,0.25)', dark: 0.25, deco: [T.ROCK, T.CRYSTAL], dens: 0.04, enc: { rate: 0.05, groups: [{ ids: ['bat'], w: 3 }, { ids: ['bat', 'bat'], w: 2 }, { ids: ['wolf'], w: 1 }] } })
  m.ell(27, 4, 2, 1, T.ICE)
  m.gr(4, 22, T.STAIRS)
  m.warp(4, 22, 'dragonmt', 25, 7, DOWN)
  m.anchor('top', 27, 5)
  reg(m)
}
{
  // 旅者之居
  const m = room('inn', '旅者之居', '冰雪森林', 18, 12, T.WOOD, [8, 11, 'frost', 68, 58, DOWN])
  m.warp(9, 11, 'frost', 68, 58, DOWN)
  m.gr(9, 11, T.CARPET)
  m.ob(9, 11, -1)
  for (let x = 2; x <= 6; x++) m.ob(x, 2, T.COUNTER)
  m.ob(1, 1, T.SHELF)
  m.ob(2, 1, T.SHELF)
  m.ob(8, 0, T.TORCH)
  m.ob(14, 0, T.TORCH)
  m.ob(3, 0, T.TORCH)
  for (const [x, y] of [[11, 4], [14, 4], [11, 8], [14, 8]]) {
    m.ob(x, y, T.TABLE)
    m.ob(x - 1, y, T.CHAIR)
    m.ob(x + 1, y, T.CHAIR)
  }
  m.rect(6, 5, 5, 5, T.CARPET)
  m.ob(16, 10, T.BARREL)
  m.ob(1, 9, T.BARREL)
  m.ob(1, 10, T.CRATE)
  m.anchor('center', 8, 7)
  m.anchor('door', 8, 10)
  reg(m)
}
// 地下城 1~6
const DG: [string, string, number, number, number, number, number, Parameters<typeof dungeon>[7]][] = [
  ['dg1', '地下城·蜃城', 28, 20, T.CLOUD, T.ICEWALL, 31, { tint: 'rgba(230,240,255,0.18)', deco: [T.SNOWROCK], dens: 0.03, enc: { rate: 0.09, groups: [{ ids: ['ghost'], w: 3 }, { ids: ['ghost', 'bat'], w: 2 }, { ids: ['bat', 'bat'], w: 2 }] } }],
  ['dg2', '地下城·鬼域', 30, 22, T.CAVE, T.CAVEWALL, 32, { tint: 'rgba(30,70,40,0.3)', dark: 0.4, deco: [T.ROCK, T.STATUE], dens: 0.03, enc: { rate: 0.09, groups: [{ ids: ['skel'], w: 3 }, { ids: ['skel', 'skel'], w: 2 }, { ids: ['zombie'], w: 2 }] } }],
  ['dg3', '地下城·祭坛', 28, 22, T.STONE, T.BRICK, 33, { tint: 'rgba(120,20,20,0.18)', deco: [T.STATUE, T.PILLAR], dens: 0.03, enc: { rate: 0.08, groups: [{ ids: ['skel', 'ghost'], w: 3 }, { ids: ['zombie', 'skel'], w: 2 }] } }],
  ['dg4', '地下城·旷野', 34, 24, T.DARKGRASS, T.GPINE, 34, { tint: 'rgba(150,160,170,0.22)', deco: [T.BUSH, T.ROCK], dens: 0.06, enc: { rate: 0.09, groups: [{ ids: ['skel', 'skel'], w: 3 }, { ids: ['bers'], w: 1 }, { ids: ['ghost', 'skel'], w: 2 }] } }],
  ['dg5', '地下城·风洞', 32, 22, T.CAVE, T.ICEWALL, 35, { tint: 'rgba(120,190,255,0.16)', weather: 'snow', deco: [T.ROCK], dens: 0.04, enc: { rate: 0.09, groups: [{ ids: ['bat', 'bat'], w: 3 }, { ids: ['ghost', 'ghost'], w: 2 }] } }],
  ['dg6', '地下城·熔岩', 32, 22, T.ASH, T.CAVEWALL, 36, { tint: 'rgba(255,90,20,0.2)', weather: 'ash', deco: [T.ROCK], dens: 0.03, enc: { rate: 0.09, groups: [{ ids: ['lava'], w: 3 }, { ids: ['lava', 'bat'], w: 2 }] } }],
]
for (let i = 0; i < DG.length; i++) {
  const [id, name, w, h, fl, wl, seed, o] = DG[i]
  const m = dungeon(id, name, w, h, fl, wl, seed, o)
  const S = ANCH[id].start, E = ANCH[id].end
  if (id === 'dg6') {
    for (let k = 0; k < 14; k++) {
      const x = 3 + Math.floor(rnd(k, 5, 6) * (w - 6)), y = 3 + Math.floor(rnd(5, k, 6) * (h - 6))
      const key = [...Object.values(ANCH[id])].some(([px, py]) => Math.abs(px - x) <= 2 && Math.abs(py - y) <= 2)
      if (m.getO(x, y) === -1 && !key && m.getG(x, y) !== T.LAVA) m.gr(x, y, T.LAVA)
    }
  }
  // 入口退路 / 出口传送门
  m.gr(S[0], S[1] + 1, T.STAIRS)
  m.ob(S[0], S[1] + 1, -1)
  m.gr(E[0], E[1], T.PORTAL)
  m.ob(E[0], E[1], -1)
  const prev = i === 0 ? ['frost', 84, 63] : [DG[i - 1][0], ANCH[DG[i - 1][0]].end[0], ANCH[DG[i - 1][0]].end[1] + 1]
  m.warp(S[0], S[1] + 1, prev[0] as string, prev[1] as number, prev[2] as number, DOWN)
  const next = i + 1 < DG.length ? DG[i + 1][0] : 'dg7'
  m.warp(E[0], E[1], next, i + 1 < DG.length ? 0 : 15, i + 1 < DG.length ? 0 : 20, UP, { when: undefined })
  reg(m)
}
// 修正地牢间落点：到下一层起点
for (let i = 0; i < DG.length; i++) {
  const id = DG[i][0]
  const w = MAPS[id].warps
  const portal = w[w.length - 1]
  const nextId = portal.to
  if (nextId !== 'dg7') {
    const ns = ANCH[nextId].start
    portal.tx = ns[0]
    portal.ty = ns[1]
  } else {
    portal.tx = 15
    portal.ty = 20
  }
}
// dg1 的入口落点
{
  const s = ANCH.dg1.start
  const frost = MAPS.frost
  const wp = frost.warps.find((x) => x.to === 'dg1')!
  wp.tx = s[0]
  wp.ty = s[1]
}
{
  // 第七层：吟风之巢
  const m = new MB('dg7', '地下城·吟风', '地下城', 30, 24, T.STONE)
  m.border(T.CAVEWALL, 1)
  m.rect(10, 3, 10, 8, T.MARBLE)
  m.ob(2, 3, T.CRYSTAL)
  for (const [x, y] of [[6, 5], [6, 11], [6, 17], [23, 5], [23, 11], [23, 17]]) m.ob(x, y, T.CRYSTAL)
  for (const [x, y] of [[11, 2], [13, 2], [15, 2], [17, 2], [19, 2], [9, 3], [20, 3], [12, 3], [18, 3]]) m.ob(x, y, T.GOLD)
  for (const [x, y] of [[3, 10], [26, 10], [3, 18], [26, 18], [14, 8]]) m.ob(x, y, T.ROCK)
  m.gr(15, 21, T.STAIRS)
  m.warp(15, 22, 'dg6', 0, 0, DOWN)
  m.gr(15, 22, T.STAIRS)
  m.tint = 'rgba(70,20,120,0.2)'
  m.dark = 0.2
  m.anchor('start', 15, 20)
  m.anchor('boss', 15, 7)
  m.anchor('hoard', 15, 4)
  reg(m)
  const d6 = ANCH.dg6.start
  MAPS.dg7.warps[0].to = 'dg6'
  MAPS.dg7.warps[0].tx = ANCH.dg6.end[0]
  MAPS.dg7.warps[0].ty = ANCH.dg6.end[1] + 1
  void d6
}
{
  // 哈米人王国都城
  const m = town('capital', '哈米人王国·雪都', '冰封大陆', 44, 34, { ground: T.SNOW, road: T.STONE, roofs: [1, 3, 5, 2], wall: T.BRICK, seed: 5, weather: 'snow', trees: [T.PINE], plaza: T.MARBLE })
  m.weather = 'snow'
  m.orect(2, 2, 40, 1, T.BRICK)
  m.rect(19, 12, 6, 3, T.MARBLE)
  m.ell(22, 15, 1, 1, T.WATER)
  // 王宫
  const p = m.house(16, 2, 12, 1, 5)
  m.warp(p[0], p[1], 'palace', 11, 15, UP)
  // 竞技场入口
  m.rect(36, 15, 3, 3, T.STONE)
  m.ob(40, 16, T.BRICK)
  m.ob(41, 16, T.BRICK)
  m.orect(39, 14, 4, 1, T.BRICK)
  m.orect(39, 18, 4, 1, T.BRICK)
  m.ob(40, 16, -1)
  m.gr(40, 16, T.STAIRS)
  m.warp(40, 16, 'arena', 3, 10, RIGHT)
  for (const x of [21, 22, 23]) m.warp(x, 33, 'frost', 85, 11, DOWN)
  m.anchor('palaceDoor', p[0], p[1] + 1)
  m.anchor('arenaDoor', 38, 16)
  m.anchor('arrive', 22, 32)
  m.enc = undefined
  reg(m)
}
{
  const m = room('palace', '雪都王宫', '冰封大陆', 24, 18, T.MARBLE, [12, 17, 'capital', 21, 5, DOWN])
  m.warp(11, 17, 'capital', 21, 5, DOWN)
  m.gr(11, 17, T.CARPET)
  m.ob(11, 17, -1)
  m.rect(11, 4, 2, 13, T.CARPET)
  m.rect(10, 2, 4, 2, T.CARPET)
  for (const y of [5, 9, 13]) {
    m.ob(5, y, T.PILLAR)
    m.ob(18, y, T.PILLAR)
  }
  for (const x of [3, 8, 15, 20]) m.ob(x, 0, T.TORCH)
  m.ob(12, 1, T.STATUE)
  m.ob(9, 1, T.STATUE)
  m.ob(14, 1, T.STATUE)
  m.anchor('throne', 11, 3)
  m.anchor('mid', 11, 8)
  m.anchor('door', 11, 15)
  reg(m)
}
{
  const m = new MB('arena', '飞龙竞技场', '冰封大陆', 30, 20, T.SAND)
  m.border(T.BRICK, 2)
  m.orect(2, 2, 26, 2, T.BRICK)
  m.orect(2, 16, 26, 2, T.BRICK)
  m.ell(15, 10, 11, 5, T.SAND)
  for (let x = 3; x < 27; x += 4) m.ob(x, 4, T.TORCH)
  m.ob(2, 10, -1)
  m.ob(1, 10, -1)
  m.gr(2, 10, T.STAIRS)
  m.gr(1, 10, T.STAIRS)
  m.warp(1, 10, 'capital', 38, 16, DOWN)
  m.warp(2, 10, 'capital', 38, 16, DOWN)
  m.rect(3, 9, 2, 3, T.SAND)
  m.anchor('mid', 15, 10)
  m.anchor('west', 6, 10)
  m.anchor('east', 24, 10)
  m.anchor('stand', 15, 5)
  reg(m)
  MAPS.arena.warps = [{ x: 1, y: 10, to: 'capital', tx: 38, ty: 16, dir: DOWN }, { x: 2, y: 10, to: 'capital', tx: 38, ty: 16, dir: DOWN }]
}

// ═════════════════ 第二章：英雄舞台 ═════════════════
{
  const m = new MB('harbor', '碧蓝港', '碧蓝海路', 36, 24, T.SAND)
  m.rect(0, 14, 36, 10, T.WATER)
  m.rect(12, 14, 6, 8, T.BRIDGE)
  m.rect(12, 20, 8, 3, T.WOOD)
  m.path([[6, 0], [6, 12], [14, 12]], T.DIRT, 1)
  m.path([[28, 0], [28, 12], [15, 12]], T.DIRT, 1)
  m.house(2, 2, 5, 1, 2)
  m.house(9, 2, 5, 0, -1)
  m.house(22, 2, 6, 2, -1)
  m.house(30, 4, 4, 4, -1)
  m.house(20, 9, 4, 5, -1)
  m.ob(10, 11, T.CRATE)
  m.ob(11, 11, T.BARREL)
  m.ob(18, 11, T.CRATE)
  m.border(T.PALM, 1, [5, 7, 0, 0])
  m.forest([0, 0, 36, 14], 0.05, 77, [T.PALM, T.ROCK], 2)
  m.anchor('arrive', 14, 11)
  m.anchor('pier', 14, 21)
  m.anchor('captain', 16, 21)
  m.anchor('sailor', 12, 20)
  m.weather = 'none'
  reg(m)
}
{
  const m = new MB('ship', '海上·鸥翼号', '碧蓝海路', 16, 12, T.WATER)
  m.rect(4, 2, 8, 8, T.WOOD)
  m.rect(6, 1, 4, 1, T.WOOD)
  m.orect(4, 2, 1, 8, T.FENCE)
  m.orect(11, 2, 1, 8, T.FENCE)
  m.ob(7, 3, T.CRATE)
  m.ob(9, 3, T.BARREL)
  m.ob(7, 4, -1)
  m.ob(8, 5, T.TABLE)
  m.ob(5, 3, T.CRATE)
  m.ob(5, 4, -1)
  m.anchor('deck', 7, 6)
  m.anchor('bow', 8, 2)
  m.anchor('stern', 7, 8)
  m.anchor('amy', 6, 5)
  m.anchor('dqs', 9, 6)
  reg(m)
}
{
  const m = town('xilin', '西林', '艾米诺尔大陆', 48, 34, { ground: T.GRASS, road: T.DIRT, roofs: [0, 1, 2, 3, 4], seed: 21, trees: [T.TREE, T.BUSH], plaza: T.STONE })
  m.gr(m.w >> 1, 13, T.FLOWER)
  m.warp(24, 33, 'elfwood', 28, 40, UP, { when: (f) => f.ch >= 13 })
  m.weather = 'none'
  m.anchor('inn', 10, 18)
  m.anchor('market', 30, 17)
  reg(m)
}
{
  const W = 56, H = 44
  const m = new MB('elfwood', '精灵之森', '艾米诺尔大陆', W, H, T.DARKGRASS)
  m.path([[28, 43], [28, 34], [16, 28], [16, 16], [30, 12], [30, 5]], T.DIRT, 1)
  m.path([[28, 34], [42, 28], [46, 16]], T.DIRT, 1)
  m.ell(46, 14, 4, 3, T.WATER)
  m.border(T.GPINE, 2, [26, 30, 42, 43])
  m.forest([2, 2, W - 4, H - 4], 0.28, 61, [T.GPINE, T.TREE, T.TREE], 2)
  // 湛蓝陨石坑
  m.ell(30, 6, 6, 4, T.ASH)
  m.ob(30, 5, T.CRYSTAL)
  m.ob(31, 5, T.CRYSTAL)
  m.ob(29, 5, T.CRYSTAL)
  m.rect(28, 7, 5, 2, T.ASH)
  m.warp(28, 43, 'xilin', 24, 31, UP)
  m.warp(29, 43, 'xilin', 24, 31, UP)
  m.warp(27, 43, 'xilin', 24, 31, UP)
  m.anchor('gate', 28, 40)
  m.anchor('trial', 16, 22)
  m.anchor('crater', 30, 9)
  m.anchor('lake', 44, 17)
  m.weather = 'petal'
  m.enc = { rate: 0.05, groups: [{ ids: ['beast'], w: 3 }, { ids: ['beast', 'beast'], w: 2 }, { ids: ['bandit'], w: 2 }] }
  reg(m)
}
// ═════════════════ 第三章：卷入战局 ═════════════════
{
  const m = new MB('island', '无名孤岛', '碧蓝海路', 32, 24, T.WATER)
  m.ell(16, 12, 12, 8, T.SAND)
  m.ell(16, 12, 8, 5, T.GRASS)
  m.forest([4, 4, 24, 16], 0.12, 91, [T.PALM, T.ROCK], 1)
  m.ob(16, 12, -1)
  m.rect(14, 10, 5, 4, T.DIRT)
  m.ob(16, 10, T.CRATE)
  m.anchor('camp', 16, 12)
  m.anchor('shore', 16, 18)
  m.anchor('north', 16, 7)
  m.weather = 'none'
  m.tint = 'rgba(255,170,90,0.10)'
  reg(m)
}
{
  const m = town('lioncity', '狮城', '艾米诺尔大陆', 44, 32, { ground: T.GRASS, road: T.STONE, roofs: [0, 5, 2, 1], wall: T.BRICK, seed: 31, trees: [T.TREE], plaza: T.MARBLE })
  m.house(15, 2, 12, 0, 5)
  m.warp(21, 31, 'goldtree', 20, 20, UP, { when: (f) => f.ch >= 17 })
  m.anchor('hall', 21, 6)
  reg(m)
}
{
  const m = new MB('goldtree', '黄金古树', '艾米诺尔大陆', 40, 30, T.DARKGRASS)
  m.border(T.GPINE, 2)
  m.forest([2, 2, 36, 26], 0.25, 111, [T.GPINE, T.TREE], 3)
  m.ell(20, 12, 7, 5, T.GRASS)
  m.orect(19, 8, 3, 3, T.TREE)
  m.ob(20, 11, T.TREE)
  m.path([[20, 28], [20, 14]], T.DIRT, 1)
  m.ob(19, 12, T.CRYSTAL)
  m.ob(21, 12, T.CRYSTAL)
  m.warp(20, 29, 'lioncity', 21, 29, UP)
  m.anchor('gate', 20, 26)
  m.anchor('tree', 20, 14)
  m.weather = 'petal'
  reg(m)
}
// ═════════════════ 第四章：国王寿辰 ═════════════════
{
  const m = town('redcity', '红石帝都·卡林路斯', '艾米帝国', 48, 36, { ground: T.GRASS, road: T.STONE, roofs: [0, 2, 5, 1], wall: T.BRICK, seed: 41, trees: [T.TREE], plaza: T.MARBLE })
  const p = m.house(18, 2, 12, 0, 6)
  m.warp(p[0], p[1], 'redpalace', 13, 17, UP)
  m.anchor('palaceDoor', p[0], p[1] + 1)
  reg(m)
}
{
  const m = room('redpalace', '红石王宫', '艾米帝国', 26, 20, T.MARBLE, [12, 19, 'redcity', 24, 5, DOWN])
  m.warp(13, 19, 'redcity', 24, 5, DOWN)
  m.gr(13, 19, T.CARPET)
  m.ob(13, 19, -1)
  m.rect(12, 4, 3, 15, T.CARPET)
  for (const y of [5, 9, 13]) {
    m.ob(6, y, T.PILLAR)
    m.ob(20, y, T.PILLAR)
  }
  for (const x of [4, 9, 17, 22]) m.ob(x, 0, T.TORCH)
  for (const [x, y] of [[3, 7], [3, 11], [22, 7], [22, 11]]) m.ob(x, y, T.TABLE)
  m.anchor('throne', 13, 3)
  m.anchor('hall', 13, 10)
  m.anchor('door', 13, 17)
  reg(m)
}
{
  const m = new MB('sealplat', '克里斯托镇·封龙台', '艾米帝国', 34, 24, T.GRASS)
  m.border(T.GPINE, 2)
  m.forest([2, 2, 30, 20], 0.1, 121, [T.TREE, T.BUSH], 3)
  m.ell(17, 10, 8, 5, T.STONE)
  m.ell(17, 10, 5, 3, T.MARBLE)
  for (const [x, y] of [[12, 7], [22, 7], [12, 13], [22, 13]]) m.ob(x, y, T.PILLAR)
  m.path([[17, 22], [17, 15]], T.DIRT, 1)
  m.warp(17, 23, 'redcity', 24, 33, UP, { when: undefined })
  m.anchor('gate', 17, 20)
  m.anchor('mid', 17, 10)
  reg(m)
}
// ═════════════════ 第五章：汉堡与天空之城 ═════════════════
{
  const m = town('hamburg', '汉堡城', '艾米诺尔大陆', 44, 32, { ground: T.GRASS, road: T.STONE, roofs: [5, 0, 1, 2], wall: T.BRICK, seed: 51, trees: [T.TREE], plaza: T.STONE })
  m.anchor('wall', 22, 4)
  reg(m)
}
{
  const m = new MB('desert', '浩瀚沙海', '法诺斯大陆', 56, 40, T.SAND)
  m.forest([2, 2, 52, 36], 0.08, 131, [T.CACTUS, T.ROCK, T.PALM], 3)
  m.ell(28, 12, 5, 3, T.WATER)
  m.ell(28, 12, 7, 5, T.SAND)
  m.ell(28, 12, 4, 2, T.WATER)
  m.path([[28, 38], [28, 20]], T.DIRT, 1)
  m.path([[28, 20], [14, 20], [14, 8]], T.DIRT, 0)
  m.anchor('camp', 28, 24)
  m.anchor('oasis', 28, 17)
  m.anchor('start', 28, 37)
  m.warp(28, 39, 'hamburg', 22, 29, UP, { when: undefined })
  m.weather = 'sand'
  m.enc = { rate: 0.06, groups: [{ ids: ['sandliz'], w: 3 }, { ids: ['sandliz', 'sandliz'], w: 2 }, { ids: ['bandit'], w: 1 }] }
  reg(m)
}
{
  const m = new MB('skycity', '天空之城', '法诺斯大陆', 36, 28, T.CLOUD)
  m.border(T.CRYSTAL, 1)
  m.ell(18, 14, 11, 9, T.MARBLE)
  m.rect(16, 4, 5, 20, T.CARPET)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const x = Math.round(18 + Math.cos(a) * 8), y = Math.round(14 + Math.sin(a) * 6)
    m.orect(x - 1, y - 1, 3, 1, T.ICEBRICK)
    m.ob(x, y, T.CRYSTAL)
  }
  m.ob(18, 14, -1)
  m.ob(18, 13, T.ALTAR)
  m.anchor('start', 18, 24)
  m.anchor('altar', 18, 15)
  m.anchor('mid', 18, 18)
  m.weather = 'snow'
  m.tint = 'rgba(180,210,255,0.10)'
  reg(m)
}
// ═════════════════ 第六章：众神之战 ═════════════════
{
  const m = new MB('lanisle', '湛蓝岛', '艾米诺尔大陆', 40, 30, T.GRASS)
  m.border(T.WATER, 3)
  m.ell(20, 14, 16, 11, T.GRASS)
  m.forest([4, 4, 32, 22], 0.07, 141, [T.TREE, T.FLOWER], 3)
  m.rect(14, 8, 12, 12, T.MARBLE)
  m.path([[20, 27], [20, 20]], T.STONE, 1)
  m.orect(14, 7, 12, 1, T.PILLAR)
  m.ob(16, 12, -1)
  for (const x of [15, 25]) m.ob(x, 9, T.PILLAR)
  m.rect(18, 8, 5, 4, T.CARPET)
  m.anchor('stage', 20, 9)
  m.anchor('crowd', 20, 14)
  m.anchor('start', 20, 24)
  m.weather = 'petal'
  reg(m)
}
{
  const m = new MB('heaven', '神界·安卡拉神山', '创世神界', 40, 30, T.CLOUD)
  m.border(T.CRYSTAL, 1)
  m.rect(16, 0, 8, 30, T.MARBLE)
  m.rect(17, 0, 6, 30, T.CARPET)
  for (let y = 4; y < 26; y += 5) {
    m.ob(15, y, T.PILLAR)
    m.ob(24, y, T.PILLAR)
  }
  m.ell(20, 3, 8, 3, T.MARBLE)
  m.ob(20, 1, T.STATUE)
  m.warp(19, 0, 'hall', 15, 20, UP)
  m.warp(20, 0, 'hall', 15, 20, UP)
  m.warp(21, 0, 'hall', 15, 20, UP)
  m.ob(20, 0, -1)
  m.ob(19, 0, -1)
  m.ob(21, 0, -1)
  m.anchor('start', 20, 27)
  m.anchor('gate', 20, 4)
  m.weather = 'petal'
  m.tint = 'rgba(255,245,200,0.10)'
  reg(m)
}
{
  const m = room('hall', '父神大殿', '创世神界', 30, 22, T.MARBLE, [14, 21, 'heaven', 20, 3, DOWN])
  m.warp(15, 21, 'heaven', 20, 3, DOWN)
  m.gr(15, 21, T.CARPET)
  m.ob(15, 21, -1)
  m.rect(13, 3, 4, 18, T.CARPET)
  for (let y = 4; y < 20; y += 4) {
    m.ob(7, y, T.PILLAR)
    m.ob(22, y, T.PILLAR)
  }
  for (const x of [5, 10, 19, 24]) m.ob(x, 0, T.TORCH)
  for (const x of [5, 7, 9, 21, 23, 25]) m.ob(x, 2, T.STATUE)
  m.ob(15, 1, T.ALTAR)
  m.anchor('throne', 15, 3)
  m.anchor('mid', 15, 10)
  m.anchor('start', 15, 19)
  reg(m)
}


export const MAP_LIST = MAPS
