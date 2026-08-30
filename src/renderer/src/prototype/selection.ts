// PROTOTYPE — mouse selection model for variants 21 and 22.
//
// The three buttons, per the round-three brief:
//   left    — select an item (toggles it, and becomes the anchor)
//   right   — select everything between the last clicked item and this one
//   middle  — flood-fill the contiguous run this item belongs to:
//               * on an UNSELECTED item, select all unselected items next to it
//               * on a SELECTED item, unselect all selected items next to it
//
// A "row" is the unit, not a message: a collapsed sender band is one row holding
// several ids, so a middle-click run can cover senders rather than messages.

export type Row = { key: string; ids: string[] }

export const rowSelected = (row: Row, sel: Set<string>): boolean =>
  row.ids.length > 0 && row.ids.every((id) => sel.has(id))

const apply = (rows: Row[], from: number, to: number, on: boolean, sel: Set<string>): Set<string> => {
  const next = new Set(sel)
  for (let i = from; i <= to; i++) {
    for (const id of rows[i].ids) (on ? next.add(id) : next.delete(id))
  }
  return next
}

/** Left click: toggle just this row. */
export function single(rows: Row[], i: number, sel: Set<string>): Set<string> {
  return apply(rows, i, i, !rowSelected(rows[i], sel), sel)
}

/** Right click: select the span between the anchor row and this one, inclusive. */
export function range(rows: Row[], anchor: number, i: number, sel: Set<string>): Set<string> {
  if (anchor < 0 || anchor >= rows.length) return single(rows, i, sel)
  const [a, b] = anchor <= i ? [anchor, i] : [i, anchor]
  return apply(rows, a, b, true, sel)
}

/**
 * Middle click: walk out from this row while neighbours share its selection state,
 * then invert that whole run. Selecting a block, or clearing one, is a single click.
 */
export function flood(rows: Row[], i: number, sel: Set<string>): Set<string> {
  const state = rowSelected(rows[i], sel)
  let a = i
  let b = i
  while (a - 1 >= 0 && rowSelected(rows[a - 1], sel) === state) a--
  while (b + 1 < rows.length && rowSelected(rows[b + 1], sel) === state) b++
  return apply(rows, a, b, !state, sel)
}
