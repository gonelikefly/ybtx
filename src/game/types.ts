import type { Creature, Dir, Look } from './sprites'

export type Flags = Record<string, number>
export type Cond = (f: Flags) => boolean

export interface Warp {
  x: number
  y: number
  to: string
  tx: number
  ty: number
  dir?: Dir
  when?: Cond
  deny?: Step[]
}

export interface MapDef {
  id: string
  name: string
  area: string
  w: number
  h: number
  g: number[]
  o: number[]
  warps: Warp[]
  weather?: 'snow' | 'ash' | 'sand' | 'petal' | 'none'
  tint?: string
  dark?: number
  enc?: { rate: number; groups: { ids: string[]; w: number }[] }
}

export interface BattleOpts {
  enemies: string[]
  win?: Step[]
  lose?: Step[]
  noLose?: boolean
  rounds?: number
  noRun?: boolean
  bg?: 'snow' | 'cave' | 'grass' | 'fire' | 'sky' | 'sand' | 'hall'
  title?: string
}

export type Step =
  | { t: 'say'; who: string; text: string }
  | { t: 'narr'; text: string }
  | { t: 'choice'; opts: { label: string; steps: Step[] }[] }
  | { t: 'set'; flag: string; v?: number }
  | { t: 'add'; flag: string; v?: number }
  | { t: 'if'; c: Cond; then: Step[]; else?: Step[] }
  | { t: 'warp'; map: string; x: number; y: number; dir?: Dir }
  | { t: 'battle'; o: BattleOpts }
  | { t: 'chapter'; title: string; sub: string; text?: string[] }
  | { t: 'card'; text: string[]; title?: string }
  | { t: 'fade'; to: number }
  | { t: 'join'; id: string }
  | { t: 'leave'; id: string }
  | { t: 'party'; ids: string[] }
  | { t: 'give'; item: string; n?: number }
  | { t: 'gold'; n: number }
  | { t: 'obj'; text: string }
  | { t: 'move'; who: string; path: string }
  | { t: 'face'; who: string; dir: Dir }
  | { t: 'wait'; ms: number }
  | { t: 'show'; id: string; x?: number; y?: number }
  | { t: 'hide'; id: string }
  | { t: 'place'; id: string; x: number; y: number; dir?: Dir }
  | { t: 'heal' }
  | { t: 'save' }
  | { t: 'shake' }
  | { t: 'flash' }
  | { t: 'timing'; title: string; hits: number; speed?: number }
  | { t: 'toast'; text: string }
  | { t: 'shop'; items: string[] }
  | { t: 'forge' }
  | { t: 'train' }
  | { t: 'learn'; who: string; skill: string }
  | { t: 'equip'; who: string; atk?: number; def?: number; mag?: number; name: string }
  | { t: 'lvl'; n: number }
  | { t: 'end' }
  | { t: 'fn'; run: (e: unknown) => void }

export interface NpcDef {
  id: string
  name: string
  map: string
  x: number
  y: number
  dir?: Dir
  look?: Look
  creature?: { kind: Creature; col: string }
  scale?: number
  prop?: boolean
  solid?: boolean
  wander?: boolean
  show?: Cond
  talk?: Step[] | ((f: Flags) => Step[])
}

export interface Trigger {
  id: string
  map: string
  x: number
  y: number
  w?: number
  h?: number
  when: Cond
  run: Step[]
}

export type SkillKind = 'phys' | 'mag' | 'heal' | 'buff' | 'aoe' | 'drain' | 'aoephys'
export interface Skill {
  id: string
  name: string
  mp: number
  kind: SkillKind
  pow: number
  desc: string
}

export interface ActorTpl {
  id: string
  lv?: number
  name: string
  hp: number
  mp: number
  atk: number
  def: number
  mag: number
  spd: number
  skills: [number, string][] // [level, skillId]
  look?: Look
  creature?: { kind: Creature; col: string }
  growth: { hp: number; mp: number; atk: number; def: number; mag: number; spd: number }
}

export interface Actor {
  id: string
  name: string
  lv: number
  exp: number
  hp: number
  mhp: number
  mp: number
  mmp: number
  atk: number
  def: number
  mag: number
  spd: number
  skills: string[]
  bonus: { atk: number; def: number; mag: number }
  weapon?: string
  learned?: string[]
  up?: { w: number; a: number; c: number }
  sl?: Record<string, number>
}

export interface EnemyTpl {
  id: string
  name: string
  hp: number
  atk: number
  def: number
  mag: number
  spd: number
  exp: number
  gold: number
  skills: string[]
  look?: Look
  creature?: { kind: Creature; col: string }
  scale?: number
  drops?: [string, number][]
}

export interface ItemDef {
  id: string
  name: string
  desc: string
  kind: 'hp' | 'mp' | 'both' | 'key' | 'revive'
  amount: number
  price: number
}
