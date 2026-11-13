import { MAP_LIST } from './maps'
import { INTRO } from './story1'
import './story2'
import { NPC_LIST, TRIG_LIST, SIGN_MAP, D, npc } from './storyKit'
import { PORTRAITS } from './data'
import { ANCH } from './maps'

for (const w of MAP_LIST.hall.warps) {
  w.when = () => false
  w.deny = D('艾米：答案，就在这座大殿里。现在还不能走。')
}

export const NPCS = NPC_LIST
export const TRIGGERS = TRIG_LIST
export const SIGNS = SIGN_MAP
export { INTRO }

// 铁匠与导师：用金币强化装备、修炼技能
const forgeNpc = (map: string, x: number, y: number) =>
  npc({ id: `smith_${map}`, name: '铁匠', map, x, y, look: { hair: '#4a3222', top: '#7a4a2a', bot: '#3a2a22', accent: '#c8c8d0', beard: '#4a3222', style: 'bald' }, talk: [...D('铁匠：好钢要用金币喂。要强化武器、护甲还是护符？'), { t: 'forge' }] })
const trainNpc = (map: string, x: number, y: number) =>
  npc({ id: `tutor_${map}`, name: '导师', map, x, y, look: { hair: '#d8d8e8', top: '#3a5ea8', accent: '#4a70c0', style: 'hat', beard: '#d8d8e8' }, talk: [...D('导师：招式练得越熟，威力越大。付些学费，我来指点你们。'), { t: 'train' }] })
forgeNpc('treebar', 3, 11)
trainNpc('treebar', 6, 11)
for (const map of ['capital', 'lioncity', 'redcity', 'hamburg', 'xilin']) {
  const [px, py] = ANCH[map].plaza ?? [20, 16]
  forgeNpc(map, px - 2, py - 2)
  trainNpc(map, px + 2, py - 2)
}

// 城镇路人
const CROWD: Record<string, string[]> = {
  capital: ['雪都的冬天很长，但王宫的炉火从不熄灭。', '听说有个叫艾米的少年，让国王免了狼头税。', '飞龙竞技场的票，一张能炒到三十金币。'],
  lioncity: ['狮城的城墙，是用三百年的石头垒的。', '教廷的军队又来了，可狮城还在。', '那个射三箭的少年，是我们的英雄。'],
  redcity: ['红石陛下的寿辰快到了，满城都在布置。', '池家的少主一向冷脸，可他对叔叔是真心。', '最近城里多了不少教廷的人，我心里不踏实。'],
  hamburg: ['汉堡城墙再高，也要有人守。', '伯爵大人常在城头看海。', '听说池寒枫大人夜袭收回了这座城。'],
  xilin: ['黑帮垮了，西林的街上又有孩子玩耍了。', '小佣兵团每个月来一次，大家都盼着。'],
}
const LOOKS = [PORTRAITS.村民.look, PORTRAITS.猎人.look, PORTRAITS.士兵.look, PORTRAITS.老板.look]
for (const [map, lines] of Object.entries(CROWD)) {
  const [px, py] = ANCH[map].plaza ?? [20, 16]
  const spots: [number, number][] = [[px - 3, py], [px + 3, py + 1], [px, py + 2]]
  spots.forEach(([x, y], i) => {
    npc({ id: `crowd_${map}_${i}`, name: '路人', map, x, y, look: LOOKS[(i + map.length) % LOOKS.length], wander: true, talk: D(`路人：${lines[i % lines.length]}`) })
  })
}
