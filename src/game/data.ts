import type { ActorTpl, EnemyTpl, ItemDef, Skill } from './types'
import type { Creature, Look } from './sprites'

export interface Portrait {
  look?: Look
  creature?: { kind: Creature; col: string }
  scale?: number
}

const L = (hair: string, top: string, o: Partial<Look> = {}): Look => ({ hair, top, ...o })

export const PORTRAITS: Record<string, Portrait> = {
  艾米: { look: L('#2a2420', '#f4f6fa', { bot: '#b8c4d8', accent: '#7fa8d8', style: 'short' }) },
  小艾米: { look: L('#2a2420', '#e8ecf4', { bot: '#a8b4c8', accent: '#7fa8d8', style: 'short' }), scale: 0.78 },
  哈伯老人: { look: L('#e8e8ee', '#7a5a3a', { bot: '#5a4a3a', accent: '#a88a5a', beard: '#e8e8ee', style: 'short' }) },
  池寒枫: { look: L('#26283a', '#3e4e78', { bot: '#2a3250', accent: '#e0c050', cape: '#cfd8ee', style: 'short' }) },
  雷葛: { look: L('#e0e0ea', '#3a5ea8', { bot: '#2a4478', accent: '#4a70c0', beard: '#f0f0f6', style: 'hat' }) },
  大青山: { look: L('#26221e', '#2f3038', { bot: '#3a3a42', accent: '#b0822c', style: 'short' }) },
  小青山: { look: L('#26221e', '#2f3038', { bot: '#3a3a42', accent: '#b0822c', style: 'short' }), scale: 0.6 },
  绿儿: { creature: { kind: 'dragon', col: '#4cbf6a' } },
  冥牙: { creature: { kind: 'dragon', col: '#7a5ad8' } },
  白衣阿风: { look: L('#26242c', '#f6f6fa', { bot: '#d8d8e4', accent: '#8aa8d8', style: 'long' }) },
  洛克: { look: L('#b05a22', '#8a6a3a', { bot: '#5a4a32', accent: '#c8a850', beard: '#b05a22', style: 'helm', armor: true }), scale: 0.85 },
  莱斯林克: { look: L('#d8e8a0', '#3a8a5a', { bot: '#2a6a44', accent: '#8ad0a0', style: 'long' }) },
  德鲁: { look: L('#a03020', '#7a3a2a', { bot: '#4a2a22', accent: '#c07040', armor: true, style: 'spike' }) },
  千里雪: { look: L('#e8e8f0', '#8a5ad0', { bot: '#4a3a78', accent: '#c8a8f0', style: 'long' }) },
  老板: { look: L('#6a4a2a', '#c85a3a', { bot: '#5a3a22', accent: '#e8d8a8', beard: '#6a4a2a', style: 'bald' }) },
  公会办事员: { look: L('#4a3a30', '#d8d0c0', { bot: '#6a5a4a', accent: '#c04040', style: 'short' }) },
  易苏三世: { look: L('#c8c0b0', '#8a2a2a', { bot: '#4a1a1a', accent: '#e0b64a', cape: '#aa2020', beard: '#c8c0b0', style: 'crown' }) },
  汉蒙候爵: { look: L('#8a6a3a', '#3a5a8a', { bot: '#2a3a5a', accent: '#d8d8e8', armor: true, style: 'helm' }) },
  沙若: { look: L('#6a4a30', '#6aa0d8', { bot: '#3a5a88', accent: '#f4f0e0', style: 'long' }) },
  林雨裳: { look: L('#2a2a3a', '#d84a5a', { bot: '#8a2a3a', accent: '#f4d8d8', style: 'long' }) },
  吟风: { creature: { kind: 'dragon2', col: '#3a5ea8' } },
  金色身影: { creature: { kind: 'dragon2', col: '#e0b030' } },
  池傲天: { look: L('#1a1a22', '#2a2a32', { bot: '#1a1a22', accent: '#c8c8d8', armor: true, cape: '#222233', style: 'short' }) },
  项天: { look: L('#4a2a2a', '#6a2a2a', { bot: '#3a2222', accent: '#c8a050', armor: true, style: 'spike' }) },
  红石大帝: { look: L('#3a3430', '#a82a2a', { bot: '#4a2020', accent: '#f0c850', cape: '#7a1a1a', beard: '#3a3430', style: 'crown' }) },
  灵宝儿: { look: L('#f0e8a8', '#8ad8a0', { bot: '#4aa070', accent: '#fff8d0', style: 'long' }), scale: 0.85 },
  霍恩斯: { look: L('#6a3a22', '#4a6a4a', { bot: '#34483a', accent: '#c8b070', armor: true, style: 'short' }) },
  凌云: { look: L('#2a2230', '#5a7ac8', { bot: '#34446a', accent: '#d8e0f8', armor: true, style: 'short' }) },
  易海兰: { look: L('#f0d878', '#e8e8f4', { bot: '#6a6a88', accent: '#e0c050', style: 'short', cape: '#3a3a6a' }) },
  塔扬: { look: L('#d8d8e0', '#e8e0c8', { bot: '#a8a090', accent: '#c8a850', style: 'hood' }) },
  火神: { look: L('#c84a1a', '#d85a2a', { bot: '#8a2a12', accent: '#ffcc50', cape: '#a82a0a', style: 'crown', beard: '#c84a1a' }) },
  日神: { look: L('#f0d048', '#f8e888', { bot: '#c8a830', accent: '#fff8c0', cape: '#e8c030', style: 'crown' }) },
  月神: { look: L('#c8d0f0', '#98a8e0', { bot: '#6a78b0', accent: '#e8f0ff', style: 'long' }) },
  光明神: { look: L('#f8f4e0', '#f4f0d8', { bot: '#d8d0b0', accent: '#f0d870', cape: '#fffaf0', style: 'crown', beard: '#f8f4e0' }) },
  智慧神: { look: L('#a83a22', '#7a3a8a', { bot: '#4a2a5a', accent: '#d8b8f0', beard: '#a83a22', style: 'crown' }) },
  战神: { look: L('#3a2a20', '#8a8a98', { bot: '#4a4a58', accent: '#d8d8e8', armor: true, style: 'helm', cape: '#7a1a1a' }) },
  爱神: { look: L('#f0a0b8', '#f8d0e0', { bot: '#d890a8', accent: '#fff0f4', style: 'long' }) },
  加百列: { look: L('#f0e8a0', '#f8f8ff', { bot: '#d8d8f0', accent: '#f0d870', style: 'long' }) },
  龙神派洛特: { look: L('#d8b030', '#e8d070', { bot: '#a88820', accent: '#fff0a0', cape: '#c89a20', style: 'crown', beard: '#d8b030' }) },
  创世神: { look: L('#8a8a96', '#c8c8d8', { bot: '#8a8a9a', accent: '#f0f0ff', style: 'short' }) },
  村民: { look: L('#5a4430', '#8a7a6a', { bot: '#5a4a3a', accent: '#c0b090', style: 'short' }) },
  猎人: { look: L('#4a3a2a', '#6a8a6a', { bot: '#4a5a3a', accent: '#a09060', style: 'hat' }) },
  士兵: { look: L('#3a3a3a', '#9aa0b0', { bot: '#5a6070', accent: '#d8d8e0', armor: true, style: 'helm' }) },
  旁白: {},
}

export const SKILLS: Record<string, Skill> = {}
const sk = (id: string, name: string, mp: number, kind: Skill['kind'], pow: number, desc: string) => {
  SKILLS[id] = { id, name, mp, kind, pow, desc }
}
sk('atk', '攻击', 0, 'phys', 1, '普通攻击')
sk('slash', '横斩', 0, 'phys', 1.15, '挥动双手大剑，稳定的斩击')
sk('shadow', '残像斩', 4, 'phys', 1.8, '留下剑之残像，多角度斩击')
sk('frostblade', '冰之刃', 5, 'mag', 1.6, '召唤冰之刃，冰系魔法')
sk('mohe', '莫赫·屏障', 3, 'buff', 1, '土系屏障，数回合内大幅提升防御')
sk('blizzard', '冰雪风暴', 9, 'aoe', 1.2, '冰雪风暴席卷全体敌人')
sk('iceforest', '冰之枪林', 14, 'aoe', 1.75, '冰枪自地面刺出，贯穿全体')
sk('magesword', '魔剑合击', 12, 'phys', 2.6, '魔武合一的重击，魔剑士的精髓')
sk('azure', '湛蓝·断空', 18, 'aoephys', 2.4, '湛蓝巨剑横扫全场')
sk('spear', '枪刺', 0, 'phys', 1.2, '骑士长枪突刺')
sk('bolt', '弩射', 0, 'phys', 1.1, '钢弩远射，不易被格挡')
sk('charge', '龙骑冲锋', 6, 'phys', 2.1, '以冲锋之势一击破敌')
sk('firstaid', '急救', 5, 'heal', 2.2, '野外急救，恢复一名同伴')
sk('bite', '撕咬', 0, 'phys', 1.1, '')
sk('breath', '冰息', 6, 'aoe', 1.45, '绿龙的冰系龙息，可使对手冻成冰雕')
sk('dive', '俯冲', 4, 'phys', 1.9, '从高空俯冲')
sk('fireball', '火球术', 5, 'mag', 1.5, '火系一级魔法')
sk('firewall', '火墙术', 9, 'aoe', 1.35, '火墙席卷全体')
sk('heal', '治疗术', 6, 'heal', 2.6, '恢复一名同伴的生命')
sk('rally', '鼓舞', 4, 'buff', 2, '鼓舞士气，数回合内攻击力提升')
sk('swordqi', '剑气纵横', 8, 'aoephys', 1.5, '无形剑气斩向全体')
sk('holy', '圣光', 6, 'mag', 1.7, '大地之神的圣光')
sk('blessing', '大地祝福', 8, 'heal', 3.2, '向大地之神祈祷，恢复同伴')
sk('claw', '利爪', 0, 'phys', 1, '')
sk('roar', '咆哮', 0, 'aoephys', 0.65, '')
sk('curse', '诅咒', 0, 'mag', 1.1, '')
sk('smash', '重击', 0, 'phys', 1.5, '')
sk('axe', '战斧劈砍', 0, 'phys', 1.3, '')
sk('fireb', '熔岩弹', 0, 'mag', 1.4, '')
sk('lance', '龙枪', 6, 'phys', 2.4, '')
sk('windcut', '风刃', 0, 'mag', 1.3, '')
sk('dragonfire', '龙息', 0, 'aoe', 1.2, '')
sk('drain', '吸血', 0, 'drain', 1, '')
sk('godwrath', '神之谴责', 0, 'aoe', 1.5, '')
sk('darkfire', '黑暗原火', 0, 'mag', 2.1, '')
sk('holysmite', '神罚', 0, 'aoe', 1.6, '')

const AT = (id: string, name: string, hp: number, mp: number, atk: number, def: number, mag: number, spd: number, skills: [number, string][], g: [number, number, number, number, number, number], look?: Look, creature?: ActorTpl['creature'], lv?: number): ActorTpl => ({
  id, name, hp, mp, atk, def, mag, spd, skills, lv,
  growth: { hp: g[0], mp: g[1], atk: g[2], def: g[3], mag: g[4], spd: g[5] },
  look, creature,
})
export const ACTORS: Record<string, ActorTpl> = {
  amy: AT('amy', '艾米', 62, 20, 12, 6, 10, 9, [[1, 'slash'], [1, 'mohe'], [2, 'frostblade'], [4, 'shadow'], [7, 'blizzard'], [11, 'iceforest'], [15, 'magesword'], [22, 'azure']], [14, 5, 3.2, 1.8, 2.6, 1.0], PORTRAITS.艾米.look),
  daqs: AT('daqs', '大青山', 78, 12, 13, 8, 3, 8, [[1, 'spear'], [1, 'bolt'], [3, 'charge'], [9, 'firstaid']], [17, 3, 3.3, 2.2, 0.6, 0.9], PORTRAITS.大青山.look),
  lver: AT('lver', '绿儿', 44, 24, 6, 5, 13, 11, [[1, 'bite'], [1, 'breath'], [5, 'dive'], [12, 'iceforest']], [11, 5, 1.6, 1.4, 3.2, 1.2], undefined, { kind: 'dragon', col: '#4cbf6a' }),
  yuchang: AT('yuchang', '林雨裳', 46, 38, 5, 4, 15, 8, [[1, 'fireball'], [1, 'heal'], [6, 'firewall']], [10, 6, 1.0, 1.3, 3.4, 0.9], PORTRAITS.林雨裳.look),
  shaoruo: AT('shaoruo', '沙若', 50, 30, 9, 5, 8, 13, [[1, 'bolt'], [1, 'rally'], [5, 'firstaid']], [11, 4, 2, 1.4, 1.6, 1.2], PORTRAITS.沙若.look),
  chi: AT('chi', '池寒枫', 90, 40, 16, 9, 8, 12, [[1, 'slash'], [1, 'charge'], [3, 'mohe'], [8, 'shadow']], [16, 4, 3.6, 2, 1, 1], PORTRAITS.池寒枫.look),
  afeng: AT('afeng', '白衣阿风', 220, 60, 30, 14, 26, 18, [[1, 'shadow'], [1, 'swordqi'], [1, 'mohe']], [0, 0, 0, 0, 0, 0], PORTRAITS.白衣阿风.look, undefined, 1),
  luoke: AT('luoke', '洛克', 190, 80, 18, 20, 24, 8, [[1, 'holy'], [1, 'blessing'], [1, 'smash']], [0, 0, 0, 0, 0, 0], PORTRAITS.洛克.look, undefined, 1),
  reslink: AT('reslink', '莱斯林克', 110, 90, 8, 8, 34, 12, [[1, 'fireball'], [1, 'frostblade'], [1, 'firewall']], [0, 0, 0, 0, 0, 0], PORTRAITS.莱斯林克.look, undefined, 1),
  leiger: AT('leiger', '雷葛', 300, 120, 15, 12, 50, 12, [[1, 'frostblade'], [1, 'blizzard'], [1, 'iceforest']], [0, 0, 0, 0, 0, 0], PORTRAITS.雷葛.look, undefined, 1),
  chiao: AT('chiao', '池傲天', 120, 20, 20, 12, 8, 11, [[1, 'lance'], [1, 'slash'], [8, 'charge']], [20, 3, 4, 2.6, 0.8, 1.1], PORTRAITS.池傲天.look),
  mingya: AT('mingya', '冥牙', 90, 40, 10, 8, 18, 12, [[1, 'bite'], [1, 'dragonfire'], [5, 'dive']], [14, 5, 2.4, 2, 3.4, 1.2], undefined, { kind: 'dragon', col: '#7a5ad8' }),
  lingyun: AT('lingyun', '凌云', 130, 30, 24, 14, 10, 12, [[1, 'slash'], [1, 'charge'], [10, 'shadow']], [18, 3, 3.6, 2.2, 1.0, 1.1], PORTRAITS.凌云.look),
}

export const ENEMIES: Record<string, EnemyTpl> = {}
const en = (e: EnemyTpl) => {
  ENEMIES[e.id] = e
}
const WOLF = { kind: 'wolf' as Creature, col: '#dfe8f4' }
en({ id: 'wolf', name: '雪狼', hp: 30, atk: 9, def: 2, mag: 0, spd: 8, exp: 12, gold: 5, skills: ['claw', 'bite'], creature: WOLF, drops: [['potion', 0.12]] })
en({ id: 'bear', name: '雪熊', hp: 84, atk: 14, def: 5, mag: 0, spd: 4, exp: 40, gold: 14, skills: ['claw', 'roar', 'smash'], creature: { kind: 'bear', col: '#f2f4f8' }, drops: [['potion', 0.3]] })
en({ id: 'bear2', name: '暴怒的母熊', hp: 70, atk: 12, def: 3, mag: 0, spd: 4, exp: 30, gold: 10, skills: ['claw', 'smash'], creature: { kind: 'bear', col: '#e4e6ec' } })
en({ id: 'bat', name: '白蝙蝠', hp: 20, atk: 8, def: 1, mag: 0, spd: 14, exp: 10, gold: 4, skills: ['bite'], creature: { kind: 'bat', col: '#e8ecf4' } })
en({ id: 'ghost', name: '白色妖灵', hp: 36, atk: 6, def: 3, mag: 13, spd: 9, exp: 16, gold: 6, skills: ['curse', 'claw'], creature: { kind: 'ghost', col: '#e8f0ff' } })
en({ id: 'skel', name: '骷髅战士', hp: 56, atk: 16, def: 8, mag: 0, spd: 7, exp: 22, gold: 8, skills: ['slash', 'smash'], look: L('#e8e4d4', '#cfc8b0', { skin: '#e8e4d4', bot: '#b8b098', accent: '#8a8470', style: 'bald' }), drops: [['potion', 0.2]] })
en({ id: 'zombie', name: '僵尸', hp: 74, atk: 15, def: 6, mag: 0, spd: 3, exp: 24, gold: 8, skills: ['claw', 'smash'], look: L('#3a4a30', '#5a6a4a', { skin: '#8aa070', bot: '#3a4030', accent: '#6a7a50', style: 'short' }) })
en({ id: 'bers', name: '狂战士', hp: 120, atk: 20, def: 9, mag: 0, spd: 8, exp: 70, gold: 30, skills: ['axe', 'smash'], look: PORTRAITS.德鲁.look })
en({ id: 'bers1', name: '狂战士·德鲁', hp: 70, atk: 12, def: 5, mag: 0, spd: 8, exp: 50, gold: 40, skills: ['axe', 'smash'], look: PORTRAITS.德鲁.look })
en({ id: 'lava', name: '熔岩魔', hp: 110, atk: 22, def: 10, mag: 18, spd: 6, exp: 52, gold: 18, skills: ['fireb', 'smash'], creature: { kind: 'golem', col: '#c0502a' } })
en({ id: 'yinfeng', name: '双头龙·吟风', hp: 3000, atk: 38, def: 20, mag: 36, spd: 12, exp: 400, gold: 0, skills: ['windcut', 'dragonfire', 'godwrath', 'darkfire'], creature: { kind: 'dragon2', col: '#3a5ea8' }, scale: 2.2 })
en({ id: 'sandliz', name: '沙蜥', hp: 150, atk: 30, def: 14, mag: 0, spd: 8, exp: 90, gold: 40, skills: ['claw', 'smash'], creature: { kind: 'lizard', col: '#c8a258' } })
en({ id: 'bandit', name: '强盗', hp: 110, atk: 24, def: 10, mag: 0, spd: 9, exp: 60, gold: 50, skills: ['slash', 'smash'], look: L('#2a2220', '#6a4a3a', { bot: '#3a2a22', accent: '#a88a5a', style: 'hood' }) })
en({ id: 'beast', name: '森林狂兽', hp: 90, atk: 20, def: 8, mag: 0, spd: 10, exp: 46, gold: 20, skills: ['claw', 'bite'], creature: { kind: 'beast', col: '#6a8a4a' } })
en({ id: 'soldier', name: '士兵', hp: 120, atk: 26, def: 14, mag: 0, spd: 8, exp: 70, gold: 30, skills: ['slash', 'smash'], look: PORTRAITS.士兵.look })
en({ id: 'knight', name: '伪龙骑士', hp: 260, atk: 40, def: 22, mag: 10, spd: 12, exp: 200, gold: 100, skills: ['lance', 'slash'], creature: { kind: 'rider', col: '#7a8a6a' }, scale: 1.7 })
en({ id: 'blkknight', name: '黑龙骑士', hp: 340, atk: 52, def: 26, mag: 10, spd: 12, exp: 260, gold: 120, skills: ['lance', 'dragonfire'], creature: { kind: 'rider', col: '#2a2a36' }, scale: 1.7 })
en({ id: 'hanmeng', name: '汉蒙候爵', hp: 140, atk: 20, def: 10, mag: 6, spd: 12, exp: 120, gold: 200, skills: ['lance', 'slash'], creature: { kind: 'rider', col: '#5aa0d8' }, scale: 1.7 })
en({ id: 'altheist', name: '地行龙骑兵', hp: 90, atk: 18, def: 9, mag: 0, spd: 8, exp: 40, gold: 20, skills: ['lance'], creature: { kind: 'lizard', col: '#8a7a5a' } })
en({ id: 'fakedragon', name: '伪龙', hp: 380, atk: 60, def: 26, mag: 20, spd: 13, exp: 320, gold: 100, skills: ['dragonfire', 'claw'], creature: { kind: 'dragon2', col: '#8a7a4a' }, scale: 1.8 })
en({ id: 'pope', name: '教廷圣骑士', hp: 280, atk: 44, def: 24, mag: 20, spd: 11, exp: 220, gold: 90, skills: ['slash', 'holysmite'], look: L('#d8d8e8', '#f0f0f8', { bot: '#c0c0d8', accent: '#e0c050', armor: true, style: 'helm' }) })
en({ id: 'xiangtian', name: '项天', hp: 420, atk: 46, def: 22, mag: 10, spd: 12, exp: 300, gold: 0, skills: ['axe', 'smash'], look: PORTRAITS.项天.look })
en({ id: 'angel', name: '神殿天使', hp: 520, atk: 62, def: 30, mag: 50, spd: 14, exp: 700, gold: 0, skills: ['holysmite', 'slash'], look: L('#f0e8a0', '#f8f8ff', { bot: '#d8d8f0', accent: '#f0d870', style: 'long', armor: true }), scale: 1.6 })
en({ id: 'warg', name: '战神法相', hp: 900, atk: 78, def: 36, mag: 20, spd: 13, exp: 1200, gold: 0, skills: ['smash', 'axe', 'godwrath'], look: PORTRAITS.战神.look, scale: 2.2 })
en({ id: 'skyguard', name: '天空之城魔像', hp: 320, atk: 50, def: 28, mag: 30, spd: 8, exp: 260, gold: 60, skills: ['smash', 'holysmite'], creature: { kind: 'golem', col: '#9ab0d0' }, scale: 1.5 })
en({ id: 'wyvern', name: '伪龙骑士·风', hp: 300, atk: 52, def: 24, mag: 12, spd: 13, exp: 240, gold: 90, skills: ['lance', 'windcut'], creature: { kind: 'rider', col: '#6aa88a' }, scale: 1.6 })

export const ITEMS: Record<string, ItemDef> = {}
const it = (id: string, name: string, kind: ItemDef['kind'], amount: number, price: number, desc: string) => {
  ITEMS[id] = { id, name, kind, amount, price, desc }
}
it('potion', '伤药', 'hp', 70, 18, '恢复 70 点生命')
it('hipotion', '雪莲膏', 'hp', 220, 70, '恢复 220 点生命')
it('mpotion', '魔晶粉', 'mp', 35, 28, '恢复 35 点魔力')
it('elixir', '圣泉水', 'both', 999, 160, '生命与魔力完全恢复')
it('revive', '还魂草', 'revive', 50, 90, '令倒下的同伴复活')
it('jerky', '蜥蜴干', 'hp', 30, 6, '绿儿最爱的零食，恢复 30 点生命')
it('letter', '池寒枫的信', 'key', 0, 0, '一封熟悉笔迹的信')
it('leaf', '精灵树叶护符', 'key', 0, 0, '用精灵魔导师的血肉化成的护身符')
it('ring', '暗戒', 'key', 0, 0, '蕴含九系精灵的戒指')
it('badge', '智慧神金属牌', 'key', 0, 0, '上位智慧神留下的标牌')

export const SHOPS: Record<string, string[]> = {
  store: ['potion', 'mpotion', 'jerky'],
  bar: ['potion', 'hipotion', 'mpotion'],
  mid: ['potion', 'hipotion', 'mpotion', 'revive'],
  late: ['hipotion', 'mpotion', 'elixir', 'revive'],
}

export const expNeed = (lv: number) => lv * lv * 14 + 20
