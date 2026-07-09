import { cn } from '../../lib/cn'
import type { ChartCard, GridColumns } from '../../content/charts/types'
import { ChartCardView } from './ChartCardView'

const COLS: Record<GridColumns, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

interface GridRow {
  items: ChartCard[]
  label?: string
  columns?: GridColumns
  caption?: string
}

interface GridViewProps {
  row: GridRow
  onActivate: (card: ChartCard) => void
}

/**
 * An unordered wrapping grid of cards. Unlike a `cards` row it holds any number
 * of items and never draws connecting arrows, so it suits reference material
 * (a command belt, a glossary) where the entries have no sequence.
 */
export function GridView({ row, onActivate }: GridViewProps) {
  return (
    <div data-testid="chart-grid-row">
      {row.label && (
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {row.label}
        </p>
      )}

      <div
        role="group"
        aria-label={row.label ?? 'Grid'}
        className={cn('grid grid-cols-1 gap-3', COLS[row.columns ?? 3])}
      >
        {row.items.map((item) => (
          <ChartCardView key={item.id} card={item} onActivate={onActivate} />
        ))}
      </div>

      {row.caption && <p className="mt-3 text-xs text-muted-foreground">{row.caption}</p>}
    </div>
  )
}
