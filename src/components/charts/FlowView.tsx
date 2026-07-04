import { useEffect, useState } from 'react'
import type { ChartCard, ChartRow, FlowNode } from '../../content/charts/types'
import { ChartCardView } from './ChartCardView'
import { layoutFlow, type FlowLayout } from './flowLayout'

type FlowRow = Extract<ChartRow, { kind: 'flow' }>

interface FlowViewProps {
  row: FlowRow
  onActivate: (card: ChartCard) => void
}

function nodeToCard(node: FlowNode): ChartCard {
  return { id: node.id, title: node.title, lines: node.lines, tone: node.tone, target: node.target }
}

export function FlowView({ row, onActivate }: FlowViewProps) {
  const [layout, setLayout] = useState<FlowLayout | null>(null)

  useEffect(() => {
    let alive = true
    layoutFlow(row.nodes, row.edges, row.direction).then((next) => {
      if (alive) setLayout(next)
    })
    return () => {
      alive = false
    }
  }, [row])

  if (!layout) {
    return (
      <div data-testid="flow-loading" className="py-8 text-center text-sm text-muted-foreground">
        Loading diagram…
      </div>
    )
  }

  const titleById = new Map(row.nodes.map((n) => [n.id, n.title]))

  return (
    <div role="group" aria-label="Flowchart" className="w-full max-w-full overflow-x-auto">
      <div className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
        <svg
          className="pointer-events-none absolute inset-0 text-border"
          width={layout.width}
          height={layout.height}
          aria-hidden="true"
        >
          <defs>
            <marker
              id="flow-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10z" fill="currentColor" />
            </marker>
          </defs>
          {layout.edges.map((pe, i) => (
            <polyline
              key={i}
              points={pe.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              markerEnd="url(#flow-arrow)"
            />
          ))}
        </svg>

        {layout.edges.map((pe, i) =>
          pe.edge.label && pe.labelPoint ? (
            <div
              key={`label-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
              style={{ left: pe.labelPoint.x, top: pe.labelPoint.y }}
            >
              {pe.edge.label}
            </div>
          ) : null,
        )}

        {layout.nodes.map((pn) => (
          <div key={pn.node.id} className="absolute" style={{ left: pn.x, top: pn.y, width: pn.width }}>
            <ChartCardView card={nodeToCard(pn.node)} onActivate={onActivate} />
          </div>
        ))}
      </div>

      <ul className="sr-only">
        {layout.edges.map((pe, i) => (
          <li key={i}>
            {`${titleById.get(pe.edge.from)} → ${titleById.get(pe.edge.to)}${
              pe.edge.label ? ` (${pe.edge.label})` : ''
            }`}
          </li>
        ))}
      </ul>
    </div>
  )
}
