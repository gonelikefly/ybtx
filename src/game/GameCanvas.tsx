import { useEffect, useRef } from 'react'
import { engine } from './engine'
import { DOWN, LEFT, RIGHT, UP } from './sprites'
import type { Dir } from './sprites'

const KEYS: Record<string, Dir> = {
  arrowup: UP, w: UP, arrowdown: DOWN, s: DOWN, arrowleft: LEFT, a: LEFT, arrowright: RIGHT, d: RIGHT,
}
const NAV: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
}

export function GameCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const el = box.current!
    const fit = () => engine.resize(el.clientWidth, el.clientHeight)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    engine.attach(cv)
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      ;(document.activeElement as HTMLElement | null)?.blur?.()
      if (k === 'shift') {
        engine.run = true
        return
      }
      if (KEYS[k] !== undefined) {
        e.preventDefault()
        if (!e.repeat) engine.setHeld(KEYS[k], true)
        engine.press(NAV[k])
      } else if (k === 'enter' || k === ' ' || k === 'z' || k === 'e') {
        e.preventDefault()
        engine.press('confirm')
      } else if (k === 'escape' || k === 'x' || k === 'q' || k === 'backspace') {
        e.preventDefault()
        engine.press('cancel')
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'shift') engine.run = false
      if (KEYS[k] !== undefined) engine.setHeld(KEYS[k], false)
    }
    const blur = () => {
      engine.held = []
      engine.run = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      ro.disconnect()
      engine.detach()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
  return (
    <div ref={box} className="gc-box">
      <canvas ref={ref} className="gc-canvas" />
    </div>
  )
}
