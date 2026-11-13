// 程序化像素美术：16x16 图块、角色、怪物。风格参考《星露谷物语》《宝可梦》。
export const TS = 16
export const DOWN = 0
export const LEFT = 1
export const RIGHT = 2
export const UP = 3
export type Dir = 0 | 1 | 2 | 3

type G = CanvasRenderingContext2D

const mk = (w: number, h: number) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}
const P = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  g.fillStyle = c
  g.fillRect(x, y, w, h)
}
export const rnd = (a: number, b: number, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// ───────────────────────── 图块 ─────────────────────────
export interface TileDef {
  name: string
  solid: boolean
  tall?: boolean
  frames: number
  draw: (g: G, v: number, f: number) => void
}
export const TILES: TileDef[] = []
const def = (name: string, solid: boolean, draw: TileDef['draw'], opt: { tall?: boolean; frames?: number } = {}) => {
  TILES.push({ name, solid, draw, tall: opt.tall, frames: opt.frames ?? 1 })
  return TILES.length - 1
}
const speckle = (g: G, v: number, cols: string[], n: number, seed = 0) => {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rnd(v, i, seed) * 16)
    const y = Math.floor(rnd(i, v, seed + 7) * 16)
    P(g, x, y, 1, 1, cols[Math.floor(rnd(x, y, seed + 3) * cols.length)])
  }
}
const grassBase = (g: G, v: number) => {
  P(g, 0, 0, 16, 16, '#6bb24b')
  speckle(g, v, ['#5c9f40', '#7cc258', '#559838'], 14, 1)
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(rnd(v, i, 11) * 13)
    const y = 2 + Math.floor(rnd(i, v, 12) * 12)
    P(g, x, y, 1, 2, '#4f9034')
    P(g, x + 1, y - 1, 1, 2, '#86cf63')
  }
}
const snowBase = (g: G, v: number) => {
  P(g, 0, 0, 16, 16, '#eef4fb')
  speckle(g, v, ['#dbe7f4', '#ffffff', '#cfdff0'], 12, 2)
  if (v % 3 === 0) {
    P(g, 3, 9, 4, 1, '#d2e0f0')
    P(g, 4, 10, 2, 1, '#c3d6ea')
  }
}

export const T: Record<string, number> = {}
T.GRASS = def('grass', false, (g, v) => grassBase(g, v))
T.FLOWER = def('flower', false, (g, v) => {
  grassBase(g, v)
  const cols = ['#f6e05a', '#f08fb0', '#ffffff', '#8fb6f2']
  for (let i = 0; i < 2; i++) {
    const x = 2 + Math.floor(rnd(v, i, 21) * 11)
    const y = 3 + Math.floor(rnd(i, v, 22) * 10)
    const c = cols[(v + i) % 4]
    P(g, x, y, 1, 1, c)
    P(g, x - 1, y, 1, 1, c)
    P(g, x + 1, y, 1, 1, c)
    P(g, x, y - 1, 1, 1, c)
    P(g, x, y + 1, 1, 1, c)
    P(g, x, y, 1, 1, '#f0b23a')
  }
})
T.DIRT = def('dirt', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#c9a26b')
  speckle(g, v, ['#b78d57', '#d8b985', '#a97f4c'], 16, 3)
  P(g, 2 + (v % 5), 6, 2, 1, '#9f7646')
})
T.SNOW = def('snow', false, (g, v) => snowBase(g, v))
T.ICE = def('ice', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#a8d8f2')
  speckle(g, v, ['#c8ecfb', '#8cc6e6', '#e8f8ff'], 10, 4)
  P(g, 2, 3, 5, 1, '#e8f8ff')
  P(g, 9, 11, 4, 1, '#e8f8ff')
  P(g, 6, 7, 1, 3, '#8cc6e6')
})
T.WATER = def('water', true, (g, v, f) => {
  P(g, 0, 0, 16, 16, '#3f86d1')
  const o = (f * 4) % 16
  for (let i = 0; i < 3; i++) {
    const x = (Math.floor(rnd(v, i, 31) * 12) + o) % 14
    const y = 2 + i * 5 + (v % 2)
    P(g, x, y, 3, 1, '#7ab8ee')
    P(g, x + 1, y + 1, 2, 1, '#2f70b8')
  }
}, { frames: 4 })
T.SAND = def('sand', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#e9d29b')
  speckle(g, v, ['#d9bd80', '#f4e3b3', '#cfb06f'], 14, 5)
  if (v % 2) P(g, 3, 8, 5, 1, '#d6b977')
})
T.STONE = def('stone', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#a9a9b0')
  P(g, 0, 7, 16, 1, '#85858f')
  P(g, 0, 15, 16, 1, '#85858f')
  P(g, 7, 0, 1, 7, '#85858f')
  P(g, 3, 8, 1, 7, '#85858f')
  P(g, 11, 8, 1, 7, '#85858f')
  speckle(g, v, ['#bcbcc4', '#9a9aa3'], 8, 6)
})
T.WOOD = def('wood', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#c88f55')
  for (let y = 0; y < 16; y += 4) P(g, 0, y + 3, 16, 1, '#a8703c')
  P(g, (v * 5) % 12, 1, 1, 3, '#a8703c')
  P(g, (v * 7) % 12 + 2, 9, 1, 3, '#a8703c')
  speckle(g, v, ['#d9a068'], 4, 8)
})
T.CARPET = def('carpet', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#b83a3a')
  P(g, 0, 0, 16, 1, '#e0b64a')
  P(g, 0, 15, 16, 1, '#e0b64a')
  speckle(g, v, ['#a02f2f', '#c94848'], 8, 9)
})
T.CAVE = def('cave', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#5a5568')
  speckle(g, v, ['#4a4658', '#6b6679', '#403c4c'], 16, 10)
  P(g, 4, 5, 3, 1, '#4a4658')
})
T.LAVA = def('lava', true, (g, v, f) => {
  P(g, 0, 0, 16, 16, '#d8461c')
  for (let i = 0; i < 4; i++) {
    const x = (Math.floor(rnd(v, i, 41) * 12) + f * 3) % 14
    const y = 1 + i * 4
    P(g, x, y, 4, 2, '#f58a2a')
    P(g, x + 1, y, 2, 1, '#ffd25a')
  }
}, { frames: 4 })
T.CLOUD = def('cloud', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#dcebfa')
  speckle(g, v, ['#ffffff', '#c6dcf2'], 12, 12)
  P(g, 2, 4, 6, 2, '#f4f9ff')
  P(g, 8, 10, 5, 2, '#f4f9ff')
})
T.MARBLE = def('marble', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#f2eddc')
  P(g, 0, 0, 16, 1, '#d8cfae')
  P(g, 0, 0, 1, 16, '#d8cfae')
  speckle(g, v, ['#e4dcc2', '#fffaf0'], 8, 13)
  P(g, 5, 9, 4, 1, '#e0d6b8')
})
T.BRIDGE = def('bridge', false, (g) => {
  P(g, 0, 0, 16, 16, '#b8814c')
  for (let x = 0; x < 16; x += 4) P(g, x + 3, 0, 1, 16, '#8a5c30')
  P(g, 0, 0, 16, 1, '#6a4422')
  P(g, 0, 15, 16, 1, '#6a4422')
})
T.ASH = def('ash', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#4a3f3f')
  speckle(g, v, ['#3a3030', '#5c4f4f', '#7a3a2a'], 14, 14)
})
T.DARKGRASS = def('darkgrass', false, (g, v) => {
  P(g, 0, 0, 16, 16, '#3f7f3a')
  speckle(g, v, ['#356e32', '#4b8f45'], 12, 15)
})

// 物件（碰撞）
T.TREE = def('tree', true, (g, v) => {
  P(g, 6, 20, 4, 10, '#6b4423')
  P(g, 6, 20, 1, 10, '#80542c')
  P(g, 4, 29, 8, 2, '#5a3a1c')
  const d = '#2f7a35', m = '#3f9a45', l = '#62b858'
  P(g, 2, 8, 12, 14, d)
  P(g, 1, 11, 14, 8, d)
  P(g, 4, 4, 8, 6, d)
  P(g, 3, 10, 7, 8, m)
  P(g, 5, 6, 5, 5, m)
  P(g, 4, 8, 3, 3, l)
  P(g, 7, 12, 3, 2, l)
  if (v % 2) P(g, 10, 15, 2, 2, '#e06a5a')
}, { tall: true })
T.PINE = def('pine', true, (g, v) => {
  P(g, 7, 24, 2, 7, '#6b4423')
  const tiers = [[3, 2], [5, 4], [7, 4], [9, 4], [11, 4]]
  tiers.forEach(([w, h], i) => {
    const y = 4 + i * 4
    P(g, 8 - w / 2, y, w, h, '#2a6b45')
    P(g, 8 - w / 2, y, w, 1, '#eef4fb')
    P(g, 8 - w / 2 + 1, y + 1, Math.max(1, w - 3), 1, '#d3e1f0')
  })
  P(g, 7, 2, 2, 3, '#2a6b45')
  P(g, 7, 2, 2, 1, '#ffffff')
  if (v % 2) P(g, 5, 14, 2, 1, '#ffffff')
}, { tall: true })
T.GPINE = def('gpine', true, (g) => {
  P(g, 7, 24, 2, 7, '#6b4423')
  for (let i = 0; i < 5; i++) {
    const w = 3 + i * 2
    P(g, 8 - w / 2, 4 + i * 4, w, 4, i % 2 ? '#2d7a3c' : '#368a45')
  }
  P(g, 7, 2, 2, 3, '#2d7a3c')
}, { tall: true })
T.PALM = def('palm', true, (g) => {
  P(g, 7, 12, 2, 18, '#9a6b3a')
  P(g, 7, 16, 2, 1, '#7a5228')
  P(g, 7, 22, 2, 1, '#7a5228')
  const c = '#3f9a45'
  P(g, 2, 8, 6, 2, c)
  P(g, 8, 8, 6, 2, c)
  P(g, 4, 5, 8, 3, c)
  P(g, 0, 10, 4, 2, '#2f7a35')
  P(g, 12, 10, 4, 2, '#2f7a35')
  P(g, 6, 3, 4, 2, '#62b858')
  P(g, 7, 10, 2, 2, '#c88a2a')
}, { tall: true })
T.CACTUS = def('cactus', true, (g) => {
  P(g, 0, 0, 16, 16, 'rgba(0,0,0,0)')
  P(g, 6, 2, 4, 13, '#3f8a45')
  P(g, 2, 6, 4, 2, '#3f8a45')
  P(g, 2, 4, 2, 3, '#3f8a45')
  P(g, 10, 8, 4, 2, '#3f8a45')
  P(g, 12, 6, 2, 3, '#3f8a45')
  P(g, 7, 2, 1, 12, '#5aae5e')
})
T.ROCK = def('rock', true, (g) => {
  P(g, 3, 8, 11, 7, '#8a8a92')
  P(g, 5, 6, 7, 3, '#8a8a92')
  P(g, 5, 6, 4, 2, '#b0b0b8')
  P(g, 4, 9, 3, 2, '#a0a0a8')
  P(g, 3, 14, 11, 1, '#5e5e66')
  P(g, 10, 10, 4, 5, '#6e6e76')
})
T.SNOWROCK = def('snowrock', true, (g) => {
  P(g, 3, 8, 11, 7, '#7a8794')
  P(g, 5, 6, 7, 3, '#7a8794')
  P(g, 4, 5, 8, 3, '#ffffff')
  P(g, 3, 8, 3, 1, '#ffffff')
  P(g, 3, 14, 11, 1, '#55606c')
  P(g, 10, 9, 4, 5, '#5f6b78')
})
T.MOUNTAIN = def('mountain', true, (g, v) => {
  P(g, 0, 0, 16, 16, '#7e7a8c')
  P(g, 0, 0, 16, 5, '#f4f8fc')
  P(g, 0, 5, 16, 1, '#d3e1f0')
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(rnd(v, i, 51) * 14)
    P(g, x, 7 + (i % 3) * 3, 1, 4, '#5f5b70')
    P(g, x + 1, 7 + (i % 3) * 3, 1, 3, '#948fa4')
  }
  P(g, 0, 15, 16, 1, '#4f4b60')
})
T.CLIFF = def('cliff', true, (g, v) => {
  P(g, 0, 0, 16, 16, '#9a7a56')
  P(g, 0, 0, 16, 3, '#7cc258')
  P(g, 0, 3, 16, 1, '#5c9f40')
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(rnd(v, i, 52) * 14)
    P(g, x, 6 + (i % 3) * 3, 1, 4, '#7a5e3e')
    P(g, x + 1, 6 + (i % 3) * 3, 1, 3, '#b0906a')
  }
  P(g, 0, 15, 16, 1, '#6a4e32')
})
T.ICEWALL = def('icewall', true, (g, v) => {
  P(g, 0, 0, 16, 16, '#7fb8dc')
  P(g, 0, 0, 16, 4, '#d8f0fc')
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rnd(v, i, 53) * 14)
    P(g, x, 6 + (i % 3) * 3, 2, 5, '#5e9cc4')
    P(g, x + 1, 5 + (i % 3) * 3, 1, 3, '#b8e0f4')
  }
  P(g, 0, 15, 16, 1, '#4a86ae')
})
T.CAVEWALL = def('cavewall', true, (g, v) => {
  P(g, 0, 0, 16, 16, '#2f2b3a')
  speckle(g, v, ['#3b3648', '#26222f', '#463f55'], 18, 16)
  P(g, 0, 0, 16, 2, '#463f55')
  P(g, 0, 15, 16, 1, '#1c1924')
})
T.BRICK = def('brick', true, (g) => {
  P(g, 0, 0, 16, 16, '#8f8f9c')
  for (let y = 0; y < 16; y += 4) {
    P(g, 0, y + 3, 16, 1, '#6a6a78')
    const o = (y / 4) % 2 ? 4 : 0
    P(g, o, y, 1, 3, '#6a6a78')
    P(g, o + 8, y, 1, 3, '#6a6a78')
  }
  P(g, 0, 0, 16, 1, '#b4b4c0')
})
T.FENCE = def('fence', true, (g) => {
  P(g, 1, 6, 14, 2, '#a8703c')
  P(g, 1, 10, 14, 2, '#a8703c')
  P(g, 2, 4, 2, 11, '#c88f55')
  P(g, 12, 4, 2, 11, '#c88f55')
  P(g, 1, 7, 14, 1, '#7a4f26')
})
T.SIGN = def('sign', true, (g) => {
  P(g, 7, 9, 2, 6, '#6b4423')
  P(g, 2, 3, 12, 7, '#c88f55')
  P(g, 2, 3, 12, 1, '#e0a870')
  P(g, 2, 9, 12, 1, '#8a5a30')
  P(g, 4, 5, 8, 1, '#5a3a1c')
  P(g, 4, 7, 6, 1, '#5a3a1c')
})
T.CRATE = def('crate', true, (g) => {
  P(g, 1, 3, 14, 12, '#b8803c')
  P(g, 1, 3, 14, 2, '#d89a50')
  P(g, 1, 3, 2, 12, '#8a5a28')
  P(g, 13, 3, 2, 12, '#8a5a28')
  P(g, 3, 8, 10, 1, '#8a5a28')
  P(g, 1, 14, 14, 1, '#6a4420')
})
T.BARREL = def('barrel', true, (g) => {
  P(g, 3, 2, 10, 13, '#a8703c')
  P(g, 2, 4, 12, 9, '#a8703c')
  P(g, 2, 5, 12, 1, '#4a4a52')
  P(g, 2, 11, 12, 1, '#4a4a52')
  P(g, 4, 3, 2, 11, '#c88f55')
  P(g, 3, 14, 10, 1, '#5a3a1c')
})
T.TABLE = def('table', true, (g) => {
  P(g, 1, 4, 14, 6, '#b8803c')
  P(g, 1, 4, 14, 1, '#d89a50')
  P(g, 1, 10, 14, 1, '#7a4f26')
  P(g, 2, 11, 2, 4, '#7a4f26')
  P(g, 12, 11, 2, 4, '#7a4f26')
  P(g, 6, 2, 3, 3, '#e8e0d0')
  P(g, 7, 1, 1, 2, '#e04040')
})
T.CHAIR = def('chair', false, (g) => {
  P(g, 4, 3, 8, 3, '#8a5a30')
  P(g, 4, 6, 8, 5, '#a8703c')
  P(g, 4, 11, 2, 4, '#6a4420')
  P(g, 10, 11, 2, 4, '#6a4420')
})
T.BED = def('bed', true, (g) => {
  P(g, 1, 1, 14, 14, '#7a4f26')
  P(g, 2, 2, 12, 5, '#f4f0e8')
  P(g, 2, 7, 12, 7, '#4a74b8')
  P(g, 2, 7, 12, 1, '#6a94d8')
  P(g, 3, 3, 4, 3, '#ffffff')
})
T.SHELF = def('shelf', true, (g) => {
  P(g, 0, 0, 16, 16, '#8a5a30')
  P(g, 1, 1, 14, 6, '#5a3a1c')
  P(g, 1, 9, 14, 6, '#5a3a1c')
  const cs = ['#c04040', '#4070c0', '#40a060', '#d0a030', '#a050b0']
  for (let i = 0; i < 6; i++) {
    P(g, 2 + i * 2, 2, 2, 5, cs[i % 5])
    P(g, 2 + i * 2, 10, 2, 5, cs[(i + 2) % 5])
  }
  P(g, 0, 7, 16, 2, '#a8703c')
})
T.COUNTER = def('counter', true, (g) => {
  P(g, 0, 3, 16, 12, '#a8703c')
  P(g, 0, 3, 16, 3, '#d89a50')
  P(g, 0, 6, 16, 1, '#7a4f26')
  P(g, 0, 14, 16, 1, '#5a3a1c')
  P(g, 5, 0, 3, 4, '#d8e8f0')
  P(g, 11, 1, 2, 3, '#e0a030')
})
T.STATUE = def('statue', true, (g) => {
  P(g, 3, 11, 10, 4, '#8a8a96')
  P(g, 5, 4, 6, 8, '#b4b4c0')
  P(g, 6, 1, 4, 4, '#c8c8d4')
  P(g, 11, 3, 1, 8, '#9aa0b0')
  P(g, 3, 14, 10, 1, '#5e5e6a')
})
T.TORCH = def('torch', true, (g, _v, f) => {
  P(g, 0, 0, 16, 16, '#3a3548')
  P(g, 7, 6, 2, 8, '#6b4423')
  const c = ['#ffb030', '#ff8a20', '#ffd060', '#ff9a30'][f % 4]
  P(g, 6, 2 + (f % 2), 4, 4, c)
  P(g, 7, 1 + (f % 2), 2, 2, '#ffe890')
}, { frames: 4 })
T.CAMPFIRE = def('campfire', true, (g, _v, f) => {
  P(g, 1, 12, 14, 3, 'rgba(0,0,0,0.28)')
  const st = ['#9a9aa6', '#7a7a88', '#b4b4c0']
  P(g, 1, 11, 3, 3, st[1])
  P(g, 1, 11, 3, 1, st[2])
  P(g, 4, 12, 3, 3, st[0])
  P(g, 4, 12, 3, 1, st[2])
  P(g, 9, 12, 3, 3, st[1])
  P(g, 9, 12, 3, 1, st[2])
  P(g, 12, 11, 3, 3, st[0])
  P(g, 12, 11, 3, 1, st[2])
  P(g, 3, 9, 10, 2, '#6b4423')
  P(g, 3, 9, 10, 1, '#8a5a30')
  P(g, 3, 9, 2, 2, '#3a2a1c')
  P(g, 11, 9, 2, 2, '#3a2a1c')
  const h = [6, 8, 7, 9][f % 4]
  P(g, 4, 10 - h + 3, 8, h - 2, '#e8561c')
  P(g, 5, 10 - h + 1, 6, h, '#ff7a20')
  P(g, 6, 10 - h, 4, h, '#ffb030')
  P(g, 7, 10 - h + 3, 2, h - 3, '#ffe890')
  P(g, f % 2 ? 6 : 8, 10 - h - 2, 2, 2, '#ff7a20')
  P(g, 7, 10 - h - 3 + (f % 2), 1, 1, '#ffd060')
  P(g, 3 + f * 3, 1 + ((f * 5) % 3), 1, 1, '#ffd060')
  P(g, 12 - f * 2, 3 + (f % 2), 1, 1, '#ff9a30')
  P(g, 4, 10, 8, 1, '#ffb030')
  P(g, 4, 11, 8, 1, '#8a5a30')
}, { frames: 4 })
T.PILLAR = def('pillar', true, (g) => {
  P(g, 4, 0, 8, 31, '#eae6d6')
  P(g, 4, 0, 2, 31, '#fffaf0')
  P(g, 10, 0, 2, 31, '#c9c2a8')
  P(g, 2, 0, 12, 3, '#d8cfae')
  P(g, 2, 28, 12, 3, '#d8cfae')
  for (let y = 5; y < 26; y += 5) P(g, 6, y, 4, 1, '#d8cfae')
}, { tall: true })
T.CRYSTAL = def('crystal', true, (g, _v, f) => {
  const c = f % 2 ? '#a0e4ff' : '#7ad0f4'
  P(g, 6, 8, 4, 22, c)
  P(g, 4, 14, 3, 14, '#5ab4e0')
  P(g, 9, 12, 3, 16, '#8adcfc')
  P(g, 7, 4, 2, 5, '#c8f0ff')
  P(g, 7, 8, 1, 18, '#e0f8ff')
}, { tall: true, frames: 2 })
T.BUSH = def('bush', true, (g) => {
  P(g, 2, 5, 12, 10, '#3f9a45')
  P(g, 4, 3, 8, 3, '#3f9a45')
  P(g, 3, 6, 5, 4, '#62b858')
  P(g, 2, 13, 12, 2, '#2f7a35')
  P(g, 10, 8, 2, 2, '#e06a5a')
})
T.GOLD = def('gold', true, (g, v) => {
  P(g, 1, 8, 14, 7, '#c8941a')
  P(g, 3, 4, 10, 5, '#e0b030')
  P(g, 5, 2, 6, 3, '#f4cc48')
  for (let i = 0; i < 8; i++) {
    const x = 1 + Math.floor(rnd(v, i, 61) * 13)
    const y = 3 + Math.floor(rnd(i, v, 62) * 11)
    P(g, x, y, 1, 1, i % 3 ? '#fff4a0' : '#d84a4a')
  }
  P(g, 1, 14, 14, 1, '#8a6410')
})
T.ALTAR = def('altar', true, (g) => {
  P(g, 1, 6, 14, 9, '#8a8a96')
  P(g, 0, 4, 16, 3, '#b4b4c0')
  P(g, 6, 0, 4, 5, '#d8d8e4')
  P(g, 7, 0, 2, 2, '#ff8a30')
  P(g, 2, 9, 12, 1, '#6a6a76')
})
T.SWORDDOOR = def('sworddoor', true, (g) => {
  P(g, 0, 0, 16, 16, '#6a8cae')
  P(g, 1, 0, 14, 16, '#4a6a8c')
  P(g, 3, 2, 10, 14, '#2e4560')
  P(g, 7, 2, 1, 14, '#1c2c40')
  P(g, 2, 7, 12, 2, '#1c1c24')
  P(g, 12, 6, 2, 4, '#3a3a48')
  P(g, 2, 7, 12, 1, '#4a4a5c')
})
T.PORTAL = def('portal', false, (g, _v, f) => {
  P(g, 0, 0, 16, 16, '#4a4658')
  const c = ['#7ad0ff', '#a0e4ff', '#5ab4ff', '#c8f0ff'][f % 4]
  P(g, 3, 3, 10, 10, '#2a2a5a')
  P(g, 2, 5, 12, 6, c)
  P(g, 5, 2, 6, 12, c)
  P(g, 5, 5, 6, 6, '#e8f8ff')
  P(g, 7, 7, 2, 2, '#ffffff')
}, { frames: 4 })
T.STAIRS = def('stairs', false, (g) => {
  P(g, 0, 0, 16, 16, '#5a5568')
  for (let i = 0; i < 4; i++) {
    P(g, 0, i * 4, 16, 3, '#2e2a38')
    P(g, 0, i * 4 + 3, 16, 1, '#7a758a')
  }
})
T.DOOR = def('door', false, (g) => {
  P(g, 0, 0, 16, 16, '#d8c8a8')
  P(g, 2, 1, 12, 15, '#6a4422')
  P(g, 3, 2, 10, 14, '#8a5a30')
  P(g, 3, 2, 10, 1, '#a8743c')
  P(g, 7, 2, 1, 14, '#6a4422')
  P(g, 11, 9, 2, 2, '#f0c040')
})
T.WALL = def('wall', true, (g) => {
  P(g, 0, 0, 16, 16, '#e8d8b8')
  P(g, 0, 15, 16, 1, '#a89870')
  for (let x = 0; x < 16; x += 8) P(g, x, 0, 1, 15, '#d4c4a0')
  P(g, 0, 0, 16, 1, '#f4e8cc')
})
T.WINDOW = def('window', true, (g) => {
  P(g, 0, 0, 16, 16, '#e8d8b8')
  P(g, 0, 15, 16, 1, '#a89870')
  P(g, 3, 3, 10, 9, '#6a4422')
  P(g, 4, 4, 8, 7, '#8fd0f0')
  P(g, 4, 4, 3, 3, '#d0f0ff')
  P(g, 7, 4, 1, 7, '#6a4422')
  P(g, 4, 7, 8, 1, '#6a4422')
})
T.INWALL = def('inwall', true, (g, v) => {
  P(g, 0, 0, 16, 16, '#8a5a3a')
  P(g, 0, 0, 16, 11, '#d8c4a0')
  P(g, 0, 11, 16, 1, '#6a4422')
  P(g, 0, 12, 16, 4, '#8a5a3a')
  P(g, 0, 15, 16, 1, '#5a3a1c')
  if (v % 4 === 0) P(g, 0, 5, 16, 1, '#c8b48c')
})
T.ICEBRICK = def('icebrick', true, (g) => {
  P(g, 0, 0, 16, 16, '#9ac8e8')
  for (let y = 0; y < 16; y += 4) {
    P(g, 0, y + 3, 16, 1, '#6aa0c8')
    const o = (y / 4) % 2 ? 4 : 0
    P(g, o, y, 1, 3, '#6aa0c8')
    P(g, o + 8, y, 1, 3, '#6aa0c8')
  }
  P(g, 0, 0, 16, 1, '#d8f0fc')
})

// 树屋酒吧：银叶巨树（树冠 3x3 部件 + 树干）
export const TH_CANOPY: number[] = []
for (let part = 0; part < 9; part++) {
  TH_CANOPY.push(def(`tcanopy${part}`, true, (g, v) => {
    const r = Math.floor(part / 3), c = part % 3
    P(g, 0, 0, 16, 16, '#5e9482')
    speckle(g, v, ['#4f8070', '#74a896', '#456f62'], 18, 31)
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(rnd(v, i, 41) * 12), y = 3 + Math.floor(rnd(i, v, 42) * 9)
      P(g, x, y, 3, 2, '#86b8a6')
      P(g, x, y + 2, 3, 1, '#3f6a5e')
    }
    if (r === 0) {
      for (let x = 0; x < 16; x++) P(g, x, 0, 1, 3 + (rnd(x, v, 43) > 0.5 ? 1 : 0), '#f4f8fc')
      P(g, 0, 4, 16, 1, '#cfe0ec')
    }
    if (r === 2) {
      P(g, 0, 12, 16, 4, '#3f6a5e')
      P(g, 0, 15, 16, 1, '#2f5248')
      for (let x = 1; x < 16; x += 3) P(g, x, 11, 1, 1, '#3f6a5e')
    }
    if (c === 0) P(g, 0, 0, 2, 16, '#3f6a5e')
    if (c === 2) P(g, 14, 0, 2, 16, '#3f6a5e')
    const cut = [9, 7, 6, 5, 4, 3, 3, 2, 2, 1, 1]
    for (let i = 0; i < cut.length; i++) {
      const w = cut[i]
      const y = r === 0 ? i : 15 - i
      if (r !== 1 && c === 0) g.clearRect(0, y, w, 1)
      if (r !== 1 && c === 2) g.clearRect(16 - w, y, w, 1)
    }
  }))
}
const trunkTile = (name: string, kind: 'L' | 'C' | 'R' | 'WIN' | 'DOOR', base: boolean) =>
  def(name, true, (g, v) => {
    P(g, 0, 0, 16, 16, '#7a5638')
    P(g, 3, 0, 1, 16, '#5e3f28')
    P(g, 8, 0, 1, 16, '#5e3f28')
    P(g, 12, 0, 1, 16, '#926a46')
    speckle(g, v, ['#5e3f28', '#926a46'], 6, 51)
    if (kind === 'L') P(g, 0, 0, 3, 16, '#4a3020')
    if (kind === 'R') P(g, 13, 0, 3, 16, '#4a3020')
    if (kind === 'WIN') {
      P(g, 2, 13, 12, 2, '#a8794a')
      P(g, 3, 2, 10, 11, '#4a3020')
      P(g, 4, 3, 8, 9, '#f6d878')
      P(g, 4, 3, 8, 2, '#ffe9a0')
      P(g, 7, 3, 1, 9, '#4a3020')
      P(g, 4, 7, 8, 1, '#4a3020')
    }
    if (kind === 'DOOR') {
      P(g, 1, 0, 14, 16, '#3a2414')
      P(g, 3, 2, 10, 14, '#8a5a30')
      P(g, 3, 2, 10, 1, '#a8743c')
      P(g, 7, 2, 1, 14, '#5e3a1c')
      P(g, 11, 9, 2, 2, '#f0c040')
    }
    if (base) P(g, 0, 14, 16, 2, '#4a3020')
  })
export const TH_TRUNK = {
  L: trunkTile('trunkL', 'L', false), C: trunkTile('trunkC', 'C', false), R: trunkTile('trunkR', 'R', false),
  WIN: trunkTile('trunkWin', 'WIN', false), DOOR: trunkTile('trunkDoor', 'DOOR', true),
  BL: trunkTile('trunkBL', 'L', true), BC: trunkTile('trunkBC', 'C', true), BR: trunkTile('trunkBR', 'R', true),
}

// 屋顶：6 种颜色 × 6 个部位（上排左/中/右、下排左/中/右）
const ROOF_COLORS: [string, string, string][] = [
  ['#c4543c', '#e0705a', '#8a3424'],
  ['#4a74b8', '#6a94d8', '#2e4e84'],
  ['#8a5a3a', '#a8744a', '#5e3a22'],
  ['#e6edf5', '#ffffff', '#b8c8dc'],
  ['#4f8f55', '#6fb078', '#336a3a'],
  ['#7f8794', '#a0a8b4', '#585f6c'],
]
export const ROOFS: number[][] = ROOF_COLORS.map(([b, l, d], ci) => {
  const ids: number[] = []
  for (let part = 0; part < 6; part++) {
    ids.push(def(`roof${ci}_${part}`, true, (g) => {
      P(g, 0, 0, 16, 16, b)
      const bottom = part >= 3
      const edge = part % 3
      for (let y = 0; y < 16; y += 4) {
        P(g, 0, y + 3, 16, 1, d)
        const o = (y / 4) % 2 ? 4 : 0
        P(g, o + 3, y, 1, 3, d)
        P(g, o + 11, y, 1, 3, d)
        P(g, 0, y, 16, 1, l)
      }
      if (!bottom) P(g, 0, 0, 16, 2, l)
      if (bottom) {
        P(g, 0, 13, 16, 3, d)
        P(g, 0, 13, 16, 1, '#3a2a20')
      }
      if (edge === 0) P(g, 0, 0, 1, 16, d)
      if (edge === 2) P(g, 15, 0, 1, 16, d)
    }))
  }
  return ids
})

export const ROOF_PART = { TL: 0, T: 1, TR: 2, BL: 3, B: 4, BR: 5 }

const tileCache = new Map<string, HTMLCanvasElement>()
export function tileCanvas(id: number, v: number, f: number): HTMLCanvasElement {
  const d = TILES[id]
  const ff = f % d.frames
  const key = `${id}:${v}:${ff}`
  let c = tileCache.get(key)
  if (!c) {
    c = mk(16, d.tall ? 32 : 16)
    const g = c.getContext('2d')!
    d.draw(g, v, ff)
    tileCache.set(key, c)
  }
  return c
}

// ───────────────────────── 角色 ─────────────────────────
export interface Look {
  hair: string
  skin?: string
  top: string
  bot?: string
  accent?: string
  style?: 'short' | 'long' | 'spike' | 'bald' | 'hood' | 'hat' | 'crown' | 'tie' | 'helm'
  cape?: string
  beard?: string
  armor?: boolean
  scale?: number
}

const OUT = [0x33, 0x22, 0x1e]
function outline(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!
  const w = c.width, h = c.height
  const src = g.getImageData(0, 0, w, h)
  const dst = g.createImageData(w, h)
  dst.data.set(src.data)
  const a = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src.data[(y * w + x) * 4 + 3])
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (a(x, y) === 0 && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) {
        const i = (y * w + x) * 4
        dst.data[i] = OUT[0]
        dst.data[i + 1] = OUT[1]
        dst.data[i + 2] = OUT[2]
        dst.data[i + 3] = 255
      }
    }
  }
  g.putImageData(dst, 0, 0)
}

const charCache = new Map<string, HTMLCanvasElement>()
export function charCanvas(look: Look, dir: Dir, frame: number): HTMLCanvasElement {
  const key = JSON.stringify(look) + dir + frame
  const hit = charCache.get(key)
  if (hit) return hit
  const mirror = dir === RIGHT
  const c = mk(18, 22)
  const g = c.getContext('2d')!
  const ox = 1, oy = 2
  const R = (x: number, y: number, w: number, h: number, col: string) => P(g, ox + x, oy + y, w, h, col)
  const skin = look.skin ?? '#f4cba3'
  const skinD = '#d9a47c'
  const bot = look.bot ?? '#5a4a3a'
  const acc = look.accent ?? '#e0b64a'
  const side = dir === LEFT || dir === RIGHT
  const back = dir === UP
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0
  const style = look.style ?? 'short'

  // 披风（背后）
  if (look.cape && (back || side)) R(back ? 3 : 8, 9, back ? 10 : 5, 9, look.cape)
  // 腿
  if (side) {
    R(5, 15 + (step > 0 ? 0 : 0), 3, 4 - (step > 0 ? 1 : 0), bot)
    R(8, 15, 3, 4 - (step < 0 ? 1 : 0), bot)
    R(5, 18 - (step > 0 ? 1 : 0), 3, 1, '#3a2a22')
    R(8, 18 - (step < 0 ? 1 : 0), 3, 1, '#3a2a22')
  } else {
    R(5, 15, 3, 4 - (step > 0 ? 1 : 0), bot)
    R(8, 15, 3, 4 - (step < 0 ? 1 : 0), bot)
    R(5, 18 - (step > 0 ? 1 : 0), 3, 1, '#3a2a22')
    R(8, 18 - (step < 0 ? 1 : 0), 3, 1, '#3a2a22')
  }
  // 身体
  const bw = side ? 6 : 8
  const bx = side ? 5 : 4
  R(bx, 9, bw, 6, look.top)
  R(bx, 9, bw, 1, acc === look.top ? '#ffffff55' : acc)
  R(bx, 14, bw, 1, acc)
  if (look.armor) {
    R(bx - (side ? 0 : 1), 9, 2, 2, '#c8ccd8')
    R(bx + bw - (side ? 2 : 1), 9, 2, 2, '#c8ccd8')
    R(bx + 1, 10, bw - 2, 3, '#aab0c0')
    R(bx + 2, 10, 1, 3, '#d8dce8')
  }
  // 手臂
  if (side) {
    R(6 + (step === 1 ? 1 : 0), 10, 3, 4, look.top)
    R(6 + (step === 1 ? 1 : 0), 13, 3, 2, skin)
  } else {
    R(3, 10, 1, 4, look.top)
    R(12, 10, 1, 4, look.top)
    R(3, 13 - step, 1, 2, skin)
    R(12, 13 + step, 1, 2, skin)
  }
  if (look.cape && dir === DOWN) {
    R(3, 9, 1, 8, look.cape)
    R(12, 9, 1, 8, look.cape)
  }
  // 头
  R(4, 2, 8, 7, skin)
  R(4, 8, 8, 1, skinD)
  if (dir === DOWN) {
    R(5, 6, 2, 2, '#2a1f1a')
    R(9, 6, 2, 2, '#2a1f1a')
    R(5, 6, 1, 1, '#ffffff')
    R(9, 6, 1, 1, '#ffffff')
    R(4, 7, 1, 1, '#f0a090')
    R(11, 7, 1, 1, '#f0a090')
    if (look.beard) R(5, 8, 6, 2, look.beard)
  } else if (side) {
    R(5, 6, 2, 2, '#2a1f1a')
    R(5, 6, 1, 1, '#ffffff')
    if (look.beard) R(4, 8, 4, 2, look.beard)
  }
  // 头发
  const h = look.hair
  if (back) {
    R(4, 1, 8, 8, h)
    R(5, 0, 6, 1, h)
  } else {
    R(4, 1, 8, 3, h)
    R(5, 0, 6, 1, h)
    if (side) {
      R(8, 1, 4, 8, h)
      R(4, 1, 2, 4, h)
    } else {
      R(4, 3, 1, 3, h)
      R(11, 3, 1, 3, h)
      R(5, 3, 3, 1, h)
      R(9, 3, 2, 1, h)
    }
  }
  if (style === 'long') {
    if (side) R(8, 4, 4, 9, h)
    else {
      R(3, 3, 2, 9, h)
      R(11, 3, 2, 9, h)
    }
    if (back) R(3, 8, 10, 5, h)
  } else if (style === 'spike') {
    R(4, 0, 2, 1, h)
    R(7, -1, 2, 2, h)
    R(10, 0, 2, 1, h)
  } else if (style === 'bald') {
    R(4, 1, 8, 2, skin)
    R(5, 0, 6, 1, skin)
    if (back) R(4, 1, 8, 8, skin)
  } else if (style === 'hood') {
    R(3, 1, 10, 4, acc)
    R(4, 0, 8, 1, acc)
    R(3, 5, 1, 6, acc)
    R(12, 5, 1, 6, acc)
    if (back) R(3, 1, 10, 10, acc)
  } else if (style === 'hat') {
    R(2, 3, 12, 1, acc)
    R(5, -1, 6, 4, acc)
    R(6, -2, 4, 1, acc)
  } else if (style === 'crown') {
    R(4, -1, 8, 2, '#f4cc48')
    R(4, -2, 1, 1, '#f4cc48')
    R(7, -2, 2, 1, '#f4cc48')
    R(11, -2, 1, 1, '#f4cc48')
  } else if (style === 'helm') {
    R(3, 0, 10, 5, '#aab0c0')
    R(4, -1, 8, 1, '#c8ccd8')
    R(5, 0, 2, 3, '#d8dce8')
    if (!back) R(5, 5, 6, 1, '#6a7080')
  }
  if (look.beard && back) R(4, 6, 8, 3, h)
  outline(c)
  let out = c
  if (mirror) {
    out = mk(18, 22)
    const og = out.getContext('2d')!
    og.translate(18, 0)
    og.scale(-1, 1)
    og.drawImage(c, 0, 0)
  }
  charCache.set(key, out)
  return out
}

// ───────────────────────── 怪物/幻兽 ─────────────────────────
export type Creature = 'chick' | 'wolf' | 'bear' | 'bat' | 'ghost' | 'dragon' | 'dragon2' | 'lizard' | 'golem' | 'beast' | 'rider'
const creatureCache = new Map<string, HTMLCanvasElement>()
export function creatureCanvas(kind: Creature, col: string, frame = 0): HTMLCanvasElement {
  const key = `${kind}${col}${frame}`
  const hit = creatureCache.get(key)
  if (hit) return hit
  const big = kind === 'dragon2' || kind === 'rider'
  const c = mk(big ? 34 : 26, big ? 30 : 24)
  const g = c.getContext('2d')!
  const R = (x: number, y: number, w: number, h: number, cc: string) => P(g, x + 1, y + 1, w, h, cc)
  const shade = (cc: string, k: number) => {
    const n = parseInt(cc.slice(1), 16)
    const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`
  }
  const dk = shade(col, 0.7)
  const lt = shade(col, 1.25)
  const b = frame % 2
  if (kind === 'chick') {
    R(7, 9, 10, 9, '#f6d84a')
    R(9, 5, 7, 6, '#f6d84a')
    R(7, 12, 4, 4, '#e8c030')
    R(15, 7, 3, 2, '#e88a2a')
    R(12, 7, 1, 2, '#222')
    R(9, 18, 2, 3, '#e88a2a')
    R(13, 18, 2, 3, '#e88a2a')
  } else if (kind === 'wolf') {
    R(4, 9, 14, 8, col)
    R(4, 9, 14, 2, lt)
    R(2, 6, 7, 7, col)
    R(0, 10, 3, 3, lt)
    R(1, 10, 1, 1, '#222')
    R(3, 3, 2, 4, dk)
    R(7, 3, 2, 4, dk)
    R(4, 8, 2, 1, '#e04040')
    R(17, 8, 5, 3, col)
    R(21, 6 + b, 2, 3, lt)
    R(5, 17, 2, 5 - b, dk)
    R(9, 17, 2, 5, dk)
    R(13, 17, 2, 5 - b, dk)
    R(16, 17, 2, 5, dk)
    R(3, 11, 1, 1, '#fff')
    R(2, 12, 3, 1, '#fff')
  } else if (kind === 'bear') {
    R(3, 5, 17, 15, col)
    R(3, 5, 17, 3, lt)
    R(5, 1, 5, 4, col)
    R(14, 1, 5, 4, col)
    R(6, 2, 2, 2, dk)
    R(15, 2, 2, 2, dk)
    R(7, 9, 9, 5, lt)
    R(8, 8, 2, 2, '#222')
    R(13, 8, 2, 2, '#222')
    R(10, 11, 3, 3, '#222')
    R(1, 12, 4, 8, dk)
    R(18, 12, 4, 8, dk)
    R(5, 19, 5, 3, dk)
    R(13, 19, 5, 3, dk)
    R(8, 15, 7, 1, '#e04040')
  } else if (kind === 'bat') {
    const w = b ? 4 : 0
    R(9, 8, 6, 8, dk)
    R(2, 6 + w / 2, 7, 5 - w / 2, col)
    R(15, 6 + w / 2, 7, 5 - w / 2, col)
    R(0, 8, 3, 4, dk)
    R(21, 8, 3, 4, dk)
    R(9, 3, 6, 6, col)
    R(9, 1, 2, 3, dk)
    R(13, 1, 2, 3, dk)
    R(10, 5, 1, 1, '#ff4040')
    R(13, 5, 1, 1, '#ff4040')
  } else if (kind === 'ghost') {
    R(5, 3, 14, 15, col)
    R(7, 1, 10, 3, col)
    R(5, 18, 3, 3, col)
    R(10, 18, 4, 4 - b, col)
    R(16, 18, 3, 3, col)
    R(5, 3, 3, 8, lt)
    R(8, 8, 3, 3, '#223')
    R(14, 8, 3, 3, '#223')
    R(10, 13, 5, 2, '#223')
    R(9, 8, 1, 1, '#9ff')
    R(15, 8, 1, 1, '#9ff')
  } else if (kind === 'dragon') {
    // 小龙：圆润可爱
    R(5, 8, 14, 11, col)
    R(8, 11, 8, 8, '#e8f4d8')
    R(6, 2, 12, 9, col)
    R(6, 2, 12, 2, lt)
    R(6, 0, 2, 3, '#f4e8a0')
    R(16, 0, 2, 3, '#f4e8a0')
    R(8, 6, 2, 3, '#222')
    R(14, 6, 2, 3, '#222')
    R(8, 6, 1, 1, '#fff')
    R(14, 6, 1, 1, '#fff')
    R(10, 9, 4, 1, dk)
    R(0, 7 - b, 6, 6, dk)
    R(18, 7 - b, 6, 6, dk)
    R(1, 6 - b, 3, 2, lt)
    R(20, 6 - b, 3, 2, lt)
    R(6, 19, 4, 3, dk)
    R(14, 19, 4, 3, dk)
    R(19, 15, 4, 2, col)
    R(22, 13, 2, 3, lt)
  } else if (kind === 'dragon2' || kind === 'rider') {
    R(7, 12, 18, 12, col)
    R(7, 12, 18, 3, lt)
    R(10, 17, 12, 7, '#e8d8a8')
    R(9, 2, 14, 11, col)
    R(9, 2, 14, 2, lt)
    R(8, 0, 3, 4, '#f4e8a0')
    R(21, 0, 3, 4, '#f4e8a0')
    R(11, 7, 3, 3, '#ffcc30')
    R(18, 7, 3, 3, '#ffcc30')
    R(12, 8, 1, 2, '#222')
    R(19, 8, 1, 2, '#222')
    R(12, 11, 8, 2, dk)
    R(0, 8 - b * 2, 8, 10, dk)
    R(24, 8 - b * 2, 8, 10, dk)
    R(2, 6 - b * 2, 4, 3, lt)
    R(26, 6 - b * 2, 4, 3, lt)
    R(8, 24, 5, 4, dk)
    R(19, 24, 5, 4, dk)
    R(24, 20, 7, 3, col)
    if (kind === 'rider') {
      R(14, 0, 4, 5, '#2a2a3a')
      R(14, -1, 4, 2, '#c8ccd8')
      R(13, 4, 6, 5, '#3a3a52')
    }
  } else if (kind === 'lizard') {
    R(3, 9, 16, 7, col)
    R(3, 9, 16, 2, lt)
    R(0, 8, 6, 6, col)
    R(1, 9, 1, 1, '#222')
    R(18, 11, 6, 3, dk)
    R(22, 13, 2, 2, dk)
    R(4, 16, 2, 4, dk)
    R(9, 16, 2, 5 - b, dk)
    R(14, 16, 2, 5, dk)
    for (let i = 0; i < 4; i++) R(6 + i * 3, 7, 2, 2, dk)
  } else if (kind === 'golem') {
    R(5, 5, 14, 13, col)
    R(5, 5, 14, 3, lt)
    R(1, 7, 5, 10, dk)
    R(18, 7, 5, 10, dk)
    R(7, 0, 10, 6, col)
    R(9, 2, 2, 2, '#ffcc30')
    R(13, 2, 2, 2, '#ffcc30')
    R(6, 18, 5, 4, dk)
    R(13, 18, 5, 4, dk)
    R(9, 9, 6, 1, '#ff8a20')
    R(11, 9, 2, 6, '#ff8a20')
  } else {
    // beast：通用兽
    R(4, 8, 16, 10, col)
    R(2, 4, 8, 8, col)
    R(3, 2, 2, 3, dk)
    R(8, 2, 2, 3, dk)
    R(3, 7, 2, 2, '#222')
    R(5, 18, 3, 4, dk)
    R(15, 18, 3, 4, dk)
    R(20, 9, 4, 3, dk)
  }
  outline(c)
  creatureCache.set(key, c)
  return c
}

// 通用物品图标（道具栏用）可忽略，保持 UI 为文字
