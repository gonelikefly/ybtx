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
