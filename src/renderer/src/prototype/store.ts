// PROTOTYPE — throwaway shared state. In memory only; refresh resets everything.
import { useSyncExternalStore } from 'react'
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
  private version = 0
  private listeners = new Set<() => void>()

  inbox: EmailMsg[] = [...seedEmails]
  rules: MarkedItem[] = [...seedRules]
  marks: Record<string, MarkAction> = {}
  selection = new Set<string>()
  autoApply = false
  search = ''
  /** Messages already sent to Gmail this session — only for the prototype's counters. */
  applied: { id: string; action: MarkAction }[] = []
  /** Staging history, newest last. Parallel to `marks`, which stays the source of truth. */
  ops: Op[] = []

  get snapshot(): number {
    return this.version
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Notify React subscribers after a direct workspace property update. */
  notify(): void {
    this.version += 1
    this.listeners.forEach((listener) => listener())
  }

  setSearch(value: string): void {
    this.search = value
    this.notify()
  }

  setAutoApply(value: boolean): void {
    this.autoApply = value
    this.notify()
  }

  setSelection(value: Set<string>): void {
    this.selection = new Set(value)
    this.notify()
  }

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
    if (ids.length === 0) return
    if (this.autoApply) {
      this.applyIds(ids, action)
      return
    }

    const fresh = ids.filter((id) => this.marks[id] !== action)
    this.marks = { ...this.marks, ...Object.fromEntries(ids.map((id) => [id, action])) }
    if (fresh.length) {
      this.ops = [
        ...this.ops,
        {
          id: 'op' + this.ops.length + '-' + fresh[0],
          action,
          ids: fresh,
          label: this.describe(fresh),
          viaRule
        }
      ]
    }
    this.selection = new Set()
    this.notify()
  }

  /** "4 from UW CIRCLE" / "6 messages" — how a staging area names a bulk action. */
  private describe(ids: string[]): string {
    const messages = this.inbox.filter((m) => ids.includes(m.id))
    if (messages.length === 1) return messages[0].subject
    const senders = new Set(messages.map((m) => senderAddr(m.from)))
    return senders.size === 1
      ? messages.length + ' from ' + senderName(messages[0].from)
      : messages.length + ' messages'
  }

  unmark(ids: string[]): void {
    const next = { ...this.marks }
    ids.forEach((id) => delete next[id])
    this.marks = next
    this.pruneOps()
    this.notify()
  }

  unmarkAll(): void {
    this.marks = {}
    this.ops = []
    this.notify()
  }

  undoOp(opId: string): void {
    const op = this.ops.find((item) => item.id === opId)
    if (!op) return
    const next = { ...this.marks }
    op.ids.forEach((id) => delete next[id])
    this.marks = next
    this.ops = this.ops.filter((item) => item.id !== opId)
    this.pruneOps()
    this.notify()
  }

  /** Drop ids from ops that are no longer marked, and ops left empty. */
  private pruneOps(): void {
    this.ops = this.ops
      .map((op) => ({ ...op, ids: op.ids.filter((id) => this.marks[id] === op.action) }))
      .filter((op) => op.ids.length > 0)
  }

  applyAll(): void {
    Object.entries(this.marks).forEach(([id, action]) => this.applied.push({ id, action }))
    const ids = new Set(Object.keys(this.marks))
    this.inbox = this.inbox.filter((m) => !ids.has(m.id))
    this.marks = {}
    this.ops = []
    this.selection = new Set()
    this.notify()
  }

  applyIds(ids: string[], action: MarkAction): void {
    this.applied = [...this.applied, ...ids.map((id) => ({ id, action }))]
    const idSet = new Set(ids)
    this.inbox = this.inbox.filter((m) => !idSet.has(m.id))
    const next = { ...this.marks }
    ids.forEach((id) => delete next[id])
    this.marks = next
    this.pruneOps()
    this.selection = new Set()
    this.notify()
  }

  toggle(id: string): void {
    const next = new Set(this.selection)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    this.selection = next
    this.notify()
  }

  /** Pending marks the saved sender rules would produce against the current Inbox. */
  runQuery(): number {
    const byAction: Record<MarkAction, string[]> = { archive: [], trash: [] }
    for (const message of this.inbox) {
      const rule = this.rules.find((item) =>
        message.from.toLowerCase().includes(item.from.trim().toLowerCase())
      )
      if (rule && this.marks[message.id] !== rule.action) byAction[rule.action].push(message.id)
    }

    let count = 0
    for (const [action, ids] of Object.entries(byAction) as [MarkAction, string[]][]) {
      if (!ids.length) continue
      count += ids.length
      this.mark(ids, action, true)
    }
    return count
  }

  ruleFor(from: string): MarkedItem | undefined {
    return this.rules.find(
      (rule) => rule.from.trim() && from.toLowerCase().includes(rule.from.trim().toLowerCase())
    )
  }

  addRule(from: string, action: MarkAction): void {
    const key = senderAddr(from)
    const existing = this.rules.find((rule) => rule.from === key)
    this.rules = existing
      ? this.rules.map((rule) => (rule.id === existing.id ? { ...rule, action } : rule))
      : [{ id: 'r' + Date.now(), from: key, action }, ...this.rules]
    this.notify()
  }

  updateRule(id: string, action: MarkAction): void {
    if (!this.rules.some((rule) => rule.id === id)) return
    this.rules = this.rules.map((rule) => (rule.id === id ? { ...rule, action } : rule))
    this.notify()
  }

  removeRule(id: string): void {
    this.rules = this.rules.filter((rule) => rule.id !== id)
    this.notify()
  }

  reset(): void {
    this.inbox = [...seedEmails]
    this.rules = [...seedRules]
    this.marks = {}
    this.ops = []
    this.selection = new Set()
    this.applied = []
    this.search = ''
    this.notify()
  }
}

export const ws = new Workspace()

export function useWorkspace(): Workspace {
  useSyncExternalStore(
    ws.subscribe,
    () => ws.snapshot,
    () => ws.snapshot
  )
  return ws
}
