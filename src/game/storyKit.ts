import type { Cond, Flags, NpcDef, Step, Trigger } from './types'
import type { Dir } from './sprites'
import { ANCH } from './maps'

export const NPC_LIST: NpcDef[] = []
export const TRIG_LIST: Trigger[] = []
export const SIGN_MAP: Record<string, string[]> = {}

// 对话脚本：每行「谁：内容」；以 ※ 开头或不含「：」的为旁白
export const D = (src: string): Step[] =>
  src
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l): Step => {
      if (l.startsWith('※')) return { t: 'narr', text: l.slice(1) }
      const i = l.indexOf('：')
      if (i < 0) return { t: 'narr', text: l }
      return { t: 'say', who: l.slice(0, i), text: l.slice(i + 1) }
    })

export const set = (flag: string, v = 1): Step => ({ t: 'set', flag, v })
export const ch = (n: number): Step => ({ t: 'set', flag: 'ch', v: n })
export const obj = (text: string): Step => ({ t: 'obj', text })
export const warp = (map: string, x: number, y: number, dir?: Dir): Step => ({ t: 'warp', map, x, y, dir })
export const mv = (who: string, path: string): Step => ({ t: 'move', who, path })
export const face = (who: string, dir: Dir): Step => ({ t: 'face', who, dir })
export const show = (id: string, x?: number, y?: number): Step => ({ t: 'show', id, x, y })
export const hide = (id: string): Step => ({ t: 'hide', id })
export const place = (id: string, x: number, y: number, dir?: Dir): Step => ({ t: 'place', id, x, y, dir })
export const card = (text: string[], title?: string): Step => ({ t: 'card', text, title })
export const chapter = (title: string, sub: string, text: string[] = []): Step => ({ t: 'chapter', title, sub, text })
export const join = (id: string): Step => ({ t: 'join', id })
export const leave = (id: string): Step => ({ t: 'leave', id })
export const wait = (ms: number): Step => ({ t: 'wait', ms })
export const give = (item: string, n = 1): Step => ({ t: 'give', item, n })
export const gold = (n: number): Step => ({ t: 'gold', n })
export const battle = (enemies: string[], o: { win?: Step[]; lose?: Step[]; noLose?: boolean; rounds?: number; noRun?: boolean; bg?: 'snow' | 'cave' | 'grass' | 'fire' | 'sky' | 'sand' | 'hall'; title?: string } = {}): Step => ({ t: 'battle', o: { noLose: true, enemies, ...o } })
export const save: Step = { t: 'save' }
export const heal: Step = { t: 'heal' }
export const shake: Step = { t: 'shake' }
export const flash: Step = { t: 'flash' }
export const fadeOut: Step = { t: 'fade', to: 1 }
export const fadeIn: Step = { t: 'fade', to: 0 }
export const timing = (title: string, hits: number, speed = 1): Step => ({ t: 'timing', title, hits, speed })
export const choice = (...opts: [string, Step[]][]): Step => ({ t: 'choice', opts: opts.map(([label, steps]) => ({ label, steps })) })
export const ifs = (c: Cond, then: Step[], els?: Step[]): Step => ({ t: 'if', c, then, else: els })
export const learn = (who: string, skill: string): Step => ({ t: 'learn', who, skill })
export const toast = (text: string): Step => ({ t: 'toast', text })

export const npc = (def: NpcDef) => {
  NPC_LIST.push(def)
}
export const when = (n: number): Cond => (f: Flags) => f.ch === n
export const from = (n: number): Cond => (f: Flags) => f.ch >= n

// 触发器：ch 精确匹配，且只触发一次
export const trig = (id: string, map: string, x: number, y: number, w: number, h: number, c: number | Cond, run: Step[]) => {
  const cond: Cond = typeof c === 'number' ? (f) => f.ch === c : c
  TRIG_LIST.push({ id, map, x, y, w, h, when: (f) => !f['d_' + id] && cond(f), run: [set('d_' + id), ...run] })
}
export const sign = (map: string, x: number, y: number, ...lines: string[]) => {
  SIGN_MAP[`${map}:${x},${y}`] = lines
}
export const A = (map: string, name: string): [number, number] => ANCH[map][name]
// 地牢出口附近触发区
export const nearEnd = (id: string, map: string, c: number | Cond, run: Step[]) => {
  const [ex, ey] = A(map, 'end')
  trig(id, map, ex - 2, ey, 5, 3, c, run)
}
export const nearStart = (id: string, map: string, c: number | Cond, run: Step[]) => {
  const [sx, sy] = A(map, 'start')
  trig(id, map, sx - 2, sy - 2, 5, 4, c, run)
}

import { PORTRAITS } from './data'
import type { Creature } from './sprites'
// 登场角色：默认隐藏，用 show 登场
export const cast = (map: string, id: string, name: string, x: number, y: number, o: { p?: string; cr?: [Creature, string]; scale?: number; dir?: Dir; line?: string; solid?: boolean } = {}) => {
  const p = PORTRAITS[o.p ?? name]
  npc({
    id, name, map, x, y, dir: o.dir, look: o.cr ? undefined : p?.look, creature: o.cr ? { kind: o.cr[0], col: o.cr[1] } : p?.creature, scale: o.scale,
    show: () => false, solid: o.solid,
    talk: D(`${name}：${o.line ?? '……'}`),
  })
}
export const lvl = (n: number): Step => ({ t: 'lvl', n })
export const escale = (v: number): Step => ({ t: 'set', flag: 'escale', v })
