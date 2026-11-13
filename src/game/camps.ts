import { MAP_LIST, ANCH } from './maps'
import { NPC_LIST, TRIG_LIST } from './storyKit'
import { TILES, T } from './sprites'
import type { Step } from './types'

// 每张地图的篝火：既是休息点，也是败北后的复活点
export interface Camp {
  x: number
  y: number
  rx: number
  ry: number
}
export const CAMPS: Record<string, Camp> = {}

const BAD_GROUND = new Set(['water', 'lava', 'bridge', 'door', 'stairs', 'portal'])

export function buildCamps() {
  const mark: Record<string, [number, number][]> = {}
  const add = (map: string, x: number, y: number) => {
    ;(mark[map] ??= []).push([x, y])
  }
  const arrivals: Record<string, [number, number][]> = {}
  const arrive = (map: string, x: number, y: number) => {
    ;(arrivals[map] ??= []).push([x, y])
    add(map, x, y)
  }
  const walk = (steps: Step[] | undefined, map: string) => {
    if (!steps) return
    for (const s of steps) {
      if (s.t === 'warp') arrive(s.map, s.x, s.y)
      else if ((s.t === 'show' || s.t === 'place') && s.x !== undefined && s.y !== undefined) add(map, s.x, s.y)
      else if (s.t === 'battle') {
        walk(s.o.win, map)
        walk(s.o.lose, map)
      } else if (s.t === 'choice') s.opts.forEach((o) => walk(o.steps, map))
      else if (s.t === 'if') {
        walk(s.then, map)
        walk(s.else, map)
      }
    }
  }
  for (const t of TRIG_LIST) {
    walk(t.run, t.map)
    for (let j = -1; j <= (t.h ?? 1); j++) for (let i = -1; i <= (t.w ?? 1); i++) add(t.map, t.x + i, t.y + j)
  }
  for (const n of NPC_LIST) {
    add(n.map, n.x, n.y)
    if (Array.isArray(n.talk)) walk(n.talk, n.map)
    else if (typeof n.talk === 'function') for (const f of [0, 5, 10, 20]) walk(n.talk({ ch: f }), n.map)
  }
  for (const [id, m] of Object.entries(MAP_LIST)) {
    for (const w of m.warps) {
      arrive(w.to, w.tx, w.ty)
      add(id, w.x, w.y)
    }
  }
  for (const [id, a] of Object.entries(ANCH)) if (a.start) arrivals[id] = [a.start, ...(arrivals[id] ?? [])]
  arrivals.hake = [[11, 14], ...(arrivals.hake ?? [])]

  for (const [id, m] of Object.entries(MAP_LIST)) {
    const solid = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true
      const i = y * m.w + x
      if (TILES[m.g[i]].solid) return true
      const o = m.o[i]
      return o >= 0 && TILES[o].solid
    }
    const taken = new Set<number>()
    for (const [x, y] of mark[id] ?? []) taken.add(y * m.w + x)
    for (const w of m.warps) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) taken.add((w.y + j) * m.w + w.x + i)
    const open = (x: number, y: number) => {
      let n = 0
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && !solid(x + i, y + j)) n++
      return n
    }
    const okTile = (x: number, y: number, need: number) => {
      const i = y * m.w + x
      if (solid(x, y) || m.o[i] >= 0 || taken.has(i) || BAD_GROUND.has(TILES[m.g[i]].name)) return false
      for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) if (taken.has((y + j) * m.w + x + k) && Math.abs(j) + Math.abs(k) <= 1 && (j || k)) return false
      return open(x, y) >= need
    }
    const starts = arrivals[id] ?? []
    const [sx, sy] = starts[0] ?? [Math.floor(m.w / 2), Math.floor(m.h / 2)]
    let pick: [number, number] | null = null
    for (const need of [8, 7, 6, 5, 4]) {
      const seen = new Set<number>([sy * m.w + sx])
      let q: [number, number][] = [[sx, sy]]
      for (let d = 0; d <= 14 && !pick; d++) {
        const next: [number, number][] = []
        for (const [x, y] of q) {
          if (d >= 3 && okTile(x, y, need)) {
            pick = [x, y]
            break
          }
          for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
            const nx = x + dx, ny = y + dy
            if (seen.has(ny * m.w + nx) || solid(nx, ny)) continue
            seen.add(ny * m.w + nx)
            next.push([nx, ny])
          }
        }
        q = next
      }
      if (pick) break
    }
    if (!pick) continue
    const [fx, fy] = pick
    m.o[fy * m.w + fx] = T.CAMPFIRE
    const cand: [number, number][] = [[fx, fy + 1], [fx + 1, fy], [fx - 1, fy], [fx, fy - 1]]
    const r = cand.find(([x, y]) => !solid(x, y) && !BAD_GROUND.has(TILES[m.g[y * m.w + x]].name)) ?? cand[0]
    CAMPS[id] = { x: fx, y: fy, rx: r[0], ry: r[1] }
  }
}
