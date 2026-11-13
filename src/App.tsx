import { useEffect, useSyncExternalStore } from 'react'
import { GameCanvas } from './game/GameCanvas'
import { engine, lookURL } from './game/engine'
import type { BView } from './game/engine'
import { PORTRAITS } from './game/data'
import { DOWN, LEFT, RIGHT, UP } from './game/sprites'
import type { Dir } from './game/sprites'
import './App.css'

if (import.meta.env.DEV) Object.assign(window, { __engine: engine })

function Face({ who }: { who: string }) {
  const p = PORTRAITS[who]
  if (!p || (!p.look && !p.creature)) return null
  return (
    <div className="face">
      <img src={lookURL(p, 'front')} alt={who} />
    </div>
  )
}

function Pad({ d, label }: { d: Dir; label: string }) {
  const nav = d === UP ? 'up' : d === DOWN ? 'down' : d === LEFT ? 'left' : 'right'
  useEffect(() => {
    const release = () => engine.setHeld(d, false)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('touchend', release)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('touchend', release)
      window.removeEventListener('blur', release)
      release()
    }
  }, [d])
  return (
    <button
      className={`pad pad-${nav}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        engine.setHeld(d, true)
        engine.press(nav)
      }}
      onPointerUp={() => engine.setHeld(d, false)}
      onPointerCancel={() => engine.setHeld(d, false)}
      onPointerLeave={() => engine.setHeld(d, false)}
    />
  )
}

function BattleView({ b }: { b: BView }) {
  return (
    <div className={`battle bg-${b.bg}`}>
      <div className="b-enemies">
        {b.enemies.map((e, i) => (
          <div key={e.uid} className={`b-enemy ${e.dead ? 'dead' : ''} ${b.hit && b.hit.side === 'e' && b.hit.idx === i ? 'hit' : ''}`}>
            <div className="b-name">{e.name}</div>
            <div className="bar"><i style={{ width: `${(e.hp / e.mhp) * 100}%` }} /></div>
            <img key={b.hit?.side === 'e' && b.hit.idx === i ? b.hit.n : 0} src={e.img} style={{ height: `${Math.round(104 * e.scale)}px` }} alt={e.name} />
            {b.pops.filter((p) => p.side === 'e' && p.idx === i).map((p) => (
              <span key={p.id} className={`pop ${p.kind}`}>{p.text}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="b-party">
        {b.party.map((p, i) => (
          <div key={p.id} className={`b-member ${p.acting ? 'acting' : ''} ${p.dead ? 'dead' : ''}`}>
            <img key={b.hit?.side === 'p' && b.hit.idx === i ? b.hit.n : 0} className={b.hit && b.hit.side === 'p' && b.hit.idx === i ? 'hit' : ''} src={p.img} alt={p.name} />
            <div className="b-card">
              <b>{p.name}</b> <small>Lv.{p.lv}</small>
              <div className="bar hp"><i style={{ width: `${(p.hp / p.mhp) * 100}%` }} /></div>
              <div className="num">生命 {p.hp}/{p.mhp}</div>
              <div className="bar mp"><i style={{ width: `${(p.mp / Math.max(1, p.mmp)) * 100}%` }} /></div>
              <div className="num">魔力 {p.mp}/{p.mmp}</div>
            </div>
            {b.pops.filter((q) => q.side === 'p' && q.idx === i).map((q) => (
              <span key={q.id} className={`pop ${q.kind}`}>{q.text}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="b-log">{b.log}</div>
    </div>
  )
}

export default function App() {
  useSyncExternalStore(engine.subscribe, engine.getVersion)
  const u = engine.ui
  const menu = u.menu
  const cls = menu?.kind === 'battle' ? 'menu-battle' : menu?.kind === 'choice' ? 'menu-choice' : menu?.kind === 'title' ? 'menu-title' : 'menu-field'
  return (
    <div className="stage">
      <GameCanvas />
      <div className="ver">{__APP_VERSION__}</div>

      {!u.started && !u.card && (
        <div className="title">
          <h1>佣兵天下</h1>
          <p>艾米与大青山的冰雪友情</p>
          <small>依据同名长篇小说改编 · 方向键/WASD 移动 · Enter/Z 确认 · Esc/X 菜单</small>
        </div>
      )}

      {u.started && !u.battle && (
        <div className="hud">
          <div className="hud-l">
            {u.obj && <div className="obj"><span>目标</span>{u.obj}</div>}
          </div>
          <div className="hud-r">
            <span className="gold">{u.gold} 金</span>
            <button className="menu-btn" onClick={() => engine.press('cancel')}>菜单</button>
          </div>
        </div>
      )}
      {u.banner && <div className="banner" key={u.banner}>{u.banner}</div>}
      {u.toast && <div className="toast" key={u.toast}>{u.toast}</div>}

      {u.battle && <BattleView b={u.battle} />}

      {u.dialog && (
        <div className="dialog" onClick={() => engine.press('confirm')}>
          {u.dialog.who && <Face who={u.dialog.who} />}
          <div className="d-box">
            {u.dialog.who && <div className="d-who">{u.dialog.who}</div>}
            <div className="d-text">{u.dialog.text.slice(0, Math.floor(u.dialog.typed))}</div>
            {u.dialog.typed >= u.dialog.text.length && <span className="d-next">▼</span>}
          </div>
        </div>
      )}

      {menu && (
        <div className={`menu ${cls}`}>
          {menu.title && <div className="m-title">{menu.title}</div>}
          {menu.items.map((it, i) => (
            <button
              key={i}
              disabled={it.disabled}
              className={`m-item ${i === menu.idx ? 'on' : ''}`}
              onClick={() => engine.pickMenu(i)}
            >
              <span>{it.label}</span>
              {it.sub && <small>{it.sub}</small>}
            </button>
          ))}
          {menu.cancel && <button className="m-back" onClick={() => engine.press('cancel')}>返回</button>}
        </div>
      )}

      {u.timing && (
        <div className="timing">
          <div className="t-title">{u.timing.title}</div>
          <div className="t-bar">
            <div className="t-zone" />
            <div className="t-cur" style={{ left: `${u.timing.pos * 100}%` }} />
          </div>
          <div className="t-info">{u.timing.got} / {u.timing.need} · {u.timing.msg}</div>
          <button className="t-btn" onPointerDown={() => engine.press('confirm')}>出手！</button>
        </div>
      )}

      {u.info && (
        <div className="info" onClick={() => engine.press('confirm')}>
          <h3>{u.info.title}</h3>
          {u.info.lines.map((l, i) => <p key={i}>{l}</p>)}
          <small>按 Enter 关闭</small>
        </div>
      )}

      {(u.card || u.chapter) && (
        <div className="cover" onClick={() => engine.press('confirm')}>
          {u.chapter && (
            <div className="chap">
              <div className="c1">{u.chapter.title}</div>
              <div className="c2">{u.chapter.sub}</div>
              {u.chapter.lines.map((l, i) => <p key={i}>{l || '\u00A0'}</p>)}
            </div>
          )}
          {u.card && (
            <div className="chap card">
              {u.card.title && <div className="c2">{u.card.title}</div>}
              {u.card.lines.map((l, i) => <p key={i}>{l || '\u00A0'}</p>)}
            </div>
          )}
          <small className="cont">点击或按 Enter 继续</small>
        </div>
      )}

      <div className="fade" style={{ opacity: u.fade }} />

      {u.end && (
        <div className="end">
          <h2>《佣兵天下》</h2>
          <p>长剑终将入鞘，战士已然归于尘土，如此而已。</p>
          <button onClick={() => location.reload()}>回到标题</button>
        </div>
      )}

      {u.started && !u.dialog && !menu && !u.battle && !u.timing && (
        <div className="touch">
          <div className="dpad">
            <Pad d={UP} label="上" />
            <Pad d={LEFT} label="左" />
            <Pad d={RIGHT} label="右" />
            <Pad d={DOWN} label="下" />
          </div>
          <div className="btns">
            <button className="b-b" onClick={() => engine.press('cancel')}>菜单</button>
            <button className="b-a" onClick={() => engine.press('confirm')}>调查</button>
          </div>
        </div>
      )}
    </div>
  )
}
