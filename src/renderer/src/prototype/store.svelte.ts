// PROTOTYPE — throwaway shared state. In memory only; refresh resets everything.
import type { EmailMsg, MarkAction, MarkedItem } from '../types'
import { emails as seedEmails, rules as seedRules, senderAddr, senderName } from './fixtures'

/**
 * One bulk staging action, kept so a staging area can show what the user *did*
 * ("archived 4 from UW CIRCLE") rather than only what is pending message by message.
 */
export type Op = {
  id: string
  action: MarkAction
  ids: string[]
  label: string
  viaRule: boolean
}

class Workspace {
  inbox = $state<EmailMsg[]>([...seedEmails])
  rules = $state<MarkedItem[]>([...seedRules])
  marks = $state<Record<string, MarkAction>>({})
  selection = $state<Set<string>>(new Set())
  autoApply = $state(false)
  search = $state('')
  /** Messages already sent to Gmail this session — only for the prototype's counters. */
  applied = $state<{ id: string; action: MarkAction }[]>([])
  /** Staging history, newest last. Parallel to `marks`, which stays the source of truth. */
  ops = $state<Op[]>([])

  get markedCount(): number {
    return Object.keys(this.marks).length
  }

  get filtered(): EmailMsg[] {
    const q = this.search.trim().toLowerCase()
    if (!q) return this.inbox
    return this.inbox.filter(
      (m) =>
        m.from.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q)
    )
  }

  mark(ids: string[], action: MarkAction, viaRule = false): void {
    if (this.autoApply) {
      this.applyIds(ids, action)
      return
    }
    const fresh = ids.filter((id) => this.marks[id] !== action)
    for (const id of ids) this.marks[id] = action
    if (fresh.length) {
      this.ops.push({
        id: 'op' + this.ops.length + '-' + fresh[0],
        action,
        ids: fresh,
        label: this.describe(fresh),
        viaRule
      })
    }
    this.selection = new Set()
  }

  /** "4 from UW CIRCLE" / "6 messages" — how a staging area names a bulk action. */
  private describe(ids: string[]): string {
    const msgs = this.inbox.filter((m) => ids.includes(m.id))
    if (msgs.length === 1) return msgs[0].subject
    const senders = new Set(msgs.map((m) => senderAddr(m.from)))
    return senders.size === 1
      ? msgs.length + ' from ' + senderName(msgs[0].from)
      : msgs.length + ' messages'
  }

  unmark(ids: string[]): void {
    for (const id of ids) delete this.marks[id]
    this.pruneOps()
  }

  unmarkAll(): void {
    this.marks = {}
    this.ops = []
  }

  undoOp(opId: string): void {
    const op = this.ops.find((o) => o.id === opId)
    if (!op) return
    for (const id of op.ids) delete this.marks[id]
    this.ops = this.ops.filter((o) => o.id !== opId)
  }

  /** Drop ids from ops that are no longer marked, and ops left empty. */
  private pruneOps(): void {
    this.ops = this.ops
      .map((o) => ({ ...o, ids: o.ids.filter((id) => this.marks[id] === o.action) }))
      .filter((o) => o.ids.length > 0)
  }

  applyAll(): void {
    for (const [id, action] of Object.entries(this.marks)) this.applied.push({ id, action })
    const ids = new Set(Object.keys(this.marks))
    this.inbox = this.inbox.filter((m) => !ids.has(m.id))
    this.marks = {}
    this.ops = []
    this.selection = new Set()
  }

  applyIds(ids: string[], action: MarkAction): void {
    for (const id of ids) this.applied.push({ id, action })
    const set = new Set(ids)
    this.inbox = this.inbox.filter((m) => !set.has(m.id))
    for (const id of ids) delete this.marks[id]
    this.pruneOps()
    this.selection = new Set()
  }

  toggle(id: string): void {
    const next = new Set(this.selection)
    next.has(id) ? next.delete(id) : next.add(id)
    this.selection = next
  }

  /** Pending marks the saved sender rules would produce against the current Inbox. */
  runQuery(): number {
    const byAction: Record<string, string[]> = { archive: [], trash: [] }
    for (const m of this.inbox) {
      const rule = this.rules.find((r) => m.from.toLowerCase().includes(r.from.toLowerCase()))
      if (rule && this.marks[m.id] !== rule.action) byAction[rule.action].push(m.id)
    }
    let n = 0
    for (const [action, ids] of Object.entries(byAction)) {
      if (!ids.length) continue
      n += ids.length
      this.mark(ids, action as MarkAction, true)
    }
    return n
  }

  ruleFor(from: string): MarkedItem | undefined {
    return this.rules.find((r) => from.toLowerCase().includes(r.from.toLowerCase()))
  }

  addRule(from: string, action: MarkAction): void {
    const key = senderAddr(from)
    const existing = this.rules.find((r) => r.from === key)
    if (existing) existing.action = action
    else this.rules.push({ id: 'r' + Date.now(), from: key, action })
  }

  removeRule(id: string): void {
    this.rules = this.rules.filter((r) => r.id !== id)
  }

  reset(): void {
    this.inbox = [...seedEmails]
    this.rules = [...seedRules]
    this.marks = {}
    this.ops = []
    this.selection = new Set()
    this.applied = []
    this.search = ''
  }
}

export const ws = new Workspace()
