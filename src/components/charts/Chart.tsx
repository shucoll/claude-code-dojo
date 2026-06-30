import { motion, useReducedMotion } from 'framer-motion'
import type { KeyboardEvent } from 'react'
import type { ChartDef, ChartNode } from '../../content/charts/types'

const NODE_W = 26
const NODE_H = 14

interface ChartProps {
  def: ChartDef
  onActivate: (node: ChartNode) => void
}

export function Chart({ def, onActivate }: ChartProps) {
  const reduce = useReducedMotion()
  const byId = Object.fromEntries(def.nodes.map((n) => [n.id, n]))

  function handleKeyDown(e: KeyboardEvent<SVGGElement>, node: ChartNode) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate(node)
    }
  }

  return (
    <svg
      viewBox="0 0 100 92"
      role="group"
      aria-label={def.title ?? 'Diagram'}
      className="h-auto w-full max-w-xl"
    >
      {def.edges.map((edge, i) => {
        const from = byId[edge.from]
        const to = byId[edge.to]
        if (!from || !to) return null
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="stroke-border"
            strokeWidth={0.8}
          />
        )
      })}

      {def.nodes.map((node, i) => {
        const interactive = node.target !== undefined
        const x = node.x - NODE_W / 2
        const y = node.y - NODE_H / 2
        return (
          <motion.g
            key={node.id}
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            {...(interactive
              ? {
                  role: 'button',
                  tabIndex: 0,
                  'aria-label': node.label,
                  onClick: () => onActivate(node),
                  onKeyDown: (e: KeyboardEvent<SVGGElement>) => handleKeyDown(e, node),
                  className: 'cursor-pointer outline-none [&:hover_rect]:fill-accent-soft [&:focus-visible_rect]:fill-accent-soft',
                }
              : { 'aria-hidden': true })}
          >
            <rect
              x={x}
              y={y}
              width={NODE_W}
              height={NODE_H}
              rx={2}
              className={interactive ? 'fill-card stroke-ink' : 'fill-muted stroke-border'}
              strokeWidth={1}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground font-mono"
              fontSize={5}
            >
              {node.label}
            </text>
          </motion.g>
        )
      })}
    </svg>
  )
}
