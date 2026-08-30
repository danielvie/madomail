// PROTOTYPE — throwaway variant switcher.
import { useEffect, useState } from 'react'
import ThemePicker, { loadTheme } from '../components/ThemePicker'
import { ws } from './store'
import V01 from './variants/V01SenderStacks'
import V02 from './variants/V02CardDeck'
import V03 from './variants/V03Commander'
import V04 from './variants/V04Digest'
import V05 from './variants/V05Palette'
import V06 from './variants/V06Board'
import V07 from './variants/V07ThreePane'
import V08 from './variants/V08Terminal'
import V09 from './variants/V09RuleCockpit'
import V10 from './variants/V10FocusQueue'
import V11 from './variants/V11TriageDesk'
import V12 from './variants/V12SweepTable'
import V13 from './variants/V13RuleRail'
import V14 from './variants/V14ByExample'
import V15 from './variants/V15MarkedTable'
import V16 from './variants/V16BinDrawer'
import V17 from './variants/V17OperationLog'
import V18 from './variants/V18BeforeAfter'
import V19 from './variants/V19ReviewSheet'
import V20 from './variants/V20Conveyor'
import V21 from './variants/V21Bins'
import V22 from './variants/V22Ledger'
import V23 from './variants/V23Combined'

const variants = [
  {
    n: 1,
    name: 'Sender Stacks',
    idea: 'Group by sender; triage a whole sender in one move.',
    score: 2,
    Component: V01
  },
  {
    n: 2,
    name: 'Card Deck',
    idea: 'One message at a time, keyboard-driven, with undo.',
    score: 1,
    Component: V02
  },
  {
    n: 3,
    name: 'Commander',
    idea: 'Two panes: Inbox left, staged marks right.',
    score: 8,
    Component: V03
  },
  {
    n: 4,
    name: 'Digest',
    idea: 'Grouped by day, noise collapsed behind a summary line.',
    score: 6,
    Component: V04
  },
  {
    n: 5,
    name: 'Palette',
    idea: 'Empty canvas; everything through a command palette.',
    score: 4,
    Component: V05
  },
  {
    n: 6,
    name: 'Board',
    idea: 'Kanban columns — Inbox / Archive / Delete.',
    score: 6,
    Component: V06
  },
  {
    n: 7,
    name: 'Three Pane',
    idea: 'Sender sidebar, list, persistent reading pane.',
    score: 7,
    Component: V07
  },
  {
    n: 8,
    name: 'Terminal',
    idea: 'Monospace TUI, vim keys, status line.',
    score: 4,
    Component: V08
  },
  {
    n: 9,
    name: 'Rule Cockpit',
    idea: 'Rules are the object; Inbox is their dry-run diff.',
    score: 7,
    Component: V09
  },
  {
    n: 10,
    name: 'Focus Queue',
    idea: 'A timed triage session in batches of five.',
    score: 3,
    Component: V10
  },
  {
    n: 11,
    name: 'Triage Desk',
    idea: '3+7: Inbox | Reader | Staged, bulk select, no context switch.',
    score: 7,
    Component: V11
  },
  {
    n: 12,
    name: 'Sweep Table',
    idea: 'Retry of 1 as a dense table: sender bands + docked tray.',
    score: 8,
    Component: V12
  },
  {
    n: 13,
    name: 'Rule Rail',
    idea: '9 at table density: rules rail, residue list, one-click "always".',
    score: 6,
    Component: V13
  },
  {
    n: 14,
    name: 'By Example',
    idea: 'Touch one row, get the whole batch it belongs to.',
    score: 4,
    Component: V14
  },
  {
    n: 15,
    name: 'Marked Table',
    idea: "Today's table, fixed: marks stay put, ranges, ledger footer.",
    score: 4,
    Component: V15
  },
  {
    n: 16,
    name: 'Bin Drawer',
    idea: 'Staging as two named bins, always on screen, grouped by sender.',
    score: 9,
    Component: V16
  },
  {
    n: 17,
    name: 'Operation Log',
    idea: 'Stage moves, not messages. Too much space for the information.',
    score: 8,
    Component: V17
  },
  {
    n: 18,
    name: 'Before / After',
    idea: 'Stage as outcome. A bit polluted.',
    score: 7,
    Component: V18
  },
  {
    n: 19,
    name: 'Review Sheet',
    idea: 'One counter while working; full-screen review before Gmail.',
    score: 5,
    Component: V19
  },
  {
    n: 20,
    name: 'Conveyor',
    idea: 'Narrow rail of tinted tiles. Good space, says too little.',
    score: 8,
    Component: V20
  },
  {
    n: 21,
    name: 'Bins ✦',
    idea: 'FINALIST — 16 kept, with left/right/middle-click selection.',
    score: 0,
    Component: V21
  },
  {
    n: 22,
    name: 'Ledger ✦',
    idea: '17+20: narrow column, every line carries shape+name+count.',
    score: 0,
    Component: V22
  },
  {
    n: 23,
    name: 'PROMOTED ★',
    idea: 'The chosen layout — now the real app components.',
    score: 0,
    Component: V23
  }
] as const

const initialVariant = (): number => {
  const value = Number(new URLSearchParams(location.search).get('v'))
  return value >= 1 && value <= variants.length ? value : 23
}

export default function Shell() {
  const [current, setCurrent] = useState(initialVariant)
  const [barOpen, setBarOpen] = useState(true)
  const [theme, setTheme] = useState(() => loadTheme())
  const active = variants[current - 1]
  const Active = active.Component

  const go = (variant: number) => {
    setCurrent(variant)
    ws.reset()
    const url = new URL(location.href)
    url.searchParams.set('v', String(variant))
    history.replaceState(null, '', url)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
        return
      if (event.altKey && event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        go(event.key === '0' ? 10 : Number(event.key))
      } else if (event.key === '[') {
        go(current === 1 ? variants.length : current - 1)
      } else if (event.key === ']') {
        go(current === variants.length ? 1 : current + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
      <div className="min-h-0 flex-1 overflow-hidden pb-12">
        <Active key={current} />
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-3">
        <div className="pointer-events-auto flex max-w-[95vw] flex-wrap items-center justify-center gap-1 rounded-2xl border border-line bg-panel px-2 py-1.5 shadow-2xl">
          {barOpen &&
            variants.map((variant) => (
              <button
                key={variant.n}
                className={`relative rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${current === variant.n ? 'bg-brand text-on-brand' : variant.score === 0 ? 'text-ink hover:bg-panel2' : 'text-ink-dim hover:bg-panel2 hover:text-ink'}`}
                title={`${variant.name} — ${variant.idea}${variant.score ? `  (graded ${variant.score}/10)` : '  (new)'}`}
                onClick={() => go(variant.n)}
              >
                {variant.n}
                {variant.score === 0 && current !== variant.n && (
                  <span className="absolute -right-0 -top-0 size-1.5 rounded-full bg-brand" />
                )}
              </button>
            ))}
          {barOpen && (
            <span className="hidden max-w-[40ch] truncate text-[11px] text-ink-dim sm:inline">
              <b className="text-ink">{active.name}</b>{' '}
              {active.score > 0 && <span className="text-brand">{active.score}/10</span>} —{' '}
              {active.idea}
            </span>
          )}
          <ThemePicker current={theme} onChange={setTheme} />
          <button
            className="rounded-full px-2 py-1 font-mono text-[11px] text-ink-dim hover:text-ink"
            onClick={() => setBarOpen((open) => !open)}
          >
            {barOpen ? 'hide' : 'variants'}
          </button>
        </div>
      </div>
    </div>
  )
}
