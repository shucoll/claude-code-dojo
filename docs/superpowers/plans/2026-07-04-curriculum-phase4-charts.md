# Chart Flowchart Support (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a branching-flowchart chart shape (nodes + labeled edges, incl. cycles) additively alongside the existing card-flow engine, dogfooded with two real curriculum charts.

**Architecture:** A new `flow` `ChartRow` kind carries `nodes`/`edges` (the stable data contract). `layoutFlow` (lazy-loading `@dagrejs/dagre`) computes positions; `FlowView` renders SVG edges + edge-label pills + existing `ChartCardView` nodes. `Chart.tsx` gains one branch. `ChartEmbed`, the registry, the generator, and the validator are untouched.

**Tech Stack:** Vite + React + TypeScript (strict), Tailwind v4 (semantic tokens), framer-motion (via `ChartCardView`), `@dagrejs/dagre` (layout, code-split), Vitest + RTL (jsdom).

**Spec:** `docs/superpowers/specs/2026-07-04-curriculum-charts-phase4-design.md`

## Global Constraints

- TypeScript strict; **no `any`** in committed code.
- **Semantic tokens only** (`bg-background`, `border-border`, `text-muted-foreground`, `text-chart-*`); never raw hex or `--ccc-*`. Success-green is reserved — use `teal` for positive outcomes.
- `@dagrejs/dagre` is a **runtime dependency** but MUST be imported **only via dynamic `import()` inside `flowLayout.ts`** — never a top-level/static import anywhere — so it is code-split out of the main bundle. Guarded by a source-level test.
- `src/content/curriculum.ts` is **generated** — never hand-edit; regenerate with `npm run gen:curriculum`. This phase changes no lesson frontmatter, so regeneration must produce **no diff**.
- `src/content/charts/chartIds.ts` is the **import-free** node-safe id list; keep it in sync with the real registry (drift-guard test in `index.test.ts`).
- Honor `prefers-reduced-motion` (inherited via `ChartCardView`).
- Flow is **additive**: existing card/connector rows and all existing charts/tests keep working.
- Preserve the Phase-2 readiness contract (spec §8): `role` distinguishes `question`/`leaf`; edge **array order** = option order; never reorder authored edges.
- Single-file test run: `npx vitest run <path>`. Full suite: `npm test`. Types+bundle: `npm run build`. Content check: `npm run check-snippets`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

- `src/content/charts/types.ts` — **modify**: add `FlowNode`, `FlowEdge`, `FlowDirection`, `FlowNodeRole`; add `flow` to the `ChartRow` union.
- `src/components/charts/flowLayout.ts` — **create**: `layoutFlow` (lazy dagre) → `FlowLayout`.
- `src/components/charts/flowLayout.test.ts` — **create**.
- `src/components/charts/FlowView.tsx` — **create**: the renderer.
- `src/components/charts/FlowView.test.tsx` — **create**.
- `src/components/charts/Chart.tsx` — **modify**: flow row branch.
- `src/components/charts/Chart.test.tsx` — **modify**: flow row test.
- `src/content/charts/agentic-loop-diagram.ts`, `src/content/charts/clear-compact-new-tree.ts` — **create**: dogfood charts.
- `src/content/charts/popups/start-new.mdx` — **create**: one popup leaf.
- `src/content/charts/index.ts` — **modify**: register both charts; re-export flow types.
- `src/content/charts/chartIds.ts` — **modify**: add the two ids.
- `src/content/charts/index.test.ts` — **modify**: flow-shape tests.
- `src/content/lessons/beginner/what-is-cc.mdx`, `review-changes.mdx` — **modify**: embed charts.
- `src/content/charts/README.md`, `.claude/skills/new-lesson/SKILL.md`, `CLAUDE.md` — **modify**: docs.
- `package.json` — **modify**: add `@dagrejs/dagre`.

---

### Task 1: Data model + `@dagrejs/dagre` layout engine

**Files:**
- Modify: `src/content/charts/types.ts`
- Create: `src/components/charts/flowLayout.ts`
- Test: `src/components/charts/flowLayout.test.ts`
- Modify: `package.json` (via `npm install`)

**Interfaces:**
- Consumes: `ChartTone`, `ChartTarget`, `ChartCard`, `ChartRow` (existing, `types.ts`).
- Produces: `FlowNode`, `FlowEdge`, `FlowDirection`, `FlowNodeRole`, `flow` `ChartRow` member (`types.ts`); `layoutFlow(nodes, edges, direction?) => Promise<FlowLayout>` with `FlowLayout { nodes: PositionedNode[]; edges: PositionedEdge[]; width; height }`, `PositionedNode { node; x; y; width; height }` (x/y = top-left), `PositionedEdge { edge; points: Point[]; labelPoint? }`, `Point { x; y }` (`flowLayout.ts`).

- [ ] **Step 1: Install the layout dependency**

Run: `npm install @dagrejs/dagre@^3.0.0`
Expected: added to `dependencies` (it ships its own TS types — do **not** add `@types/dagre`).

- [ ] **Step 2: Extend the data model in `types.ts`**

Append after the existing `ChartCard` interface, and replace the `ChartRow` union:

```ts
export type FlowNodeRole = 'default' | 'question' | 'leaf'

export interface FlowNode {
  id: string
  title: string
  /** Muted description lines. */
  lines?: string[]
  /** Defaults to 'neutral'. */
  tone?: ChartTone
  /** Omitted => a plain, non-interactive node. */
  target?: ChartTarget
  /**
   * Traversal-state hint for Phase 2 guided decision trees (spec §8):
   * 'question' = a branch point whose outgoing edges are the answer options;
   * 'leaf' = a recommendation terminus. Defaults to 'default'.
   */
  role?: FlowNodeRole
}

export interface FlowEdge {
  from: string
  to: string
  /** e.g. "yes" / "no" / an option label. */
  label?: string
}

export type FlowDirection = 'TB' | 'LR'

export type ChartRow =
  | { kind: 'cards'; cards: ChartCard[] }
  | { kind: 'connector'; label: string }
  | { kind: 'flow'; nodes: FlowNode[]; edges: FlowEdge[]; direction?: FlowDirection }
```

(Delete the old two-member `ChartRow` union.)

- [ ] **Step 3: Write the failing layout test**

Create `src/components/charts/flowLayout.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { layoutFlow } from './flowLayout'
import type { FlowEdge, FlowNode } from '../../content/charts/types'

const nodes: FlowNode[] = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
]

test('lays out a small tree: children rank below the root (TB)', async () => {
  const edges: FlowEdge[] = [
    { from: 'a', to: 'b' },
    { from: 'a', to: 'c' },
  ]
  const layout = await layoutFlow(nodes, edges, 'TB')
  expect(layout.nodes).toHaveLength(3)
  expect(layout.edges).toHaveLength(2)
  const a = layout.nodes.find((n) => n.node.id === 'a')!
  const b = layout.nodes.find((n) => n.node.id === 'b')!
  expect(b.y).toBeGreaterThan(a.y)
  expect(layout.width).toBeGreaterThan(0)
  expect(layout.edges[0].points.length).toBeGreaterThan(0)
})

test('is deterministic (same input => same positions)', async () => {
  const edges: FlowEdge[] = [{ from: 'a', to: 'b' }]
  const two = nodes.slice(0, 2)
  const l1 = await layoutFlow(two, edges)
  const l2 = await layoutFlow(two, edges)
  expect(l1.nodes.map((n) => [n.x, n.y])).toEqual(l2.nodes.map((n) => [n.x, n.y]))
})

test('lays out a cyclic graph without throwing', async () => {
  const edges: FlowEdge[] = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'c', to: 'a', label: 'repeat' },
  ]
  const layout = await layoutFlow(nodes, edges, 'LR')
  expect(layout.nodes).toHaveLength(3)
  expect(layout.edges).toHaveLength(3)
  expect(layout.edges[2].labelPoint).toBeDefined()
})

test('dagre is code-split: dynamic import only, no top-level import', () => {
  const src = readFileSync(new URL('./flowLayout.ts', import.meta.url), 'utf8')
  expect(src).toMatch(/import\(\s*['"]@dagrejs\/dagre['"]\s*\)/)
  expect(src).not.toMatch(/^\s*import\s+[^\n]*['"]@dagrejs\/dagre['"]/m)
})
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run src/components/charts/flowLayout.test.ts`
Expected: FAIL (`flowLayout` module not found).

- [ ] **Step 5: Implement `flowLayout.ts`**

Create `src/components/charts/flowLayout.ts`:

```ts
import type { FlowDirection, FlowEdge, FlowNode } from '../../content/charts/types'

export interface Point {
  x: number
  y: number
}

export interface PositionedNode {
  node: FlowNode
  /** Top-left corner (dagre reports centers; converted here). */
  x: number
  y: number
  width: number
  height: number
}

export interface PositionedEdge {
  edge: FlowEdge
  points: Point[]
  labelPoint?: Point
}

export interface FlowLayout {
  nodes: PositionedNode[]
  edges: PositionedEdge[]
  width: number
  height: number
}

const NODE_WIDTH = 208

function nodeHeight(node: FlowNode): number {
  const lineCount = node.lines?.length ?? 0
  return 64 + lineCount * 20
}

/**
 * Compute a directed-graph layout for a flow chart. dagre is dynamically
 * imported so it is code-split out of the main bundle (see the bundle-guard
 * test). Node sizes are estimated deterministically from content — no DOM
 * measurement — so the layout is pure and unit-testable.
 */
export async function layoutFlow(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: FlowDirection = 'TB',
): Promise<FlowLayout> {
  const dagre = (await import('@dagrejs/dagre')).default
  const g = new dagre.graphlib.Graph({ multigraph: true })
  g.setGraph({ rankdir: direction, nodesep: 48, ranksep: 64, marginx: 8, marginy: 8 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: nodeHeight(node) })
  }
  edges.forEach((edge, i) => {
    g.setEdge(edge.from, edge.to, {}, `e${i}`)
  })

  dagre.layout(g)

  const positionedNodes: PositionedNode[] = nodes.map((node) => {
    const { x, y, width, height } = g.node(node.id)
    return { node, x: x - width / 2, y: y - height / 2, width, height }
  })
  const positionedEdges: PositionedEdge[] = edges.map((edge, i) => {
    const { points } = g.edge({ v: edge.from, w: edge.to, name: `e${i}` })
    return { edge, points, labelPoint: points[Math.floor(points.length / 2)] }
  })
  const graph = g.graph()
  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    width: graph.width ?? 0,
    height: graph.height ?? 0,
  }
}
```

> If TypeScript rejects `.default` on the dynamic import (dagre's type shape), fall back to `const dagre = await import('@dagrejs/dagre')` and reference `dagre.graphlib`/`dagre.layout` directly. Verify which compiles; keep the dynamic `import()` either way.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/components/charts/flowLayout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Typecheck**

Run: `npm run build`
Expected: type-check + bundle succeed.

- [ ] **Step 8: Commit**

```bash
git add src/content/charts/types.ts src/components/charts/flowLayout.ts src/components/charts/flowLayout.test.ts package.json package-lock.json
git commit -m "feat(charts): flow data model + dagre-backed layoutFlow (code-split)"
```

---

### Task 2: `FlowView` renderer

**Files:**
- Create: `src/components/charts/FlowView.tsx`
- Test: `src/components/charts/FlowView.test.tsx`

**Interfaces:**
- Consumes: `layoutFlow`, `FlowLayout` (Task 1); `ChartCardView` (existing); `ChartCard`, `ChartRow`, `FlowNode` (`types.ts`).
- Produces: `FlowView({ row, onActivate })` where `row` is `Extract<ChartRow, { kind: 'flow' }>` and `onActivate: (card: ChartCard) => void`.

- [ ] **Step 1: Write the failing renderer test**

Create `src/components/charts/FlowView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { FlowView } from './FlowView'
import type { ChartRow } from '../../content/charts/types'

const row: Extract<ChartRow, { kind: 'flow' }> = {
  kind: 'flow',
  nodes: [
    { id: 'q', title: 'Question', role: 'question' },
    {
      id: 'yes',
      title: 'Yes leaf',
      role: 'leaf',
      target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) },
    },
    { id: 'no', title: 'No leaf', role: 'leaf' },
  ],
  edges: [
    { from: 'q', to: 'yes', label: 'affirmative' },
    { from: 'q', to: 'no', label: 'negative' },
  ],
}

test('renders each node after layout resolves', async () => {
  render(<FlowView row={row} onActivate={() => {}} />)
  expect(await screen.findByText('Question')).toBeInTheDocument()
  expect(screen.getByText('Yes leaf')).toBeInTheDocument()
  expect(screen.getByText('No leaf')).toBeInTheDocument()
})

test('renders edge labels', async () => {
  render(<FlowView row={row} onActivate={() => {}} />)
  expect(await screen.findByText('affirmative')).toBeInTheDocument()
  expect(screen.getByText('negative')).toBeInTheDocument()
})

test('interactive node is a button; inert node is not', async () => {
  render(<FlowView row={row} onActivate={() => {}} />)
  expect(await screen.findByRole('button', { name: 'Yes leaf' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'No leaf' })).toBeNull()
})

test('activating a node calls onActivate with the mapped card', async () => {
  const onActivate = vi.fn()
  render(<FlowView row={row} onActivate={onActivate} />)
  const btn = await screen.findByRole('button', { name: 'Yes leaf' })
  btn.click()
  expect(onActivate).toHaveBeenCalledTimes(1)
  expect(onActivate.mock.calls[0][0]).toMatchObject({ id: 'yes', title: 'Yes leaf' })
})

test('exposes a screen-reader edge summary', async () => {
  render(<FlowView row={row} onActivate={() => {}} />)
  await screen.findByText('Question')
  expect(screen.getByText('Question → Yes leaf (affirmative)')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/charts/FlowView.test.tsx`
Expected: FAIL (`FlowView` module not found).

- [ ] **Step 3: Implement `FlowView.tsx`**

Create `src/components/charts/FlowView.tsx`:

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/charts/FlowView.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/FlowView.tsx src/components/charts/FlowView.test.tsx
git commit -m "feat(charts): FlowView renderer (SVG edges + labels + ChartCardView nodes, a11y)"
```

---

### Task 3: Wire `flow` rows into `Chart.tsx`

**Files:**
- Modify: `src/components/charts/Chart.tsx`
- Test: `src/components/charts/Chart.test.tsx`

**Interfaces:**
- Consumes: `FlowView` (Task 2). `onActivate` signature unchanged.

- [ ] **Step 1: Add the failing flow-row test**

Append to `src/components/charts/Chart.test.tsx`:

```tsx
test('renders a flow row as a FlowView (nodes + edge label)', async () => {
  const flowDef: ChartDef = {
    id: 'f',
    rows: [
      {
        kind: 'flow',
        nodes: [
          { id: 'x', title: 'Node X' },
          { id: 'y', title: 'Node Y' },
        ],
        edges: [{ from: 'x', to: 'y', label: 'go' }],
      },
    ],
  }
  render(<Chart def={flowDef} onActivate={() => {}} />)
  expect(await screen.findByText('Node X')).toBeInTheDocument()
  expect(screen.getByText('Node Y')).toBeInTheDocument()
  expect(screen.getByText('go')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/charts/Chart.test.tsx`
Expected: FAIL (flow row renders nothing / "Node X" not found — the current `else` treats non-connector rows as `cards` and reads `row.cards`).

- [ ] **Step 3: Add the flow branch to `Chart.tsx`**

Add the import near the top:

```tsx
import { FlowView } from './FlowView'
```

Replace the row-body ternary (the block starting `{row.kind === 'connector' ? (` through its matching `)}`) with a three-way branch:

```tsx
          {row.kind === 'connector' ? (
            <div className="flex justify-center">
              <div className="rounded-pill border-2 border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
                {row.label}
              </div>
            </div>
          ) : row.kind === 'flow' ? (
            <FlowView row={row} onActivate={onActivate} />
          ) : (
            <div
              data-testid="chart-cards-row"
              className={cn('grid grid-cols-1 gap-4', COLS[row.cards.length] ?? 'sm:grid-cols-1')}
            >
              {row.cards.map((card) => (
                <ChartCardView key={card.id} card={card} onActivate={onActivate} />
              ))}
            </div>
          )}
```

- [ ] **Step 4: Run the full charts test dir to verify pass + no regressions**

Run: `npx vitest run src/components/charts/`
Expected: PASS (existing Chart tests + the new flow-row test).

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/Chart.tsx src/components/charts/Chart.test.tsx
git commit -m "feat(charts): render flow rows via FlowView in Chart"
```

---

### Task 4: Dogfood charts (loop + decision tree) + registry

**Files:**
- Create: `src/content/charts/agentic-loop-diagram.ts`, `src/content/charts/clear-compact-new-tree.ts`, `src/content/charts/popups/start-new.mdx`
- Modify: `src/content/charts/index.ts`, `src/content/charts/chartIds.ts`, `src/content/charts/index.test.ts`
- Modify: `src/content/lessons/beginner/what-is-cc.mdx`, `src/content/lessons/beginner/review-changes.mdx`

**Interfaces:**
- Consumes: `ChartDef` + `flow` row (Task 1); `ChartEmbed` (existing, via MDXProvider — no import needed in MDX).
- Produces: registered chart ids `agentic-loop-diagram`, `clear-compact-new-tree`.

- [ ] **Step 1: Add the failing registry/shape tests**

Append to `src/content/charts/index.test.ts`:

```ts
test('registers the two flow dogfood charts, each with a flow row', () => {
  for (const id of ['agentic-loop-diagram', 'clear-compact-new-tree']) {
    const rows = getChart(id)?.rows
    expect(rows?.some((r) => r.kind === 'flow')).toBe(true)
  }
})

test('the agentic loop has a back-edge (cycle)', () => {
  const flow = getChart('agentic-loop-diagram')!.rows.find((r) => r.kind === 'flow')!
  if (flow.kind !== 'flow') throw new Error('expected flow row')
  expect(flow.edges.some((e) => e.to === 'gather')).toBe(true)
})

test('the decision tree exercises labeled edges, a lesson link, and a popup leaf', () => {
  const flow = getChart('clear-compact-new-tree')!.rows.find((r) => r.kind === 'flow')!
  if (flow.kind !== 'flow') throw new Error('expected flow row')
  expect(flow.edges.every((e) => Boolean(e.label))).toBe(true)
  expect(flow.nodes.some((n) => n.target?.kind === 'lesson')).toBe(true)
  expect(flow.nodes.some((n) => n.target?.kind === 'popup')).toBe(true)
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/content/charts/index.test.ts`
Expected: FAIL (`getChart('agentic-loop-diagram')` is undefined) and the drift test fails once `chartIds` is edited out of sync — both resolved below.

- [ ] **Step 3: Create the loop chart**

Create `src/content/charts/agentic-loop-diagram.ts`:

```ts
import type { ChartDef } from './types'

/** Loop dogfood: gather → act → verify → (repeat). Proves cycle layout. */
export const agenticLoopDiagram: ChartDef = {
  id: 'agentic-loop-diagram',
  title: 'The agentic loop',
  subtitle: 'gather context → take action → verify, then repeat',
  rows: [
    {
      kind: 'flow',
      direction: 'LR',
      nodes: [
        { id: 'gather', title: 'Gather context', lines: ['read files, search the repo'], tone: 'blue' },
        { id: 'act', title: 'Take action', lines: ['edit code, run commands'], tone: 'violet' },
        { id: 'verify', title: 'Verify', lines: ['run tests, review the diff'], tone: 'teal' },
      ],
      edges: [
        { from: 'gather', to: 'act' },
        { from: 'act', to: 'verify' },
        { from: 'verify', to: 'gather', label: 'repeat' },
      ],
    },
  ],
}
```

- [ ] **Step 4: Create the decision-tree chart**

Create `src/content/charts/clear-compact-new-tree.ts`:

```ts
import type { ChartDef } from './types'

/**
 * Decision-tree dogfood (static Phase 1 fallback of the B2.4 resolver).
 * Question node + labeled option edges + leaves that link or pop up.
 */
export const clearCompactNewTree: ChartDef = {
  id: 'clear-compact-new-tree',
  title: 'Clear, compact, or start new?',
  subtitle: 'When your session gets long or goes sideways',
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      nodes: [
        { id: 'q', title: 'What is going on?', role: 'question' },
        {
          id: 'clear',
          title: '/clear',
          role: 'leaf',
          tone: 'blue',
          lines: ['Wipe context, keep the session'],
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } },
        },
        {
          id: 'compact',
          title: '/compact',
          role: 'leaf',
          tone: 'violet',
          lines: ['Summarize, keep decisions'],
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'review-changes' } },
        },
        {
          id: 'new',
          title: 'Start a new session',
          role: 'leaf',
          tone: 'amber',
          lines: ['Fresh context window'],
          target: { kind: 'popup', title: 'Start new', content: () => import('./popups/start-new.mdx') },
        },
      ],
      edges: [
        { from: 'q', to: 'clear', label: 'context is irrelevant' },
        { from: 'q', to: 'compact', label: 'just getting long' },
        { from: 'q', to: 'new', label: 'something broke' },
      ],
    },
  ],
}
```

- [ ] **Step 5: Create the popup content**

Create `src/content/charts/popups/start-new.mdx`:

```mdx
# Start a new session

When the current context is more noise than signal — a failed approach, an
abandoned tangent — a fresh session beats compaction. You drop the history on
purpose. Re-state the goal and point Claude at the code.
```

- [ ] **Step 6: Register both charts + re-export flow types in `index.ts`**

Replace `src/content/charts/index.ts` with:

```ts
import { agenticLoopDiagram } from './agentic-loop-diagram'
import { clearCompactNewTree } from './clear-compact-new-tree'
import { demo } from './demo'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [demo.id]: demo,
  [agenticLoopDiagram.id]: agenticLoopDiagram,
  [clearCompactNewTree.id]: clearCompactNewTree,
}

export const registeredChartIds: string[] = Object.keys(charts)

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}

export type {
  ChartDef,
  ChartCard,
  ChartRow,
  ChartTone,
  ChartTarget,
  PopupTarget,
  LessonRef,
  FlowNode,
  FlowEdge,
  FlowDirection,
  FlowNodeRole,
} from './types'
```

- [ ] **Step 7: Update the node-safe id list**

Replace `src/content/charts/chartIds.ts`'s array (keep the comment):

```ts
export const chartIds: readonly string[] = ['agentic-loop-diagram', 'clear-compact-new-tree', 'demo']
```

- [ ] **Step 8: Run charts tests (registry + drift + shapes)**

Run: `npx vitest run src/content/charts/`
Expected: PASS (drift guard in sync; new shape tests pass).

- [ ] **Step 9: Embed the charts in lessons**

In `src/content/lessons/beginner/what-is-cc.mdx`, add on its own line after the first paragraph:

```mdx
<ChartEmbed id="agentic-loop-diagram" />
```

In `src/content/lessons/beginner/review-changes.mdx`, add on its own line after the first paragraph:

```mdx
<ChartEmbed id="clear-compact-new-tree" />
```

(No frontmatter change — inline embed mirrors `advanced/subagents.mdx`; `curriculum.ts` is unaffected.)

- [ ] **Step 10: Verify generator produces no diff + content check clean**

Run: `npm run gen:curriculum && git diff --exit-code src/content/curriculum.ts && npm run check-snippets`
Expected: no diff on `curriculum.ts`; check-snippets 0 errors / 0 warnings.

- [ ] **Step 11: Commit**

```bash
git add src/content/charts/ src/content/lessons/beginner/what-is-cc.mdx src/content/lessons/beginner/review-changes.mdx
git commit -m "feat(charts): dogfood agentic-loop (cycle) + clear-compact-new decision tree"
```

---

### Task 5: Docs + final acceptance

**Files:**
- Modify: `src/content/charts/README.md`, `.claude/skills/new-lesson/SKILL.md`, `CLAUDE.md`

- [ ] **Step 1: Rewrite the README "Future: React Flow" section into a Flowchart guide**

In `src/content/charts/README.md`, replace the final `## Future: React Flow` section with a `## Flowcharts (branching)` section documenting: the `flow` row kind; `FlowNode` (id, title, lines?, tone?, target?, role?) and `FlowEdge` (from, to, label?) and `direction` (`'TB'`/`'LR'`, default `'TB'`); that layout is computed by `@dagrejs/dagre` (lazy-loaded/code-split) and rendered by `FlowView` reusing `ChartCardView`; that cycles/loops and labeled edges are supported; and when to reach for a flow row (branching decision trees, loops) vs card rows/connectors (linear stacks). Include a short example:

```ts
{
  kind: 'flow',
  direction: 'TB',
  nodes: [
    { id: 'q', title: 'Which?', role: 'question' },
    { id: 'a', title: 'Option A', role: 'leaf', target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } } },
  ],
  edges: [{ from: 'q', to: 'a', label: 'if X' }],
}
```

Note (Phase 2 readiness): `role` marks `question`/`leaf`; edge array order = option order; guided traversal is built later on this same data.

- [ ] **Step 2: One-line note in the `new-lesson` skill**

In `.claude/skills/new-lesson/SKILL.md`, where charts are mentioned, add that charts can be linear card-flows **or** branching flowcharts (see `src/content/charts/README.md`); both are authored the same way (define a `ChartDef`, register in `index.ts` + `chartIds.ts`, embed with `<ChartEmbed id="…" />`).

- [ ] **Step 3: Update the CLAUDE.md chart pointer**

In `CLAUDE.md` "Adding a chart", note charts may be card-flow stacks **or** branching flowcharts (`flow` rows), both via `ChartDef`.

- [ ] **Step 4: Full acceptance**

Run: `npm test`
Expected: entire suite green.

Run: `npm run build`
Expected: type-check + bundle succeed.

Run: `npm run lint`
Expected: no new warnings beyond the pre-existing ones.

Run: `npm run gen:curriculum && git diff --exit-code src/content/curriculum.ts`
Expected: no diff.

Run: `npm run check-snippets`
Expected: 0 errors / 0 warnings.

- [ ] **Step 5: Commit**

```bash
git add src/content/charts/README.md .claude/skills/new-lesson/SKILL.md CLAUDE.md
git commit -m "docs(charts): flowchart authoring guide + skill/CLAUDE pointers"
```

## Self-Review notes

- **Spec coverage:** library decision (spec §2, recorded here as the fixed `@dagrejs/dagre` choice) → Task 1; data model §4.1 → Task 1; layout §4.2 + bundle guard → Task 1; renderer §4.3 → Task 2; wiring §4.4 → Task 3; dogfood §5 (loop + decision tree, both target kinds) → Task 4; docs §6 → Task 5; testing §7 → Tasks 1–4; Phase-2 readiness §8 (`role`, edge order) → Task 1 types + Task 4 data + Task 5 docs.
- **No generator/validator/emitter change** — flow charts validate via the existing `chartIds` path; `curriculum.ts` regen must be a no-op (asserted in Tasks 4 & 5).
- **Code-splitting invariant** preserved: dagre only via dynamic `import()` in `flowLayout.ts` (source-level guard test, Task 1).
- **Type consistency:** `layoutFlow`/`FlowLayout`/`PositionedNode`/`PositionedEdge`/`Point` (Task 1) are the exact names consumed by `FlowView` (Task 2); `FlowView({ row, onActivate })` is the exact shape consumed by `Chart.tsx` (Task 3).
