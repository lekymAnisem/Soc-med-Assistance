/**
 * Tiny reactive store shared between DOM and WebGL worlds.
 * Emits raw state to subscribers — no React dependency.
 */
class MiniStore {
  constructor(initial = {}) {
    this.state = { ...initial }
    this.subscribers = new Set()
  }

  set(patch) {
    let changed = false
    for (const key of Object.keys(patch)) {
      if (this.state[key] !== patch[key]) {
        this.state[key] = patch[key]
        changed = true
      }
    }
    if (changed) this._emit()
  }

  get() {
    return this.state
  }

  _emit() {
    for (const fn of this.subscribers) fn(this.state)
  }

  subscribe(fn) {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }
}

export const world = new MiniStore({
  mouseX: 0,
  mouseY: 0,
  scroll: 0,
  experiment: 0,
  ai: 0,
  quality: 'high',
  focus: null,
  loaded: false,
})

export default world