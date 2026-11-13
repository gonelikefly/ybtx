import { MAP_LIST } from './maps'
import { NPCS, TRIGGERS, SIGNS, INTRO, CAMPS } from './story'
import { ACTORS, ENEMIES, ITEMS, SKILLS, PORTRAITS, expNeed } from './data'
import type { Portrait } from './data'
import { TS, TILES, T, tileCanvas, charCanvas, creatureCanvas, rnd, DOWN, LEFT, RIGHT, UP } from './sprites'
import type { Dir, Look, Creature } from './sprites'
import type { Actor, BattleOpts, EnemyTpl, Flags, MapDef, NpcDef, Step } from './types'

const DIRV: [number, number][] = [[0, 1], [-1, 0], [1, 0], [0, -1]]
const SAVE_KEY = 'yongbing_tianxia_save_v1'

export interface MenuItem {
  label: string
  sub?: string
  disabled?: boolean
}
export interface BEnemyView {
  uid: number
  name: string
  hp: number
  mhp: number
  img: string
  scale: number
  dead: boolean
}
export interface BPartyView {
  id: string
  name: string
  hp: number
  mhp: number
  mp: number
  mmp: number
  lv: number
  img: string
  acting: boolean
  dead: boolean
}
export interface Pop {
  id: number
  side: 'e' | 'p'
  idx: number
  text: string
  kind: 'dmg' | 'heal' | 'miss'
}
export interface BView {
  bg: string
  enemies: BEnemyView[]
  party: BPartyView[]
  log: string
  pops: Pop[]
  hit: { side: 'e' | 'p'; idx: number; n: number } | null
}
export interface UIState {
  started: boolean
  dialog: { who: string; text: string; typed: number } | null
  menu: { kind: string; title: string; items: MenuItem[]; idx: number; cancel: boolean } | null
  card: { title?: string; lines: string[] } | null
  chapter: { title: string; sub: string; lines: string[] } | null
  timing: { title: string; need: number; got: number; pos: number; msg: string } | null
  battle: BView | null
  toast: string
  banner: string
  fade: number
  obj: string
  gold: number
  info: { title: string; lines: string[] } | null
  end: boolean
  shake: number
  flash: number
  sceneName: string
}

interface NpcInst {
  def: NpcDef
  x: number
  y: number
  dir: Dir
  fx: number
  fy: number
  t: number
  moving: boolean
  wt: number
}
interface Bt {
  id: string
  name: string
  side: 'p' | 'e'
  idx: number
  hp: number
  mhp: number
  mp: number
  mmp: number
  atk: number
  def: number
  mag: number
  spd: number
  skills: string[]
  buffAtk: number
  buffDef: number
  guard: boolean
  actor?: Actor
  tpl?: EnemyTpl
}
interface Particle {
  x: number
  y: number
  v: number
  s: number
  p: number
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const imgCache = new Map<string, string>()

export function lookURL(p: Portrait, view: 'front' | 'back' = 'front'): string {
  const key = JSON.stringify(p) + view
  const hit = imgCache.get(key)
  if (hit) return hit
  let c: HTMLCanvasElement
  if (p.creature) c = creatureCanvas(p.creature.kind, p.creature.col, 0)
  else if (p.look) c = charCanvas(p.look, view === 'front' ? DOWN : UP, 0)
  else {
    c = document.createElement('canvas')
    c.width = c.height = 2
  }
  const url = c.toDataURL()
  imgCache.set(key, url)
  return url
}

export class Engine {
  ui: UIState = {
    started: false, dialog: null, menu: null, card: null, chapter: null, timing: null, battle: null,
    toast: '', banner: '', fade: 1, obj: '', gold: 0, info: null, end: false, shake: 0, flash: 0, sceneName: '',
  }
  version = 0
  private listeners = new Set<() => void>()
  flags: Flags = {}
  gold = 0
  inv: Record<string, number> = {}
  roster: Actor[] = []
  party: string[] = []
  npcPos: Record<string, { x: number; y: number; dir: Dir }> = {}
  checkpoint = { map: 'hake', x: 11, y: 14 }
  mapId = 'hake'
  map: MapDef = MAP_LIST.hake
  px = 11
  py = 14
  prevX = 11
  prevY = 14
  dir: Dir = DOWN
  stepping = false
  stepT = 1
  parity = 0
  trail: { x: number; y: number }[] = []
  npcs: NpcInst[] = []
  busy = 0
  held: Dir[] = []
  run = false
  steps = 0
  encSteps = 0
  playMs = 0
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private raf = 0
  private last = 0
  private time = 0
  private S = 3
  private VW = 320
  private VH = 200
  private parts: Particle[] = []
  private menuRes: ((i: number) => void) | null = null
  private dialogRes: (() => void) | null = null
  private skipRes: (() => void) | null = null
  private cardRes: (() => void) | null = null
  private timingRes: (() => void) | null = null
  private timingDir = 1
  private timingSpeed = 1
  private dirty = true
  private popId = 1
  private toastT = 0
  private bannerT = 0
  private shakeT = 0
  private flashT = 0
  private titleCam = 0

  // ───────── 订阅 ─────────
  subscribe = (l: () => void) => {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }
  getVersion = () => this.version
  private emit() {
    this.version++
    this.listeners.forEach((l) => l())
  }

  // ───────── 启动 ─────────
  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.last = performance.now()
    cancelAnimationFrame(this.raf)
    const loop = (t: number) => {
      const dt = Math.min(50, t - this.last)
      this.last = t
      this.update(dt)
      this.render()
      if (this.dirty) {
        this.dirty = false
        this.emit()
      }
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
    if (!this.ui.started && !this.ui.menu) this.openTitle()
  }
  detach() {
    cancelAnimationFrame(this.raf)
  }
  resize(w: number, h: number) {
    if (!this.canvas) return
    this.canvas.width = w
    this.canvas.height = h
    this.S = Math.max(2, Math.min(5, Math.floor(Math.min(w / 240, h / 150))))
    this.VW = Math.ceil(w / this.S)
    this.VH = Math.ceil(h / this.S)
  }
  hasSave() {
    try {
      return !!localStorage.getItem(SAVE_KEY)
    } catch {
      return false
    }
  }

  private mark() {
    this.dirty = true
  }

  // ───────── 标题 ─────────
  async openTitle() {
    this.ui.started = false
    this.ui.fade = 0
    this.setMap('hake')
    this.npcs = []
    this.px = 20
    this.py = 12
    this.mark()
    for (;;) {
      const items: MenuItem[] = [{ label: '开始新的冒险' }, { label: '继续旅程', disabled: !this.hasSave() }]
      const i = await this.askMenu('title', '', items, false)
      if (i === 0) {
        await this.newGame()
        return
      }
      if (i === 1 && this.hasSave()) {
        if (this.load()) return
      }
    }
  }

  async newGame() {
    this.flags = { ch: 0 }
    this.gold = 20
    this.inv = { potion: 2 }
    this.roster = []
    this.party = []
    this.npcPos = {}
    this.addActor('amy', 1)
    this.party = ['amy']
    this.ui.started = true
    this.ui.obj = ''
    this.ui.gold = this.gold
    this.mapId = 'hake'
    this.setMap('hake')
    this.px = 11
    this.py = 14
    this.trail = []
    this.spawnNpcs()
    this.ui.fade = 1
    this.mark()
    await this.runScript(INTRO)
  }

  // ───────── 存档 ─────────
  save(silent = false) {
    try {
      const data = {
        mapId: this.mapId, px: this.px, py: this.py, dir: this.dir, flags: this.flags, gold: this.gold, inv: this.inv,
        roster: this.roster, party: this.party, npcPos: this.npcPos, checkpoint: this.checkpoint, obj: this.ui.obj, playMs: this.playMs,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
      if (!silent) this.toast('已保存进度')
    } catch {
      if (!silent) this.toast('无法保存（浏览器存储不可用）')
    }
  }
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return false
      const d = JSON.parse(raw)
      this.flags = d.flags
      this.gold = d.gold
      this.inv = d.inv
      this.roster = d.roster
      this.party = d.party
      this.npcPos = d.npcPos ?? {}
      this.checkpoint = d.checkpoint
      this.ui.obj = d.obj ?? ''
      this.playMs = d.playMs ?? 0
      this.ui.started = true
      this.ui.gold = this.gold
      this.mapId = d.mapId
      this.setMap(d.mapId)
      this.px = d.px
      this.py = d.py
      this.prevX = d.px
      this.prevY = d.py
      this.dir = d.dir
      this.trail = []
      this.spawnNpcs()
      this.ui.fade = 0
      this.ui.menu = null
      this.mark()
      this.showBanner(this.map.name)
      return true
    } catch {
      return false
    }
  }

  // ───────── 角色 ─────────
  addActor(id: string, lv: number) {
    const tpl = ACTORS[id]
    const a: Actor = {
      id, name: tpl.name, lv: 1, exp: 0, hp: 1, mhp: 1, mp: 1, mmp: 1, atk: 1, def: 1, mag: 1, spd: 1, skills: [], bonus: { atk: 0, def: 0, mag: 0 },
    }
    const target = tpl.lv ?? lv
    this.recalc(a, target)
    a.hp = a.mhp
    a.mp = a.mmp
    this.roster.push(a)
    return a
  }
  recalc(a: Actor, lv: number) {
    const t = ACTORS[a.id]
    const g = t.growth
    const n = lv - 1
    a.lv = lv
    a.mhp = Math.round(t.hp + g.hp * n)
    a.mmp = Math.round(t.mp + g.mp * n)
    a.atk = Math.round(t.atk + g.atk * n)
    a.def = Math.round(t.def + g.def * n)
    a.mag = Math.round(t.mag + g.mag * n)
    a.spd = Math.round(t.spd + g.spd * n)
    a.skills = Array.from(new Set([...t.skills.filter(([l]) => l <= lv).map(([, s]) => s), ...(a.learned ?? [])]))
    if (a.up) {
      a.mhp += a.up.a * 10
      a.mmp += a.up.c * 5
    }
  }
  actor(id: string) {
    return this.roster.find((a) => a.id === id)
  }
  partyActors() {
    return this.party.map((id) => this.actor(id)).filter((a): a is Actor => !!a)
  }
  avgLv() {
    const l = this.roster.filter((a) => ACTORS[a.id].growth.hp > 0)
    if (!l.length) return 1
    return Math.max(1, Math.floor(l.reduce((s, a) => s + a.lv, 0) / l.length))
  }
  gainExp(a: Actor, exp: number): string[] {
    const msgs: string[] = []
    if (ACTORS[a.id].growth.hp <= 0) return msgs
    a.exp += exp
    while (a.lv < 40 && a.exp >= expNeed(a.lv)) {
      a.exp -= expNeed(a.lv)
      const old = a.skills.slice()
      const oh = a.mhp, om = a.mmp
      this.recalc(a, a.lv + 1)
      a.hp = Math.min(a.mhp, a.hp + (a.mhp - oh))
      a.mp = Math.min(a.mmp, a.mp + (a.mmp - om))
      msgs.push(`${a.name} 升到了 Lv.${a.lv}！`)
      for (const s of a.skills) if (!old.includes(s)) msgs.push(`${a.name} 学会了「${SKILLS[s].name}」！`)
    }
    return msgs
  }
  eff(a: Actor) {
    const u = a.up ?? { w: 0, a: 0, c: 0 }
    return { atk: a.atk + a.bonus.atk + u.w * 2, def: a.def + a.bonus.def + u.a * 2, mag: a.mag + a.bonus.mag + u.w + u.c * 2 }
  }
  skillLv(a: Actor | undefined, id: string) {
    return a?.sl?.[id] ?? 1
  }

  // ───────── 地图 ─────────
  private setMap(id: string) {
    this.mapId = id
    this.map = MAP_LIST[id]
    this.parts = []
    const n = this.map.weather === 'none' || !this.map.weather ? 0 : this.map.weather === 'snow' ? 90 : 60
    for (let i = 0; i < n; i++) this.parts.push({ x: Math.random(), y: Math.random(), v: 0.3 + Math.random() * 0.7, s: 1 + Math.floor(Math.random() * 2), p: Math.random() * 6 })
  }
  private spawnNpcs() {
    this.npcs = NPCS.filter((n) => n.map === this.mapId).map((def) => {
      const st = this.npcPos[def.id]
      return { def, x: st?.x ?? def.x, y: st?.y ?? def.y, dir: st?.dir ?? def.dir ?? DOWN, fx: 0, fy: 0, t: 1, moving: false, wt: 1 + Math.random() * 3 }
    })
  }
  private npcVisible(n: NpcInst) {
    const id = n.def.id
    if (this.flags['h_' + id]) return false
    if (this.flags['s_' + id]) return true
    return n.def.show ? n.def.show(this.flags) : true
  }
  npcById(id: string) {
    return this.npcs.find((n) => n.def.id === id)
  }
  tileSolid(x: number, y: number) {
    const m = this.map
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true
    const i = y * m.w + x
    if (TILES[m.g[i]].solid) return true
    const o = m.o[i]
    return o >= 0 && TILES[o].solid
  }
  passable(x: number, y: number) {
    if (this.tileSolid(x, y)) return false
    for (const n of this.npcs) {
      if (!this.npcVisible(n) || n.def.solid === false) continue
      if ((n.x === x && n.y === y) || (n.moving && n.fx === x && n.fy === y)) return false
    }
    return true
  }

  async warpTo(mapId: string, x: number, y: number, dir?: Dir, fast = false) {
    const same = mapId === this.mapId
    if (!fast) await this.fadeTo(1, 220)
    if (!same) {
      this.npcPositionsSave()
      this.setMap(mapId)
      this.spawnNpcs()
    }
    this.px = x
    this.py = y
    this.prevX = x
    this.prevY = y
    this.stepping = false
    this.stepT = 1
    if (dir !== undefined) this.dir = dir
    this.trail = []
    this.encSteps = 0
    this.checkpoint = { map: mapId, x, y }
    if (!fast) await this.fadeTo(0, 220)
    if (!same) this.showBanner(this.map.name)
    this.mark()
  }
  private npcPositionsSave() {
    for (const n of this.npcs) {
      if (n.x !== n.def.x || n.y !== n.def.y || n.dir !== (n.def.dir ?? DOWN)) this.npcPos[n.def.id] = { x: n.x, y: n.y, dir: n.dir }
    }
  }
  showBanner(t: string) {
    this.ui.banner = t
    this.bannerT = 2200
    this.mark()
  }
  toast(t: string) {
    this.ui.toast = t
    this.toastT = 2200
    this.mark()
  }
  fadeTo(v: number, ms: number) {
    return new Promise<void>((res) => {
      const from = this.ui.fade
      const t0 = performance.now()
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / ms)
        this.ui.fade = from + (v - from) * k
        this.mark()
        if (k < 1) requestAnimationFrame(tick)
        else res()
      }
      tick()
    })
  }

  // ───────── 输入 ─────────
  setHeld(d: Dir, on: boolean) {
    this.held = this.held.filter((x) => x !== d)
    if (on) this.held.push(d)
  }
  press(a: 'confirm' | 'cancel' | 'up' | 'down' | 'left' | 'right') {
    const u = this.ui
    if (u.card || u.chapter) {
      if (a === 'confirm' || a === 'cancel') this.cardRes?.()
      return
    }
    if (u.info) {
      if (a === 'confirm' || a === 'cancel') {
        u.info = null
        this.mark()
        this.cardRes?.()
      }
      return
    }
    if (u.timing) {
      if (a === 'confirm') this.timingHit()
      return
    }
    if (u.menu) {
      const m = u.menu
      if (a === 'up' || a === 'left') this.moveMenu(-1)
      else if (a === 'down' || a === 'right') this.moveMenu(1)
      else if (a === 'confirm') this.pickMenu(m.idx)
      else if (a === 'cancel' && m.cancel) {
        const r = this.menuRes
        this.menuRes = null
        u.menu = null
        this.mark()
        r?.(-1)
      }
      return
    }
    if (u.dialog) {
      if (a === 'confirm') {
        const d = u.dialog
        if (d.typed < d.text.length) {
          d.typed = d.text.length
          this.mark()
        } else {
          u.dialog = null
          this.mark()
          this.dialogRes?.()
        }
      }
      return
    }
    if (this.skipRes && a === 'confirm') {
      this.skipRes()
      return
    }
    if (this.busy || !u.started || u.battle) return
    if (a === 'confirm') this.interact()
    else if (a === 'cancel') void this.fieldMenu()
  }
  private moveMenu(d: number) {
    const m = this.ui.menu
    if (!m) return
    const n = m.items.length
    let i = m.idx
    for (let k = 0; k < n; k++) {
      i = (i + d + n) % n
      if (!m.items[i].disabled) break
    }
    m.idx = i
    this.mark()
  }
  pickMenu(i: number) {
    const m = this.ui.menu
    if (!m || m.items[i]?.disabled) return
    const r = this.menuRes
    this.menuRes = null
    this.ui.menu = null
    this.mark()
    r?.(i)
  }
  askMenu(kind: string, title: string, items: MenuItem[], cancel: boolean, idx = 0) {
    return new Promise<number>((res) => {
      let i = idx
      if (items[i]?.disabled) i = Math.max(0, items.findIndex((x) => !x.disabled))
      this.menuRes = res
      this.ui.menu = { kind, title, items, idx: i, cancel }
      this.mark()
    })
  }
  waitSkip(ms: number) {
    return new Promise<void>((res) => {
      const done = () => {
        clearTimeout(tm)
        this.skipRes = null
        res()
      }
      const tm = setTimeout(done, ms)
      this.skipRes = done
    })
  }
  waitCard() {
    return new Promise<void>((res) => {
      this.cardRes = () => {
        this.cardRes = null
        res()
      }
    })
  }

  // ───────── 交互 ─────────
  private interact() {
    const [dx, dy] = DIRV[this.dir]
    let tx = this.px + dx, ty = this.py + dy
    const find = (x: number, y: number) => this.npcs.find((n) => this.npcVisible(n) && (n.x === x && n.y === y) && n.def.talk)
    let npc = find(tx, ty)
    if (!npc && this.map.o[ty * this.map.w + tx] === T.COUNTER) {
      tx += dx
      ty += dy
      npc = find(tx, ty)
    }
    if (npc) {
      if (!npc.def.prop) npc.dir = this.dir === DOWN ? UP : this.dir === UP ? DOWN : this.dir === LEFT ? RIGHT : LEFT
      const talk = npc.def.talk!
      const steps = typeof talk === 'function' ? talk(this.flags) : talk
      void this.runScript(steps)
      return
    }
    const sign = SIGNS[`${this.mapId}:${this.px + dx},${this.py + dy}`]
    if (sign) void this.runScript(sign.map((t) => ({ t: 'narr', text: t }) as Step))
    else if (this.map.o[ty * this.map.w + tx] === T.CAMPFIRE) void this.rest()
  }
  private async rest() {
    const c = CAMPS[this.mapId]
    this.busy++
    try {
      await this.fadeTo(1, 300)
      for (const a of this.roster) {
        a.hp = a.mhp
        a.mp = a.mmp
      }
      if (c) this.checkpoint = { map: this.mapId, x: c.rx, y: c.ry }
      this.save(true)
      await sleep(350)
      await this.fadeTo(0, 300)
      this.toast('篝火旁小憩片刻，队伍状态完全恢复。复活点已记录。')
    } finally {
      this.busy--
      this.mark()
    }
  }

  // ───────── 脚本 ─────────
  async runScript(steps: Step[], trigId?: string) {
    this.busy++
    try {
      await this.exec(steps)
    } catch (e) {
      if (e instanceof Error && e.message === 'ABORT') {
        if (trigId) delete this.flags['d_' + trigId]
        await this.defeat()
      } else if (e instanceof Error && e.message === 'END') {
        /* 结束 */
      } else throw e
    } finally {
      this.busy--
      this.mark()
    }
  }
  private async exec(steps: Step[]) {
    for (const s of steps) await this.step(s)
  }
  private async defeat() {
    this.ui.battle = null
    await this.fadeTo(1, 300)
    for (const a of this.partyActors()) {
      a.hp = a.mhp
      a.mp = a.mmp
    }
    this.ui.dialog = null
    const camp = CAMPS[this.mapId]
    if (camp) this.checkpoint = { map: this.mapId, x: camp.rx, y: camp.ry }
    this.setMap(this.checkpoint.map)
    this.spawnNpcs()
    this.px = this.checkpoint.x
    this.py = this.checkpoint.y
    this.prevX = this.px
    this.prevY = this.py
    this.trail = []
    await sleep(200)
    await this.fadeTo(0, 300)
    this.toast('败北……队伍在最近的落脚处恢复了状态')
  }
  private who(w: string): { kind: 'p' } | { kind: 'n'; n: NpcInst } {
    if (w === 'player') return { kind: 'p' }
    const n = this.npcById(w)
    if (!n) return { kind: 'p' }
    return { kind: 'n', n }
  }
  private async step(s: Step) {
    switch (s.t) {
      case 'say':
        await this.say(s.who, s.text)
        break
      case 'narr':
        await this.say('', s.text)
        break
      case 'choice': {
        const i = await this.askMenu('choice', '', s.opts.map((o) => ({ label: o.label })), false)
        await this.exec(s.opts[i].steps)
        break
      }
      case 'set':
        this.flags[s.flag] = s.v ?? 1
        break
      case 'add':
        this.flags[s.flag] = (this.flags[s.flag] ?? 0) + (s.v ?? 1)
        break
      case 'if':
        if (s.c(this.flags)) await this.exec(s.then)
        else if (s.else) await this.exec(s.else)
        break
      case 'warp':
        await this.warpTo(s.map, s.x, s.y, s.dir)
        break
      case 'battle': {
        const r = await this.battle(s.o)
        if (r === 'win' && s.o.win) await this.exec(s.o.win)
        else if (r === 'lose') {
          if (s.o.lose) await this.exec(s.o.lose)
          else throw new Error('ABORT')
        }
        break
      }
      case 'chapter':
        await this.chapter(s.title, s.sub, s.text ?? [])
        break
      case 'card':
        await this.card(s.text, s.title)
        break
      case 'fade':
        await this.fadeTo(s.to, 500)
        break
      case 'join': {
        if (!this.actor(s.id)) this.addActor(s.id, this.avgLv())
        if (!this.party.includes(s.id)) {
          if (this.party.length < 4) this.party.push(s.id)
        }
        this.toast(`${ACTORS[s.id].name} 加入了队伍`)
        break
      }
      case 'leave':
        this.party = this.party.filter((x) => x !== s.id)
        break
      case 'party':
        for (const id of s.ids) if (!this.actor(id)) this.addActor(id, this.avgLv())
        this.party = s.ids.slice(0, 4)
        break
      case 'give':
        this.inv[s.item] = (this.inv[s.item] ?? 0) + (s.n ?? 1)
        this.toast(`获得 ${ITEMS[s.item].name} ×${s.n ?? 1}`)
        break
      case 'gold':
        this.gold = Math.max(0, this.gold + s.n)
        this.ui.gold = this.gold
        this.toast(s.n >= 0 ? `获得 ${s.n} 金币` : `支出 ${-s.n} 金币`)
        break
      case 'obj':
        this.ui.obj = s.text
        if (s.text) this.toast('目标更新：' + s.text)
        break
      case 'move':
        await this.moveScript(s.who, s.path)
        break
      case 'face': {
        const w = this.who(s.who)
        if (w.kind === 'p') this.dir = s.dir
        else w.n.dir = s.dir
        this.mark()
        break
      }
      case 'wait':
        await sleep(s.ms)
        break
      case 'show':
        delete this.flags['h_' + s.id]
        this.flags['s_' + s.id] = 1
        if (s.x !== undefined) {
          const n = this.npcById(s.id)
          if (n) {
            n.x = s.x
            n.y = s.y ?? n.y
          }
        }
        break
      case 'hide':
        this.flags['h_' + s.id] = 1
        delete this.flags['s_' + s.id]
        break
      case 'place': {
        const n = this.npcById(s.id)
        if (n) {
          n.x = s.x
          n.y = s.y
          if (s.dir !== undefined) n.dir = s.dir
          n.moving = false
          this.npcPos[s.id] = { x: s.x, y: s.y, dir: n.dir }
        }
        break
      }
      case 'heal':
        for (const a of this.roster) {
          a.hp = a.mhp
          a.mp = a.mmp
        }
        break
      case 'save':
        this.save(true)
        this.toast('进度已自动保存')
        break
      case 'shake':
        this.shakeT = 450
        await sleep(450)
        break
      case 'flash':
        this.flashT = 400
        await sleep(300)
        break
      case 'timing':
        await this.timing(s.title, s.hits, s.speed ?? 1)
        break
      case 'toast':
        this.toast(s.text)
        break
      case 'shop':
        await this.shop(s.items)
        break
      case 'forge':
        await this.forge()
        break
      case 'train':
        await this.train()
        break
      case 'learn': {
        const a = this.actor(s.who)
        if (a && !a.skills.includes(s.skill)) {
          a.skills.push(s.skill)
          a.learned = [...(a.learned ?? []), s.skill]
          this.toast(`${a.name} 领悟了「${SKILLS[s.skill].name}」`)
        }
        break
      }
      case 'equip': {
        const a = this.actor(s.who)
        if (a) {
          a.bonus.atk += s.atk ?? 0
          a.bonus.def += s.def ?? 0
          a.bonus.mag += s.mag ?? 0
          a.weapon = s.name
          this.toast(`${a.name} 装备了「${s.name}」`)
        }
        break
      }
      case 'lvl':
        for (const a of this.roster) {
          if (ACTORS[a.id].growth.hp > 0 && a.lv < s.n) {
            this.recalc(a, s.n)
            a.hp = a.mhp
            a.mp = a.mmp
          }
        }
        break
      case 'end':
        await this.ending()
        throw new Error('END')
      case 'fn':
        s.run(this)
        break
    }
    this.ui.gold = this.gold
    this.mark()
  }

  // 对话
  private async say(who: string, text: string) {
    this.ui.dialog = { who, text, typed: 0 }
    this.mark()
    await new Promise<void>((res) => {
      this.dialogRes = res
    })
  }
  private async card(lines: string[], title?: string) {
    await this.fadeTo(1, 400)
    this.ui.card = { title, lines }
    this.mark()
    await this.waitCard()
    this.ui.card = null
    this.mark()
    await this.fadeTo(0, 400)
  }
  private async chapter(title: string, sub: string, lines: string[]) {
    await this.fadeTo(1, 500)
    this.ui.chapter = { title, sub, lines }
    this.mark()
    await Promise.race([this.waitCard(), sleep(9000)])
    this.cardRes = null
    this.ui.chapter = null
    this.save(true)
    this.mark()
    await this.fadeTo(0, 500)
  }
  private async ending() {
    await this.fadeTo(1, 800)
    this.ui.end = true
    this.mark()
    await new Promise<void>(() => {})
  }

  // 移动脚本
  private async moveScript(who: string, path: string) {
    const w = this.who(who)
    for (const ch of path) {
      if (ch === '.') {
        await sleep(220)
        continue
      }
      const d: Dir = ch === 'd' ? DOWN : ch === 'l' ? LEFT : ch === 'r' ? RIGHT : UP
      const [dx, dy] = DIRV[d]
      if (w.kind === 'p') {
        this.dir = d
        this.trail.unshift({ x: this.px, y: this.py })
        if (this.trail.length > 8) this.trail.pop()
        this.prevX = this.px
        this.prevY = this.py
        this.px += dx
        this.py += dy
        this.stepT = 0
        this.stepping = true
        this.parity ^= 1
        await sleep(190)
        this.stepping = false
        this.stepT = 1
      } else {
        const n = w.n
        n.dir = d
        n.fx = n.x
        n.fy = n.y
        n.x += dx
        n.y += dy
        n.t = 0
        n.moving = true
        await sleep(190)
        n.moving = false
        n.t = 1
      }
    }
  }

  // 节奏小游戏
  private timing(title: string, need: number, speed: number) {
    return new Promise<void>((res) => {
      this.timingRes = res
      this.timingSpeed = speed
      this.timingDir = 1
      this.ui.timing = { title, need, got: 0, pos: 0, msg: '在光标进入金色区域时按下确认键' }
      this.mark()
    })
  }
  private timingHit() {
    const t = this.ui.timing
    if (!t || t.got >= t.need) return
    if (t.pos > 0.4 && t.pos < 0.6) {
      t.got++
      t.msg = t.got >= t.need ? '完美！' : `命中！${t.got}/${t.need}`
      this.flashT = 150
      if (t.got >= t.need) {
        this.mark()
        const r = this.timingRes
        setTimeout(() => {
          if (this.ui.timing !== t) return
          this.ui.timing = null
          this.timingRes = null
          this.mark()
          r?.()
        }, 600)
        return
      }
    } else {
      t.msg = '差一点，再试一次'
    }
    this.mark()
  }

  // 商店
  private async shop(list: string[]) {
    for (;;) {
      const items: MenuItem[] = list.map((id) => ({ label: `${ITEMS[id].name}`, sub: `${ITEMS[id].price}金 · ${ITEMS[id].desc}`, disabled: this.gold < ITEMS[id].price }))
      items.push({ label: '离开' })
      const i = await this.askMenu('shop', `商店  持有 ${this.gold} 金币`, items, true)
      if (i < 0 || i >= list.length) break
      const id = list[i]
      this.gold -= ITEMS[id].price
      this.inv[id] = (this.inv[id] ?? 0) + 1
      this.ui.gold = this.gold
      this.toast(`购入 ${ITEMS[id].name}`)
    }
  }

  // 装备强化 / 技能修炼
  private fighters() {
    return this.roster.filter((a) => ACTORS[a.id].growth.hp > 0)
  }
  private async forge() {
    const SLOTS: { k: 'w' | 'a' | 'c'; name: string; eff: string }[] = [
      { k: 'w', name: '武器', eff: '攻击+2 魔法+1' },
      { k: 'a', name: '护甲', eff: '防御+2 生命上限+10' },
      { k: 'c', name: '护符', eff: '魔法+2 魔力上限+5' },
    ]
    let who = 0
    for (;;) {
      const pool = this.fighters()
      const wi = await this.askMenu('shop', `铁匠·强化装备  持有 ${this.gold} 金币`, pool.map((a) => {
        const u = a.up ?? { w: 0, a: 0, c: 0 }
        return { label: a.name, sub: `Lv.${a.lv}  武器+${u.w} 护甲+${u.a} 护符+${u.c}` }
      }), true, who)
      if (wi < 0) return
      who = wi
      const a = pool[wi]
      let si = 0
      for (;;) {
        const u = (a.up ??= { w: 0, a: 0, c: 0 })
        const cap = Math.min(10, 1 + Math.floor(a.lv / 3))
        const items: MenuItem[] = SLOTS.map((s) => {
          const n = u[s.k]
          const cost = Math.round((40 * Math.pow(n + 1, 1.6)) / 5) * 5
          if (n >= 10) return { label: `${s.name} +${n}`, sub: '已强化至极限', disabled: true }
          if (n >= cap) return { label: `${s.name} +${n}`, sub: `${a.name}等级不足，暂时无法继续强化`, disabled: true }
          return { label: `${s.name} +${n} → +${n + 1}`, sub: `${cost}金 · ${s.eff}`, disabled: this.gold < cost }
        })
        const j = await this.askMenu('shop', `${a.name}  持有 ${this.gold} 金币`, items, true, si)
        if (j < 0) break
        si = j
        const s = SLOTS[j]
        const cost = Math.round((40 * Math.pow(u[s.k] + 1, 1.6)) / 5) * 5
        this.gold -= cost
        u[s.k]++
        const oh = a.mhp, om = a.mmp
        this.recalc(a, a.lv)
        a.hp = Math.min(a.mhp, a.hp + (a.mhp - oh))
        a.mp = Math.min(a.mmp, a.mp + (a.mmp - om))
        this.ui.gold = this.gold
        this.toast(`${a.name} 的${s.name}强化到 +${u[s.k]}`)
      }
    }
  }
  private async train() {
    let who = 0
    for (;;) {
      const pool = this.fighters()
      const wi = await this.askMenu('shop', `导师·修炼技能  持有 ${this.gold} 金币`, pool.map((a) => ({ label: a.name, sub: `Lv.${a.lv}` })), true, who)
      if (wi < 0) return
      who = wi
      const a = pool[wi]
      let si = 0
      for (;;) {
        const list = a.skills.map((id) => SKILLS[id]).filter((s) => s.id !== 'atk' && s.kind !== 'buff')
        if (!list.length) {
          this.toast(`${a.name} 还没有可修炼的技能`)
          break
        }
        const cap = Math.min(5, 1 + Math.floor(a.lv / 6))
        const items: MenuItem[] = list.map((s) => {
          const n = this.skillLv(a, s.id)
          const cost = Math.round(((50 + s.mp * 10) * Math.pow(n, 1.5)) / 5) * 5
          if (n >= 5) return { label: `${s.name} Lv.${n}`, sub: '已臻化境', disabled: true }
          if (n >= cap) return { label: `${s.name} Lv.${n}`, sub: `${a.name}等级不足，暂时无法继续修炼`, disabled: true }
          return { label: `${s.name} Lv.${n} → Lv.${n + 1}`, sub: `${cost}金 · 威力 +15%`, disabled: this.gold < cost }
        })
        const j = await this.askMenu('shop', `${a.name}  持有 ${this.gold} 金币`, items, true, si)
        if (j < 0) break
        si = j
        const s = list[j]
        const n = this.skillLv(a, s.id)
        this.gold -= Math.round(((50 + s.mp * 10) * Math.pow(n, 1.5)) / 5) * 5
        a.sl = { ...(a.sl ?? {}), [s.id]: n + 1 }
        this.ui.gold = this.gold
        this.toast(`${a.name} 的「${s.name}」提升到 Lv.${n + 1}`)
      }
    }
  }

  // ───────── 菜单 ─────────
  private async fieldMenu() {
    this.busy++
    try {
      for (;;) {
        const items: MenuItem[] = [{ label: '队伍状态' }, { label: '使用道具' }, { label: '当前目标' }, { label: '保存进度' }, { label: '编队', disabled: !!this.flags.as }, { label: '关闭' }]
        const i = await this.askMenu('field', `菜单  ${this.gold} 金币`, items, true)
        if (i < 0 || i === 5) break
        if (i === 4) {
          await this.formation()
          continue
        }
        if (i === 0) {
          const lines = this.partyActors().map((a) => {
            const e = this.eff(a)
            const u = a.up
            return `${a.name}  Lv.${a.lv}  生命 ${a.hp}/${a.mhp}  魔力 ${a.mp}/${a.mmp}  攻 ${e.atk}  防 ${e.def}  魔 ${e.mag}${a.weapon ? '  装备：' + a.weapon : ''}${u ? `  强化：武器+${u.w} 护甲+${u.a} 护符+${u.c}` : ''}`
          })
          this.ui.info = { title: '队伍状态', lines }
          this.mark()
          await this.waitCard()
        } else if (i === 1) await this.itemMenu(false)
        else if (i === 2) {
          this.ui.info = { title: '当前目标', lines: [this.ui.obj || '自由探索。', '', `所在：${this.map.name}`] }
          this.mark()
          await this.waitCard()
        } else if (i === 3) this.save()
      }
    } finally {
      this.busy--
    }
  }
  private async formation() {
    for (;;) {
      const pool = this.roster.filter((a) => ACTORS[a.id].growth.hp > 0)
      const items = pool.map((a) => ({ label: `${this.party.includes(a.id) ? '【出战】' : '　　　　'}${a.name}`, sub: `Lv.${a.lv}`, disabled: a.id === 'amy' }))
      const i = await this.askMenu('field', '编队（最多4人）', items, true)
      if (i < 0) return
      const id = pool[i].id
      if (this.party.includes(id)) this.party = this.party.filter((x) => x !== id)
      else if (this.party.length < 4) this.party.push(id)
      else this.toast('队伍已满')
      this.mark()
    }
  }
  private invList() {
    return Object.entries(this.inv).filter(([id, n]) => n > 0 && ITEMS[id] && ITEMS[id].kind !== 'key')
  }
  private async itemMenu(inBattle: boolean): Promise<{ item: string; target: Actor } | null> {
    for (;;) {
      const list = this.invList()
      if (!list.length) {
        this.toast('没有可用的道具')
        return null
      }
      const items = list.map(([id, n]) => ({ label: `${ITEMS[id].name} ×${n}`, sub: ITEMS[id].desc }))
      const i = await this.askMenu(inBattle ? 'battle' : 'item', '道具', items, true)
      if (i < 0) return null
      const id = list[i][0]
      const ts = this.partyActors()
      const j = await this.askMenu(inBattle ? 'battle' : 'item', '对谁使用', ts.map((a) => ({ label: a.name, sub: `生命 ${a.hp}/${a.mhp}  魔力 ${a.mp}/${a.mmp}${a.hp <= 0 ? '（倒下）' : ''}` })), true)
      if (j < 0) continue
      const t = ts[j]
      const def = ITEMS[id]
      if (def.kind === 'revive' ? t.hp > 0 : t.hp <= 0) {
        this.toast('这样使用没有效果')
        continue
      }
      if (inBattle) return { item: id, target: t }
      this.useItem(id, t)
    }
  }
  useItem(id: string, t: Actor) {
    const d = ITEMS[id]
    this.inv[id]--
    if (d.kind === 'hp') t.hp = Math.min(t.mhp, t.hp + d.amount)
    else if (d.kind === 'mp') t.mp = Math.min(t.mmp, t.mp + d.amount)
    else if (d.kind === 'both') {
      t.hp = t.mhp
      t.mp = t.mmp
    } else if (d.kind === 'revive') t.hp = Math.max(1, Math.round(t.mhp * 0.5))
    this.mark()
  }

  // ───────── 战斗 ─────────
  private bgFor(): BattleOpts['bg'] {
    const id = this.mapId
    if (id === 'dg6') return 'fire'
    if (id.startsWith('dg') || id === 'dragoncave') return 'cave'
    if (id === 'desert') return 'sand'
    if (['skycity', 'heaven'].includes(id)) return 'sky'
    if (id === 'hall') return 'hall'
    if (['frost', 'dragonmt', 'hake', 'capital', 'palace', 'arena'].includes(id)) return 'snow'
    return 'grass'
  }
  private mkPartyBt(a: Actor, i: number): Bt {
    const e = this.eff(a)
    return { id: a.id, name: a.name, side: 'p', idx: i, hp: a.hp, mhp: a.mhp, mp: a.mp, mmp: a.mmp, atk: e.atk, def: e.def, mag: e.mag, spd: a.spd, skills: a.skills, buffAtk: 0, buffDef: 0, guard: false, actor: a }
  }
  private mkEnemyBt(id: string, i: number): Bt {
    const t = ENEMIES[id]
    const es = this.flags.escale ?? 1
    const hp = Math.round(t.hp * es)
    return { id, name: t.name, side: 'e', idx: i, hp, mhp: hp, mp: 99, mmp: 99, atk: Math.round(t.atk * (1 + (es - 1) * 0.55)), def: Math.round(t.def * (1 + (es - 1) * 0.5)), mag: Math.round(t.mag * (1 + (es - 1) * 0.55)), spd: t.spd, skills: t.skills, buffAtk: 0, buffDef: 0, guard: false, tpl: t }
  }
  private spriteOf(p: Portrait, view: 'front' | 'back') {
    return lookURL(p, view)
  }
  private bview!: BView
  private bts: Bt[] = []
  private syncB() {
    const v = this.bview
    this.bts.forEach((b) => {
      if (b.side === 'e') {
        const e = v.enemies[b.idx]
        e.hp = Math.max(0, b.hp)
        e.dead = b.hp <= 0
      } else {
        const p = v.party[b.idx]
        p.hp = Math.max(0, b.hp)
        p.mp = b.mp
        p.dead = b.hp <= 0
        if (b.actor) {
          b.actor.hp = Math.max(0, b.hp)
          b.actor.mp = b.mp
        }
      }
    })
    this.mark()
  }
  private async blog(text: string, ms = 650) {
    this.bview.log = text
    this.mark()
    await this.waitSkip(ms)
  }
  private pop(side: 'e' | 'p', idx: number, text: string, kind: Pop['kind']) {
    const id = this.popId++
    this.bview.pops.push({ id, side, idx, text, kind })
    this.bview.hit = kind === 'dmg' ? { side, idx, n: id } : this.bview.hit
    this.mark()
    setTimeout(() => {
      this.bview.pops = this.bview.pops.filter((p) => p.id !== id)
      this.mark()
    }, 1000)
  }

  async battle(o: BattleOpts): Promise<'win' | 'lose' | 'run'> {
    const partyA = this.partyActors().filter((a) => a.hp > 0)
    if (!partyA.length) return 'lose'
    // 进入战斗
    this.flashT = 500
    this.ui.flash = 1
    await sleep(350)
    const eTpls = o.enemies.map((id) => ENEMIES[id])
    this.bts = []
    const pb = this.partyActors().map((a, i) => this.mkPartyBt(a, i))
    pb.forEach((b) => this.bts.push(b))
    const eb = o.enemies.map((id, i) => this.mkEnemyBt(id, i))
    eb.forEach((b) => this.bts.push(b))
    this.bview = {
      bg: o.bg ?? this.bgFor() ?? 'grass',
      enemies: eTpls.map((t, i) => ({ uid: i, name: t.name, hp: eb[i].hp, mhp: eb[i].mhp, img: this.spriteOf({ look: t.look, creature: t.creature }, 'front'), scale: t.scale ?? 1, dead: false })),
      party: this.partyActors().map((a) => {
        const tp = ACTORS[a.id]
        return { id: a.id, name: a.name, hp: a.hp, mhp: a.mhp, mp: a.mp, mmp: a.mmp, lv: a.lv, img: this.spriteOf({ look: tp.look, creature: tp.creature }, 'back'), acting: false, dead: a.hp <= 0 }
      }),
      log: '',
      pops: [],
      hit: null,
    }
    this.ui.battle = this.bview
    this.syncB()
    await sleep(200)
    this.ui.flash = 0
    await this.blog(eTpls.length > 1 ? `${eTpls[0].name}等 ${eTpls.length} 名敌人出现了！` : `${eTpls[0].name}出现了！`, 800)
    let result: 'win' | 'lose' | 'run' | null = null
    let round = 0
    while (!result) {
      round++
      const order = this.bts.filter((b) => b.hp > 0).sort((a, b) => b.spd + Math.random() * 4 - (a.spd + Math.random() * 4))
      for (const b of order) {
        if (b.hp <= 0) continue
        if (!this.bts.some((x) => x.side === 'e' && x.hp > 0)) break
        if (!this.bts.some((x) => x.side === 'p' && x.hp > 0)) break
        b.guard = false
        if (b.side === 'p') {
          this.bview.party[b.idx].acting = true
          this.mark()
          const r = await this.playerTurn(b, o)
          this.bview.party[b.idx].acting = false
          if (r === 'run') {
            result = 'run'
            break
          }
        } else await this.enemyTurn(b)
        this.syncB()
      }
      if (result) break
      if (!this.bts.some((x) => x.side === 'e' && x.hp > 0)) result = 'win'
      else if (!this.bts.some((x) => x.side === 'p' && x.hp > 0)) result = 'lose'
      else if (o.rounds && round >= o.rounds) {
        await this.blog('……战局出现了意料之外的变化！', 900)
        result = 'win'
        this.flags.scripted = 1
      }
      for (const b of this.bts) {
        if (b.buffAtk > 0) b.buffAtk--
        if (b.buffDef > 0) b.buffDef--
      }
    }
    if (result === 'lose' && o.noLose) {
      for (const b of this.bts) {
        if (b.side === 'p') {
          b.hp = Math.max(b.hp, 1)
          if (b.actor) b.actor.hp = Math.max(1, b.actor.hp)
        }
      }
      this.syncB()
      await this.blog('千钧一发之际……', 900)
      result = 'win'
      this.flags.rescued = 1
    }
    if (result === 'win') {
      if (!this.flags.scripted && !this.flags.rescued) {
        let exp = 0, gold = 0
        const drops: string[] = []
        for (const t of eTpls) {
          exp += Math.round(t.exp * (this.flags.escale ?? 1))
          gold += Math.round(t.gold * (this.flags.escale ?? 1))
          for (const [id, p] of t.drops ?? []) if (Math.random() < p) drops.push(id)
        }
        await this.blog('战斗胜利！', 700)
        this.gold += gold
        this.ui.gold = this.gold
        const msgs: string[] = []
        const alive = this.partyActors().filter((a) => a.hp > 0)
        for (const a of alive) msgs.push(...this.gainExp(a, Math.ceil(exp / Math.max(1, alive.length) * 1.2)))
        await this.blog(`获得 ${exp} 经验，${gold} 金币`, 900)
        for (const id of drops) {
          this.inv[id] = (this.inv[id] ?? 0) + 1
          await this.blog(`获得了 ${ITEMS[id].name}`, 700)
        }
        for (const m of msgs) await this.blog(m, 900)
      }
      for (const a of this.partyActors()) if (a.hp <= 0) a.hp = 1
    } else if (result === 'run') {
      await this.blog('成功逃离了战斗！', 600)
    } else {
      await this.blog('队伍全灭了……', 1000)
    }
    delete this.flags.scripted
    delete this.flags.rescued
    this.ui.battle = null
    this.flashT = 300
    this.mark()
    await sleep(250)
    return result
  }

  private async playerTurn(b: Bt, o: BattleOpts): Promise<'ok' | 'run'> {
    for (;;) {
      const items: MenuItem[] = [{ label: '攻击' }, { label: '技能' }, { label: '道具' }, { label: '防御' }, { label: '逃跑', disabled: !!o.noRun || !!o.rounds || !!o.noLose }]
      this.bview.log = `${b.name}，该怎么行动？`
      const i = await this.askMenu('battle', b.name, items, false)
      if (i === 0) {
        const t = await this.pickEnemy()
        if (!t) continue
        await this.useSkill(b, 'atk', [t])
        return 'ok'
      }
      if (i === 1) {
        const sks = b.skills.map((s) => SKILLS[s])
        const m = sks.map((s) => {
          const n = this.skillLv(b.actor, s.id)
          return { label: n > 1 ? `${s.name} Lv.${n}` : s.name, sub: `${s.mp}MP ${s.desc}`, disabled: b.mp < s.mp }
        })
        const j = await this.askMenu('battle', '技能', m, true)
        if (j < 0) continue
        const s = sks[j]
        if (s.kind === 'heal') {
          const t = await this.pickAlly()
          if (!t) continue
          await this.useSkill(b, s.id, [t])
        } else if (s.kind === 'buff') {
          await this.useSkill(b, s.id, [b])
        } else if (s.kind === 'aoe' || s.kind === 'aoephys') {
          await this.useSkill(b, s.id, this.bts.filter((x) => x.side === 'e' && x.hp > 0))
        } else {
          const t = await this.pickEnemy()
          if (!t) continue
          await this.useSkill(b, s.id, [t])
        }
        return 'ok'
      }
      if (i === 2) {
        const r = await this.itemMenu(true)
        if (!r) continue
        const t = this.bts.find((x) => x.actor === r.target)!
        const d = ITEMS[r.item]
        this.inv[r.item]--
        await this.blog(`${b.name} 使用了 ${d.name}`, 500)
        if (d.kind === 'hp') t.hp = Math.min(t.mhp, t.hp + d.amount)
        else if (d.kind === 'mp') t.mp = Math.min(t.mmp, t.mp + d.amount)
        else if (d.kind === 'both') {
          t.hp = t.mhp
          t.mp = t.mmp
        } else if (d.kind === 'revive') t.hp = Math.round(t.mhp * 0.5)
        this.pop('p', t.idx, d.kind === 'mp' ? `+${d.amount}MP` : `+${Math.min(d.amount, 999)}`, 'heal')
        this.syncB()
        await sleep(400)
        return 'ok'
      }
      if (i === 3) {
        b.guard = true
        await this.blog(`${b.name} 摆出了防御姿态`, 600)
        return 'ok'
      }
      if (i === 4) {
        if (Math.random() < 0.6) return 'run'
        await this.blog('逃跑失败了！', 700)
        return 'ok'
      }
    }
  }
  private async pickEnemy(): Promise<Bt | null> {
    const es = this.bts.filter((x) => x.side === 'e' && x.hp > 0)
    if (es.length === 1) return es[0]
    const j = await this.askMenu('battle', '攻击谁？', es.map((e) => ({ label: e.name, sub: `生命 ${e.hp}/${e.mhp}` })), true)
    return j < 0 ? null : es[j]
  }
  private async pickAlly(): Promise<Bt | null> {
    const ps = this.bts.filter((x) => x.side === 'p')
    const j = await this.askMenu('battle', '对谁使用？', ps.map((p) => ({ label: p.name, sub: `生命 ${p.hp}/${p.mhp}`, disabled: p.hp <= 0 })), true)
    return j < 0 ? null : ps[j]
  }
  private async enemyTurn(b: Bt) {
    const sid = b.skills[Math.floor(Math.random() * b.skills.length)] ?? 'atk'
    const sk = SKILLS[sid]
    const ps = this.bts.filter((x) => x.side === 'p' && x.hp > 0)
    if (!ps.length) return
    const t = ps[Math.floor(Math.random() * ps.length)]
    if (sk.kind === 'aoe' || sk.kind === 'aoephys') await this.useSkill(b, sid, ps)
    else await this.useSkill(b, sid, [t])
  }
  private async useSkill(b: Bt, sid: string, targets: Bt[]) {
    const s = SKILLS[sid]
    const pow = s.pow * (1 + 0.15 * (this.skillLv(b.actor, sid) - 1))
    b.mp -= b.side === 'p' ? s.mp : 0
    const name = s.name
    await this.blog(sid === 'atk' ? `${b.name} 发动了攻击！` : `${b.name} 使用了「${name}」！`, 560)
    if (s.kind === 'buff') {
      if (sid === 'mohe') b.buffDef = 3
      else for (const t of targets) t.buffAtk = 3
      this.pop(b.side, b.idx, sid === 'mohe' ? '防御↑' : '攻击↑', 'heal')
      this.syncB()
      await sleep(350)
      return
    }
    for (const t of targets) {
      if (t.hp <= 0) continue
      if (s.kind === 'heal') {
        const amt = Math.round(b.mag * pow + 12 + Math.random() * 6)
        t.hp = Math.min(t.mhp, t.hp + amt)
        this.pop(t.side, t.idx, `+${amt}`, 'heal')
        continue
      }
      const magic = s.kind === 'mag' || s.kind === 'aoe' || s.kind === 'drain'
      const atk = magic ? b.mag * 1.15 : b.atk * (b.buffAtk > 0 ? 1.4 : 1)
      const def = t.def * (t.buffDef > 0 ? 1.8 : 1) * (t.guard ? 1.7 : 1) * (magic ? 0.5 : 1)
      if (!magic && b.side === 'p' && Math.random() < 0.05) {
        this.pop(t.side, t.idx, 'MISS', 'miss')
        continue
      }
      let dmg = atk * pow - def * 0.55
      const crit = Math.random() < 0.08
      dmg = Math.max(1, Math.round(dmg * (0.88 + Math.random() * 0.24) * (crit ? 1.5 : 1)))
      t.hp -= dmg
      this.pop(t.side, t.idx, (crit ? '暴击 ' : '') + dmg, 'dmg')
      if (s.kind === 'drain') b.hp = Math.min(b.mhp, b.hp + Math.round(dmg / 2))
      if (t.hp <= 0) t.hp = 0
    }
    this.syncB()
    await sleep(420)
    for (const t of targets) if (t.hp <= 0 && t.side === 'e' && t.tpl) await this.blog(`${t.name} 被击败了！`, 500)
    for (const t of targets) if (t.hp <= 0 && t.side === 'p') await this.blog(`${t.name} 倒下了……`, 500)
  }

  // ───────── 更新 ─────────
  private update(dt: number) {
    this.time += dt
    if (this.ui.started) this.playMs += dt
    const u = this.ui
    if (u.dialog && u.dialog.typed < u.dialog.text.length) {
      u.dialog.typed = Math.min(u.dialog.text.length, u.dialog.typed + dt * 0.05)
      this.dirty = true
    }
    if (this.toastT > 0) {
      this.toastT -= dt
      if (this.toastT <= 0) {
        u.toast = ''
        this.dirty = true
      }
    }
    if (this.bannerT > 0) {
      this.bannerT -= dt
      if (this.bannerT <= 0) {
        u.banner = ''
        this.dirty = true
      }
    }
    if (this.shakeT > 0) this.shakeT -= dt
    if (this.flashT > 0) this.flashT -= dt
    if (u.timing && u.timing.got < u.timing.need) {
      u.timing.pos += (dt / 1000) * 0.9 * this.timingSpeed * this.timingDir
      if (u.timing.pos >= 1) {
        u.timing.pos = 1
        this.timingDir = -1
      } else if (u.timing.pos <= 0) {
        u.timing.pos = 0
        this.timingDir = 1
      }
      this.dirty = true
    }
    // 玩家步进
    const dur = this.run ? 105 : 160
    if (this.stepping) {
      this.stepT += dt / dur
      if (this.stepT >= 1) {
        this.stepT = 1
        this.stepping = false
        this.onArrive()
      }
    }
    // NPC 步进与游荡
    for (const n of this.npcs) {
      if (n.moving) {
        n.t += dt / 190
        if (n.t >= 1) {
          n.t = 1
          n.moving = false
        }
      } else if (n.def.wander && !this.busy && !u.dialog && !u.menu && this.npcVisible(n)) {
        n.wt -= dt / 1000
        if (n.wt <= 0) {
          n.wt = 1.5 + Math.random() * 3
          const d = Math.floor(Math.random() * 4) as Dir
          const [dx, dy] = DIRV[d]
          const nx = n.x + dx, ny = n.y + dy
          n.dir = d
          if (Math.abs(nx - n.def.x) <= 2 && Math.abs(ny - n.def.y) <= 2 && this.passable(nx, ny) && !(nx === this.px && ny === this.py)) {
            n.fx = n.x
            n.fy = n.y
            n.x = nx
            n.y = ny
            n.t = 0
            n.moving = true
          }
        }
      }
    }
    // 输入移动
    if (u.started && !this.busy && !this.stepping && !u.menu && !u.dialog && !u.battle && !u.card && !u.timing && !u.info) {
      const d = this.held[this.held.length - 1]
      if (d !== undefined) this.tryMove(d)
    }
  }
  private tryMove(d: Dir) {
    this.dir = d
    const [dx, dy] = DIRV[d]
    const nx = this.px + dx, ny = this.py + dy
    if (!this.passable(nx, ny)) {
      this.dirty = true
      return
    }
    this.trail.unshift({ x: this.px, y: this.py })
    if (this.trail.length > 8) this.trail.pop()
    this.prevX = this.px
    this.prevY = this.py
    this.px = nx
    this.py = ny
    this.stepT = 0
    this.stepping = true
    this.parity ^= 1
    this.steps++
  }
  private onArrive() {
    if (this.busy) return
    const w = this.map.warps.find((x) => x.x === this.px && x.y === this.py)
    if (w) {
      if (w.when && !w.when(this.flags)) {
        if (w.deny) void this.runScript(w.deny)
        return
      }
      void this.runScript([{ t: 'warp', map: w.to, x: w.tx, y: w.ty, dir: w.dir }])
      return
    }
    for (const t of TRIGGERS) {
      if (t.map !== this.mapId) continue
      const tw = t.w ?? 1, th = t.h ?? 1
      if (this.px >= t.x && this.px < t.x + tw && this.py >= t.y && this.py < t.y + th && t.when(this.flags)) {
        void this.runScript(t.run, t.id)
        return
      }
    }
    const enc = this.map.enc
    if (enc) {
      this.encSteps++
      if (this.encSteps >= 7 && Math.random() < enc.rate) {
        this.encSteps = 0
        const tot = enc.groups.reduce((s, g) => s + g.w, 0)
        let r = Math.random() * tot
        let pick = enc.groups[0]
        for (const g of enc.groups) {
          r -= g.w
          if (r <= 0) {
            pick = g
            break
          }
        }
        void this.runScript([{ t: 'battle', o: { enemies: pick.ids } }])
      }
    }
  }

  // ───────── 渲染 ─────────
  private render() {
    const ctx = this.ctx
    const cv = this.canvas
    if (!ctx || !cv) return
    const S = this.S
    const m = this.map
    ctx.imageSmoothingEnabled = false
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#10141c'
    ctx.fillRect(0, 0, cv.width, cv.height)
    const VW = this.VW, VH = this.VH
    // 相机
    let ppx: number, ppy: number
    if (!this.ui.started) {
      this.titleCam += 0.02
      ppx = 20 * TS + Math.sin(this.titleCam * 0.2) * 80
      ppy = 12 * TS
    } else {
      const k = this.stepping ? this.stepT : 1
      ppx = (this.prevX + (this.px - this.prevX) * k) * TS + 8
      ppy = (this.prevY + (this.py - this.prevY) * k) * TS + 8
    }
    const mw = m.w * TS, mh = m.h * TS
    let cx = ppx - VW / 2, cy = ppy - VH / 2
    cx = mw <= VW ? -(VW - mw) / 2 : Math.max(0, Math.min(mw - VW, cx))
    cy = mh <= VH ? -(VH - mh) / 2 : Math.max(0, Math.min(mh - VH, cy))
    cx = Math.floor(cx)
    cy = Math.floor(cy)
    let sx = 0, sy = 0
    if (this.shakeT > 0) {
      sx = Math.round((Math.random() - 0.5) * 3)
      sy = Math.round((Math.random() - 0.5) * 3)
    }
    ctx.setTransform(S, 0, 0, S, sx * S, sy * S)
    const fr = Math.floor(this.time / 220)
    const x0 = Math.max(0, Math.floor(cx / TS) - 1), x1 = Math.min(m.w - 1, Math.ceil((cx + VW) / TS))
    const y0 = Math.max(0, Math.floor(cy / TS) - 1), y1 = Math.min(m.h - 1, Math.ceil((cy + VH) / TS) + 2)
    // 地面
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const g = m.g[y * m.w + x]
        const v = Math.floor(rnd(x, y, 5) * 4)
        const px = x * TS - cx, py = y * TS - cy
        ctx.drawImage(tileCanvas(g, v, fr), px, py)
        if (g === T.WATER) {
          const nb = (a: number, b: number) => {
            if (a < 0 || b < 0 || a >= m.w || b >= m.h) return false
            const t = m.g[b * m.w + a]
            return t !== T.WATER && t !== T.BRIDGE && t !== T.LAVA && m.o[b * m.w + a] < 0
          }
          ctx.fillStyle = '#d8eefc'
          if (nb(x, y - 1)) ctx.fillRect(px, py, TS, 2)
          if (nb(x, y + 1)) ctx.fillRect(px, py + TS - 2, TS, 2)
          if (nb(x - 1, y)) ctx.fillRect(px, py, 2, TS)
          if (nb(x + 1, y)) ctx.fillRect(px + TS - 2, py, 2, TS)
        }
      }
    }
    // 对象与角色（按行）
    const ents: { y: number; draw: () => void }[] = []
    const addEnt = (key: number, draw: () => void) => ents.push({ y: key, draw })
    if (this.ui.started) {
      // 队友跟随
      const fol = this.flags.as ? [] : this.partyActors().slice(1)
      fol.forEach((a, i) => {
        const to = this.trail[i] ?? { x: this.px, y: this.py }
        const from = this.trail[i + 1] ?? to
        const k = this.stepping ? this.stepT : 1
        const tx = (from.x + (to.x - from.x) * k) * TS, ty = (from.y + (to.y - from.y) * k) * TS
        const moving = this.stepping && (from.x !== to.x || from.y !== to.y)
        const tp = ACTORS[a.id]
        addEnt(ty / TS + 0.01, () => this.drawEntity(ctx, tp.look, tp.creature, tx - cx, ty - cy, this.dir, moving ? 1 + this.parity : 0, 1))
      })
      const k = this.stepping ? this.stepT : 1
      const gx = (this.prevX + (this.px - this.prevX) * k) * TS
      const gy = (this.prevY + (this.py - this.prevY) * k) * TS
      const pl = this.partyActors()[0]
      const asK = this.flags.as === 1 ? '池寒枫' : this.flags.as === 2 ? '池傲天' : this.flags.as === 3 ? '凌云' : ''
      const look = asK ? PORTRAITS[asK].look : this.flags.kid ? PORTRAITS.小艾米.look! : pl ? ACTORS[pl.id].look : PORTRAITS.艾米.look
      addEnt(gy / TS + 0.02, () => this.drawEntity(ctx, look, undefined, gx - cx, gy - cy, this.dir, this.stepping ? 1 + this.parity : 0, this.flags.kid ? 0.78 : 1))
      for (const n of this.npcs) {
        if (!this.npcVisible(n) || n.def.prop && !n.def.look && !n.def.creature) continue
        const kk = n.moving ? n.t : 1
        const nx = (n.moving ? n.fx + (n.x - n.fx) * kk : n.x) * TS
        const ny = (n.moving ? n.fy + (n.y - n.fy) * kk : n.y) * TS
        addEnt(ny / TS, () => this.drawEntity(ctx, n.def.look, n.def.creature, nx - cx, ny - cy, n.dir, n.moving ? 1 + (Math.floor(this.time / 150) % 2) : 0, n.def.scale ?? 1))
      }
    }
    const rows: Map<number, { y: number; draw: () => void }[]> = new Map()
    for (const e of ents) {
      const r = Math.floor(e.y + 0.5)
      if (!rows.has(r)) rows.set(r, [])
      rows.get(r)!.push(e)
    }
    for (let y = y0; y <= y1 + 2; y++) {
      if (y <= m.h - 1) {
        for (let x = x0; x <= x1; x++) {
          const o = m.o[y * m.w + x]
          if (o < 0) continue
          const d = TILES[o]
          const v = Math.floor(rnd(x, y, 9) * 4)
          const px = x * TS - cx, py = y * TS - cy
          ctx.drawImage(tileCanvas(o, v, fr), px, d.tall ? py - TS : py)
        }
      }
      const r = rows.get(y)
      if (r) r.sort((a, b) => a.y - b.y).forEach((e) => e.draw())
    }
    // 天气
    this.drawWeather(ctx, VW, VH)
    // 色调与暗角
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (m.tint) {
      ctx.fillStyle = m.tint
      ctx.fillRect(0, 0, cv.width, cv.height)
    }
    if (m.dark && this.ui.started) {
      const gx = (ppx - cx) * S, gy = (ppy - cy) * S
      const r = Math.max(cv.width, cv.height) * 0.62
      const gr = ctx.createRadialGradient(gx, gy, S * 30, gx, gy, r)
      gr.addColorStop(0, 'rgba(0,0,10,0)')
      gr.addColorStop(1, `rgba(0,0,10,${0.45 + m.dark})`)
      ctx.fillStyle = gr
      ctx.fillRect(0, 0, cv.width, cv.height)
    }
    if (!this.ui.started) {
      ctx.fillStyle = 'rgba(8,14,34,0.45)'
      ctx.fillRect(0, 0, cv.width, cv.height)
    }
    if (this.flashT > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, this.flashT / 500)})`
      ctx.fillRect(0, 0, cv.width, cv.height)
    }
  }
  private drawEntity(ctx: CanvasRenderingContext2D, look: Look | undefined, cr: { kind: Creature; col: string } | undefined, x: number, y: number, dir: Dir, frame: number, scale: number) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.beginPath()
    ctx.ellipse(x + 8, y + 15, 5 * scale + 1, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    if (cr) {
      const c = creatureCanvas(cr.kind, cr.col, Math.floor(this.time / 300) % 2)
      const w = c.width * 0.62 * scale * (cr.kind === 'dragon2' || cr.kind === 'rider' ? 0.8 : 1)
      const h = c.height * 0.62 * scale * (cr.kind === 'dragon2' || cr.kind === 'rider' ? 0.8 : 1)
      const bob = cr.kind === 'dragon' || cr.kind === 'bat' || cr.kind === 'ghost' ? Math.sin(this.time / 220) * 1.2 - 2 : 0
      ctx.drawImage(c, Math.round(x + 8 - w / 2), Math.round(y + 16 - h + bob), Math.round(w), Math.round(h))
      return
    }
    if (!look) return
    const c = charCanvas(look, dir, frame === 0 ? 0 : frame)
    const w = 18 * scale, h = 22 * scale
    ctx.drawImage(c, Math.round(x + 8 - w / 2), Math.round(y + 16 - h + 1), Math.round(w), Math.round(h))
  }
  private drawWeather(ctx: CanvasRenderingContext2D, VW: number, VH: number) {
    const w = this.map.weather
    if (!w || w === 'none') return
    const t = this.time / 1000
    for (const p of this.parts) {
      let x: number, y: number
      if (w === 'snow') {
        x = ((p.x + t * 0.03 * p.v + Math.sin(t * p.v + p.p) * 0.01) % 1) * VW
        y = ((p.y + t * 0.1 * p.v) % 1) * VH
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillRect(Math.floor(x), Math.floor(y), p.s, p.s)
      } else if (w === 'ash') {
        x = ((p.x + Math.sin(t * 0.5 + p.p) * 0.02 + t * 0.01) % 1) * VW
        y = ((p.y + t * 0.05 * p.v) % 1) * VH
        ctx.fillStyle = p.s === 1 ? 'rgba(255,150,60,0.8)' : 'rgba(90,80,80,0.7)'
        ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1)
      } else if (w === 'sand') {
        x = ((p.x + t * 0.25 * p.v) % 1) * VW
        y = p.y * VH
        ctx.fillStyle = 'rgba(240,215,150,0.55)'
        ctx.fillRect(Math.floor(x), Math.floor(y), 3, 1)
      } else if (w === 'petal') {
        x = ((p.x + t * 0.02 * p.v + Math.sin(t + p.p) * 0.02) % 1) * VW
        y = ((p.y + t * 0.05 * p.v) % 1) * VH
        ctx.fillStyle = p.s === 1 ? 'rgba(255,200,220,0.85)' : 'rgba(255,245,200,0.8)'
        ctx.fillRect(Math.floor(x), Math.floor(y), 2, 1)
      }
    }
  }
}

export const engine = new Engine()
export { DOWN, LEFT, RIGHT, UP }
export type { Flags, Dir }
