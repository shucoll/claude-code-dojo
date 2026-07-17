import type { ChartBarSegment, ChartCard, LedgerEntry } from '../../content/charts/types'
import { BarView } from './BarView'

/** The synthetic remainder segment. Inert: free space has no lesson behind it. */
const FREE_SPACE_ID = 'free-space'

interface LedgerRow {
  entries: LedgerEntry[]
  windowTokens?: number
  label?: string
  caption?: string
}

interface LedgerViewProps {
  row: LedgerRow
  onActivate: (card: ChartCard) => void
}

/** A zero basis would make every share NaN; BarView guards its total the same way. */
function shareOf(tokens: number, basis: number): number {
  return Math.round((tokens / Math.max(basis, 1)) * 100)
}

/**
 * Phase 1 rendering for a `ledger` row: derive each entry's share from its
 * absolute `tokens` and delegate to `BarView`. The shares are computed here
 * exactly as the Phase 2 simulator will compute them, so the fallback and the
 * simulator can never disagree; Phase 2 replaces the delegation with toggle
 * chips inside this component.
 *
 * With `windowTokens`, entries are shares of a capacity and the remainder renders
 * as free space. Without it, they are shares of their own sum — a breakdown of a
 * total, which is the only readable view when the entries are a few percent of
 * the capacity.
 */
export function LedgerView({ row, onActivate }: LedgerViewProps) {
  // An entry that is off costs nothing, so it leaves the stack entirely rather
  // than rendering as a zero-width segment.
  const enabled = row.entries.filter((entry) => entry.defaultOn !== false)
  const used = enabled.reduce((sum, entry) => sum + entry.tokens, 0)
  const basis = row.windowTokens ?? used

  const segments: ChartBarSegment[] = enabled.map((entry) => ({
    ...entry,
    percent: shareOf(entry.tokens, basis),
  }))

  if (row.windowTokens !== undefined) {
    // Overflow is only reachable through bad data — toggling can only reduce the
    // sum — so the clamp keeps a mistuned ledger rendering as a full bar rather
    // than producing a negative-width segment.
    segments.push({
      id: FREE_SPACE_ID,
      title: 'Free space',
      percent: shareOf(Math.max(row.windowTokens - used, 0), basis),
      tone: 'neutral',
    })
  }

  return (
    <BarView row={{ segments, label: row.label, caption: row.caption }} onActivate={onActivate} />
  )
}
