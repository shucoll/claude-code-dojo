# Interactive Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed clickable node-graph charts in lessons; clicking a node navigates to an existing lesson, opens an inline MDX popup, or does nothing — and every lesson gets a Back button that returns the user where they came from.

**Architecture:** A pure-data `ChartDef` (hand-positioned nodes + edges, optional per-node target) drives a presentational SVG `<Chart>` primitive. A `ChartEmbed` MDX wrapper resolves node activation to either router navigation (lesson) or a `ChartPopup` modal (built on a generic `Popup` primitive). A `useBackTarget` hook resolves `state.from` → previous curriculum lesson → none for the lesson Back button. No new routes; no new dependencies.

**Tech Stack:** Vite + React + TypeScript (strict), react-router-dom v7, Framer Motion, Tailwind v4 (CSS-first, semantic tokens), MDX (`@mdx-js/react` `MDXProvider` + shared `mdxComponents`), Vitest + React Testing Library (jsdom).

## Global Constraints

- TypeScript strict; **no `any`** in committed code.
- Consume **semantic tokens only** (`bg-card`, `text-foreground`, `border-ink`, `border-border`, `text-accent`, `bg-accent-soft`, `shadow-hard`, `rounded-control`); never raw hex or `--ccc-*` primitives. Brand = coral; green reserved for success.
- Chunky primitives use `border-2 border-ink shadow-hard`.
- Modal z-index uses the token: `z-[var(--z-modal)]` (= 100).
- All animation honors `useReducedMotion()` (no motion → instant, interaction unchanged).
- `curriculum.ts` is the single source of truth for the sidebar and for validating lesson targets; charts add **no** sidebar entries.
- Tests render router-dependent components inside `MemoryRouter`; lesson/MDX rendering needs `ThemeProvider` + `LanguageProvider` + `ProgressProvider` (see `src/pages/LessonPage.test.tsx` for the wrapper pattern).
- Commands: `npm test` (Vitest once), `npm run build` (tsc + bundle), `npm run lint` (oxlint).

---

### Task 1: Chart data model + registry + demo chart

**Files:**
- Create: `src/content/charts/types.ts`
- Create: `src/content/charts/loop.ts`
- Create: `src/content/charts/index.ts`
- Test: `src/content/charts/index.test.ts`

**Interfaces:**
- Produces:
  - `LessonRef { level: string; module: string; lesson: string }`
  - `ChartTarget = { kind: 'lesson'; ref: LessonRef } | { kind: 'popup'; title?: string; content: () => Promise<{ default: ComponentType }> }`
  - `PopupTarget = Extract<ChartTarget, { kind: 'popup' }>`
  - `ChartNode { id: string; label: string; x: number; y: number; target?: ChartTarget }`
  - `ChartEdge { from: string; to: string }`
  - `ChartDef { id: string; title?: string; nodes: ChartNode[]; edges: ChartEdge[] }`
  - `getChart(id: string): ChartDef | undefined`
  - `loop: ChartDef`

- [ ] **Step 1: Write the failing test**

```ts
// src/content/charts/index.test.ts
import { getChart } from './index'

test('getChart returns the demo loop chart by id', () => {
  const chart = getChart('loop')
  expect(chart?.id).toBe('loop')
  expect(chart?.nodes).toHaveLength(4)
  expect(chart?.edges).toHaveLength(3)
})

test('getChart returns undefined for an unknown id', () => {
  expect(getChart('nope')).toBeUndefined()
})

test('loop chart exercises all three node kinds', () => {
  const nodes = getChart('loop')!.nodes
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  expect(byId.prompt.target?.kind).toBe('popup')
  expect(byId.bash.target?.kind).toBe('popup')
  expect(byId.edit.target?.kind).toBe('lesson')
  expect(byId.agent.target).toBeUndefined() // targetless hub
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/content/charts/index.test.ts`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 3: Write the types**

```ts
// src/content/charts/types.ts
import type { ComponentType } from 'react'

/** Reference to an existing curriculum lesson (validated against curriculum.ts). */
export interface LessonRef {
  level: string
  module: string
  lesson: string
}

export type ChartTarget =
  | { kind: 'lesson'; ref: LessonRef }
  | { kind: 'popup'; title?: string; content: () => Promise<{ default: ComponentType }> }

export type PopupTarget = Extract<ChartTarget, { kind: 'popup' }>

export interface ChartNode {
  id: string
  label: string
  /** Position in a normalized 0–100 viewBox space. */
  x: number
  y: number
  /** Omitted => a plain, non-interactive node. */
  target?: ChartTarget
}

export interface ChartEdge {
  from: string
  to: string
}

export interface ChartDef {
  id: string
  title?: string
  nodes: ChartNode[]
  edges: ChartEdge[]
}
```

- [ ] **Step 4: Write the demo chart**

```ts
// src/content/charts/loop.ts
import type { ChartDef } from './types'

/**
 * Demo chart for the interactive-charts machinery. Exercises all three node
 * kinds: popup (prompt, bash), lesson target (edit), and targetless hub (agent).
 * Positions are hand-authored in the 0–100 viewBox space.
 */
export const loop: ChartDef = {
  id: 'loop',
  title: 'The Claude Code loop',
  nodes: [
    {
      id: 'prompt',
      label: 'Prompt',
      x: 50,
      y: 12,
      target: { kind: 'popup', title: 'Prompt', content: () => import('./popups/prompt.mdx') },
    },
    { id: 'agent', label: 'Agent', x: 50, y: 45 },
    {
      id: 'edit',
      label: 'Edit',
      x: 26,
      y: 80,
      target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } },
    },
    {
      id: 'bash',
      label: 'Bash',
      x: 74,
      y: 80,
      target: { kind: 'popup', title: 'Bash', content: () => import('./popups/bash.mdx') },
    },
  ],
  edges: [
    { from: 'prompt', to: 'agent' },
    { from: 'agent', to: 'edit' },
    { from: 'agent', to: 'bash' },
  ],
}
```

- [ ] **Step 5: Write the registry**

```ts
// src/content/charts/index.ts
import { loop } from './loop'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [loop.id]: loop,
}

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}

export type { ChartDef, ChartNode, ChartEdge, ChartTarget, PopupTarget, LessonRef } from './types'
```

- [ ] **Step 6: Create the popup MDX stubs** (needed for `loop.ts` imports to resolve at build time)

```mdx
{/* src/content/charts/popups/prompt.mdx */}
# Prompt

A prompt is a plain-English instruction. You describe the outcome you want and
Claude Code figures out which tools to use to get there.
```

```mdx
{/* src/content/charts/popups/bash.mdx */}
# Bash

Claude Code can run shell commands on your behalf. The example below is rendered
through the same language-aware engine the lessons use:

<Snippet id="hello-world" />
```

- [ ] **Step 7: Run tests and the build to verify they pass**

Run: `npm test -- src/content/charts/index.test.ts`
Expected: PASS (3 tests).
Run: `npm run build`
Expected: clean (confirms the `.mdx` imports resolve and types compile).

- [ ] **Step 8: Commit**

```bash
git add src/content/charts
git commit -m "feat: chart data model, registry, and demo loop chart"
```

---

### Task 2: `prevLesson` curriculum helper

**Files:**
- Modify: `src/lib/curriculumNav.ts` (append after `nextLesson`)
- Test: `src/lib/curriculumNav.test.ts` (create if absent; otherwise append)

**Interfaces:**
- Consumes: `flattenLessons`, `LessonLocation` (existing).
- Produces: `prevLesson(levels: Level[], lessonId: string): LessonLocation | undefined`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/curriculumNav.test.ts  (append, or create with this import block)
import { curriculum } from '../content/curriculum'
import { prevLesson } from './curriculumNav'

test('prevLesson returns the preceding lesson in curriculum order', () => {
  // stub order: what-is-cc -> first-edit -> slash-commands -> subagents
  expect(prevLesson(curriculum, 'first-edit')?.lesson.id).toBe('what-is-cc')
  expect(prevLesson(curriculum, 'slash-commands')?.lesson.id).toBe('first-edit')
})

test('prevLesson returns undefined for the first lesson and unknown ids', () => {
  expect(prevLesson(curriculum, 'what-is-cc')).toBeUndefined()
  expect(prevLesson(curriculum, 'nope')).toBeUndefined()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/curriculumNav.test.ts`
Expected: FAIL — `prevLesson` is not exported.

- [ ] **Step 3: Implement `prevLesson`**

```ts
// src/lib/curriculumNav.ts  (append at end of file)
export function prevLesson(levels: Level[], lessonId: string): LessonLocation | undefined {
  const all = flattenLessons(levels)
  const idx = all.findIndex((l) => l.lesson.id === lessonId)
  return idx > 0 ? all[idx - 1] : undefined
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/curriculumNav.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/curriculumNav.ts src/lib/curriculumNav.test.ts
git commit -m "feat: add prevLesson curriculum helper"
```

---

### Task 3: Generic `Popup` modal primitive

**Files:**
- Create: `src/components/ui/Popup.tsx`
- Test: `src/components/ui/Popup.test.tsx`

**Interfaces:**
- Produces: `Popup(props: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }): JSX.Element | null`

Behavior: renders `null` when closed. When open: a fixed backdrop + a centered dialog (chunky surface, `max-w`, `max-h`, internally scrollable body), `role="dialog"`, `aria-modal="true"`, labelled by the title. Closes on Esc, backdrop click, and an X button. Moves focus into the dialog on open and restores focus to the previously-focused element on close. Tab is kept within the dialog.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/Popup.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Popup } from './Popup'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <Popup open={open} onClose={() => setOpen(false)} title="Hello">
        <p>Body content</p>
      </Popup>
    </>
  )
}

test('renders nothing when closed', () => {
  render(<Popup open={false} onClose={() => {}} title="X">hi</Popup>)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('shows title and children when open', () => {
  render(<Popup open onClose={() => {}} title="Hello"><p>Body content</p></Popup>)
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveAccessibleName('Hello')
  expect(screen.getByText('Body content')).toBeInTheDocument()
})

test('closes on Escape, backdrop click, and the close button', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<Popup open onClose={onClose} title="Hello">body</Popup>)

  await user.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(1)

  await user.click(screen.getByTestId('popup-backdrop'))
  expect(onClose).toHaveBeenCalledTimes(2)

  await user.click(screen.getByRole('button', { name: /close/i }))
  expect(onClose).toHaveBeenCalledTimes(3)
})

test('restores focus to the trigger on close', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  const trigger = screen.getByRole('button', { name: 'open' })
  await user.click(trigger)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  await user.keyboard('{Escape}')
  expect(trigger).toHaveFocus()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/Popup.test.tsx`
Expected: FAIL — cannot find module `./Popup`.

- [ ] **Step 3: Implement `Popup`**

```tsx
// src/components/ui/Popup.tsx
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface PopupProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

export function Popup({ open, onClose, title, children }: PopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <div
        data-testid="popup-backdrop"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-card border-2 border-ink bg-card text-card-foreground shadow-hard-lg outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-border p-4">
          {title ? <h2 id={titleId} className="font-mono text-xl font-bold">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control hover:bg-muted"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/Popup.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Popup.tsx src/components/ui/Popup.test.tsx
git commit -m "feat: generic scrollable focus-trapped Popup primitive"
```

---

### Task 4: `ChartPopup` wrapper (lazy MDX in a Popup)

**Files:**
- Create: `src/components/charts/ChartPopup.tsx`
- Test: `src/components/charts/ChartPopup.test.tsx`

**Interfaces:**
- Consumes: `Popup` (Task 3); `PopupTarget` (Task 1); `mdxComponents`, `MDXProvider`.
- Produces: `ChartPopup(props: { target: PopupTarget | null; onClose: () => void }): JSX.Element`

Behavior: open iff `target !== null`. Lazy-loads `target.content` and renders it inside `<Suspense>` + `<MDXProvider components={mdxComponents}>`, within `<Popup>` titled by `target.title`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/charts/ChartPopup.test.tsx
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../../context/LanguageContext'
import { ChartPopup } from './ChartPopup'
import type { PopupTarget } from '../../content/charts/types'

const target: PopupTarget = {
  kind: 'popup',
  title: 'Bash',
  content: () => import('../../content/charts/popups/bash.mdx'),
}

test('renders nothing when target is null', () => {
  render(<ChartPopup target={null} onClose={() => {}} />)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('renders the node MDX (including a Snippet) inside the popup', async () => {
  render(
    <LanguageProvider>
      <ChartPopup target={target} onClose={() => {}} />
    </LanguageProvider>,
  )
  expect(await screen.findByRole('heading', { name: 'Bash' })).toBeInTheDocument()
  // the bash popup embeds <Snippet id="hello-world" />, whose JS pack contains `export function add`
  expect(await screen.findByText(/export function add/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/charts/ChartPopup.test.tsx`
Expected: FAIL — cannot find module `./ChartPopup`.

- [ ] **Step 3: Implement `ChartPopup`**

```tsx
// src/components/charts/ChartPopup.tsx
import { MDXProvider } from '@mdx-js/react'
import { Suspense, lazy, useMemo } from 'react'
import { mdxComponents } from '../mdx/mdxComponents'
import { Popup } from '../ui/Popup'
import type { PopupTarget } from '../../content/charts/types'

interface ChartPopupProps {
  target: PopupTarget | null
  onClose: () => void
}

export function ChartPopup({ target, onClose }: ChartPopupProps) {
  const Content = useMemo(() => (target ? lazy(target.content) : null), [target])

  return (
    <Popup open={target !== null} onClose={onClose} title={target?.title}>
      {Content && (
        <MDXProvider components={mdxComponents}>
          <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
            <Content />
          </Suspense>
        </MDXProvider>
      )}
    </Popup>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/charts/ChartPopup.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/ChartPopup.tsx src/components/charts/ChartPopup.test.tsx
git commit -m "feat: ChartPopup renders node MDX inside the Popup primitive"
```

---

### Task 5: `<Chart>` presentational SVG primitive

**Files:**
- Create: `src/components/charts/Chart.tsx`
- Test: `src/components/charts/Chart.test.tsx`

**Interfaces:**
- Consumes: `ChartDef`, `ChartNode` (Task 1); `useReducedMotion`, `motion`.
- Produces: `Chart(props: { def: ChartDef; onActivate: (node: ChartNode) => void }): JSX.Element`

Behavior: renders an SVG (`viewBox="0 0 100 92"`). Edges drawn first as `<line>` between node centers; nodes drawn as chunky `<rect>` + centered `<text>`. A node **with** a target is a focusable control (`role="button"`, `tabIndex={0}`, `aria-label`, click + Enter/Space fire `onActivate(node)`). A node **without** a target is inert (no role, not focusable, `aria-hidden`). Entrance/hover animation gated by `useReducedMotion`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/charts/Chart.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chart } from './Chart'
import type { ChartDef } from '../../content/charts/types'

const def: ChartDef = {
  id: 't',
  nodes: [
    { id: 'a', label: 'A', x: 30, y: 20, target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) } },
    { id: 'b', label: 'B', x: 70, y: 80 }, // targetless
  ],
  edges: [{ from: 'a', to: 'b' }],
}

test('renders one control per interactive node and one line per edge', () => {
  const { container } = render(<Chart def={def} onActivate={() => {}} />)
  expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
  expect(container.querySelectorAll('line')).toHaveLength(1)
})

test('a targetless node is inert (no button, not focusable)', () => {
  render(<Chart def={def} onActivate={() => {}} />)
  expect(screen.queryByRole('button', { name: 'B' })).toBeNull()
  expect(screen.getByText('B').closest('[tabindex]')).toBeNull()
})

test('fires onActivate on click and on Enter/Space', async () => {
  const user = userEvent.setup()
  const onActivate = vi.fn()
  render(<Chart def={def} onActivate={onActivate} />)
  const node = screen.getByRole('button', { name: 'A' })

  await user.click(node)
  expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))

  node.focus()
  await user.keyboard('{Enter}')
  await user.keyboard(' ')
  expect(onActivate).toHaveBeenCalledTimes(3)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/charts/Chart.test.tsx`
Expected: FAIL — cannot find module `./Chart`.

- [ ] **Step 3: Implement `Chart`**

```tsx
// src/components/charts/Chart.tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/charts/Chart.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/Chart.tsx src/components/charts/Chart.test.tsx
git commit -m "feat: presentational SVG Chart primitive with interactive/inert nodes"
```

---

### Task 6: `ChartEmbed` wrapper + MDX registration + lesson embed

**Files:**
- Create: `src/components/charts/ChartEmbed.tsx`
- Modify: `src/components/mdx/mdxComponents.tsx` (register `ChartEmbed`)
- Modify: `src/content/lessons/advanced/subagents.mdx` (add `<ChartEmbed id="loop" />`)
- Test: `src/components/charts/ChartEmbed.test.tsx`

**Interfaces:**
- Consumes: `getChart` (Task 1); `Chart` (Task 5); `ChartPopup` (Task 4); `findLesson`, `lessonPath` (existing); `useNavigate`, `useLocation`.
- Produces: `ChartEmbed(props: { id: string }): JSX.Element | null`

Behavior: looks up the chart; renders `null` for an unknown id. Wraps `<Chart>` in `<div id={`chart-${id}`}>`. On node activation: `lesson` → resolve ref via `findLesson` and `navigate(lessonPath(loc), { state: { from: `${pathname}#chart-${id}` } })`; `popup` → open `<ChartPopup>`; otherwise no-op.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/charts/ChartEmbed.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { ChartEmbed } from './ChartEmbed'

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}|{JSON.stringify(loc.state)}</div>
}

function renderEmbed(id: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/learn/advanced/power/subagents']}>
        <Routes>
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<><ChartEmbed id={id} /><LocationProbe /></>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

test('renders nothing for an unknown chart id', () => {
  const { container } = renderEmbed('nope')
  expect(container.querySelector('[id^="chart-"]')).toBeNull()
})

test('exposes the scroll anchor id', () => {
  const { container } = renderEmbed('loop')
  expect(container.querySelector('#chart-loop')).not.toBeNull()
})

test('a lesson node navigates with state.from set to the anchor', async () => {
  const user = userEvent.setup()
  renderEmbed('loop')
  await user.click(screen.getByRole('button', { name: 'Edit' }))
  const loc = screen.getByTestId('loc').textContent ?? ''
  expect(loc).toContain('/learn/beginner/basics/first-edit')
  expect(loc).toContain('/learn/advanced/power/subagents#chart-loop')
})

test('a popup node opens the modal instead of navigating', async () => {
  const user = userEvent.setup()
  renderEmbed('loop')
  await user.click(screen.getByRole('button', { name: 'Prompt' }))
  expect(await screen.findByRole('dialog')).toHaveAccessibleName('Prompt')
  expect(screen.getByTestId('loc').textContent).toContain('/learn/advanced/power/subagents')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/charts/ChartEmbed.test.tsx`
Expected: FAIL — cannot find module `./ChartEmbed`.

- [ ] **Step 3: Implement `ChartEmbed`**

```tsx
// src/components/charts/ChartEmbed.tsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { getChart } from '../../content/charts'
import type { ChartNode, PopupTarget } from '../../content/charts/types'
import { findLesson, lessonPath } from '../../lib/curriculumNav'
import { Chart } from './Chart'
import { ChartPopup } from './ChartPopup'

interface ChartEmbedProps {
  id: string
}

export function ChartEmbed({ id }: ChartEmbedProps) {
  const def = getChart(id)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [popup, setPopup] = useState<PopupTarget | null>(null)

  if (!def) return null

  function handleActivate(node: ChartNode) {
    const target = node.target
    if (!target) return
    if (target.kind === 'popup') {
      setPopup(target)
      return
    }
    const { level, module, lesson } = target.ref
    const loc = findLesson(curriculum, level, module, lesson)
    if (!loc) return
    navigate(lessonPath(loc), { state: { from: `${pathname}#chart-${id}` } })
  }

  return (
    <div id={`chart-${id}`} className="my-8 flex justify-center">
      <Chart def={def} onActivate={handleActivate} />
      <ChartPopup target={popup} onClose={() => setPopup(null)} />
    </div>
  )
}
```

- [ ] **Step 4: Register in the shared MDX map**

```tsx
// src/components/mdx/mdxComponents.tsx  — add the import and map entry
import { ChartEmbed } from '../charts/ChartEmbed'
// ...inside the components object, alongside Snippet/TryPrompt/WhenLang:
  ChartEmbed,
```

- [ ] **Step 5: Embed the demo chart in the advanced lesson**

```mdx
{/* src/content/lessons/advanced/subagents.mdx — append */}

## The loop

<ChartEmbed id="loop" />
```

- [ ] **Step 6: Run tests and build to verify they pass**

Run: `npm test -- src/components/charts/ChartEmbed.test.tsx`
Expected: PASS (4 tests).
Run: `npm run build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/charts/ChartEmbed.tsx src/components/charts/ChartEmbed.test.tsx src/components/mdx/mdxComponents.tsx src/content/lessons/advanced/subagents.mdx
git commit -m "feat: ChartEmbed wires node activation to routing/popup and embeds the demo chart"
```

---

### Task 7: Lesson Back button + `useBackTarget` + origin-passing nav

**Files:**
- Create: `src/lib/useBackTarget.ts`
- Test: `src/lib/useBackTarget.test.tsx`
- Modify: `src/pages/LessonPage.tsx` (Back button, scroll-to-anchor, pass `state.from` on advance)
- Modify: `src/components/shell/Sidebar.tsx` (NavLink passes `state.from`)
- Test: `src/pages/LessonPage.test.tsx` (append Back-button cases)

**Interfaces:**
- Consumes: `prevLesson`, `lessonPath` (Tasks 2 / existing); `useLocation`, `useParams`.
- Produces: `useBackTarget(): string | null`

Resolution order: `location.state.from` → `prevLesson(curriculum, lessonId)` path → `null`.

- [ ] **Step 1: Write the failing test for the hook**

```tsx
// src/lib/useBackTarget.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useBackTarget } from './useBackTarget'

function Probe() {
  return <div data-testid="back">{String(useBackTarget())}</div>
}

function renderAt(entry: { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/learn/:levelId/:moduleId/:lessonId" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('prefers state.from when present', () => {
  renderAt({ pathname: '/learn/beginner/basics/first-edit', state: { from: '/learn/advanced/power/subagents#chart-loop' } })
  expect(screen.getByTestId('back')).toHaveTextContent('/learn/advanced/power/subagents#chart-loop')
})

test('falls back to the previous curriculum lesson', () => {
  renderAt({ pathname: '/learn/beginner/basics/first-edit' })
  expect(screen.getByTestId('back')).toHaveTextContent('/learn/beginner/basics/what-is-cc')
})

test('returns null on the first lesson with no origin', () => {
  renderAt({ pathname: '/learn/beginner/basics/what-is-cc' })
  expect(screen.getByTestId('back')).toHaveTextContent('null')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/useBackTarget.test.tsx`
Expected: FAIL — cannot find module `./useBackTarget`.

- [ ] **Step 3: Implement `useBackTarget`**

```ts
// src/lib/useBackTarget.ts
import { useLocation, useParams } from 'react-router-dom'
import { curriculum } from '../content/curriculum'
import { lessonPath, prevLesson } from './curriculumNav'

export function useBackTarget(): string | null {
  const location = useLocation()
  const { lessonId } = useParams()
  const from = (location.state as { from?: string } | null)?.from
  if (from) return from
  const prev = lessonId ? prevLesson(curriculum, lessonId) : undefined
  return prev ? lessonPath(prev) : null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/useBackTarget.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing LessonPage Back-button tests**

```tsx
// src/pages/LessonPage.test.tsx — append
import { Navigate } from 'react-router-dom'

test('shows a Back button that returns to state.from', async () => {
  const user = userEvent.setup()
  render(
    <ThemeProvider><LanguageProvider><ProgressProvider>
      <MemoryRouter initialEntries={[{ pathname: '/learn/beginner/basics/first-edit', state: { from: '/learn/advanced/power/subagents' } }]}>
        <Routes>
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>
    </ProgressProvider></LanguageProvider></ThemeProvider>,
  )
  await screen.findByRole('heading', { name: /your first edit/i })
  expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
})

test('hides the Back button on the first lesson with no origin', async () => {
  renderAt('/learn/beginner/basics/what-is-cc')
  await screen.findByRole('heading', { name: /what is claude code/i })
  expect(screen.queryByRole('button', { name: /back/i })).toBeNull()
})
```

- [ ] **Step 6: Run to verify the new LessonPage tests fail**

Run: `npm test -- src/pages/LessonPage.test.tsx`
Expected: FAIL — no Back button rendered yet.

- [ ] **Step 7: Add the Back button + scroll-to-anchor to `LessonPage`**

In `src/pages/LessonPage.tsx`:

1. Update imports:

```tsx
import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useBackTarget } from '../lib/useBackTarget'
```

2. Add a back-arrow icon next to `ArrowRightIcon`:

```tsx
function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 8H3M7 4L3 8l4 4" />
    </svg>
  )
}
```

3. Inside the component, after `const reduce = useReducedMotion()`:

```tsx
  const back = useBackTarget()
  const { hash } = useLocation()
```

4. Add a scroll-to-anchor effect (after the existing visit effect):

```tsx
  useEffect(() => {
    if (!hash) return
    const el = document.querySelector(hash)
    el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  }, [hash, location, reduce])
```

5. Pass `state.from` when advancing in `handleComplete`:

```tsx
  const handleComplete = () => {
    markCompleted(location.lesson.id)
    if (next) {
      navigate(`/learn/${next.levelId}/${next.moduleId}/${next.lesson.id}`, {
        state: { from: lessonPath(location) },
      })
    }
  }
```

6. Render the Back button at the top of the article (before `<MDXProvider>`):

```tsx
      {back && (
        <div className="mb-6">
          <Button variant="secondary" size="sm" leadingIcon={<ArrowLeftIcon />} onClick={() => navigate(back)}>
            Back
          </Button>
        </div>
      )}
```

- [ ] **Step 8: Pass `state.from` from the Sidebar NavLinks**

In `src/components/shell/Sidebar.tsx`:

1. Add to imports: `import { NavLink, useLocation } from 'react-router-dom'`
2. Inside `Sidebar`, after `const reduce = useReducedMotion()`: `const { pathname } = useLocation()`
3. On the `<NavLink>`, add the `state` prop:

```tsx
                                <NavLink
                                  to={`/learn/${level.id}/${mod.id}/${lesson.id}`}
                                  state={{ from: pathname }}
                                  className={({ isActive }) =>
```

- [ ] **Step 9: Run the full suite and build**

Run: `npm test`
Expected: PASS (all files, including the new Back-button and hook tests).
Run: `npm run build`
Expected: clean.

- [ ] **Step 10: Commit**

```bash
git add src/lib/useBackTarget.ts src/lib/useBackTarget.test.tsx src/pages/LessonPage.tsx src/pages/LessonPage.test.tsx src/components/shell/Sidebar.tsx
git commit -m "feat: lesson Back button resolving where-you-came-from + scroll-to-chart anchor"
```

---

## Self-Review

**Spec coverage:**
- Data model (nodes/edges/optional target, LessonRef, registry) → Task 1. ✓
- Targetless node = inert → Task 1 (data) + Task 5 (rendering/tests). ✓
- Custom SVG + Framer Motion `<Chart>`, reduced-motion → Task 5. ✓
- Generic `Popup` primitive → Task 3; `ChartPopup` wrapper rendering MDX via shared engine → Task 4. ✓
- `ChartEmbed` MDX-facing: lesson nav vs popup vs no-op, anchor id, registered in `mdxComponents`, embedded in `subagents.mdx` → Task 6. ✓
- Lesson Back button (`state.from` → prev lesson → hidden), scroll-restore to `#chart-<id>`, origin-passing from Next/advance + Sidebar → Tasks 2 + 7. ✓
- No new routes; no new deps → honored throughout. ✓
- Demo chart exercises all three node kinds → Task 1 `loop` + assertions. ✓
- Language-aware popup (a `<Snippet>`) → Task 1 bash.mdx + Task 4 assertion. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output. ✓

**Type consistency:** `getChart`, `ChartDef`, `ChartNode`, `PopupTarget`, `ChartTarget`, `LessonRef`, `prevLesson`, `useBackTarget`, `findLesson`/`lessonPath` signatures used identically across tasks; `onActivate(node)` and `ChartPopup({ target, onClose })` consistent between definition (Tasks 4/5) and use (Task 6). ✓

**Note for executor:** `rounded-card` / `bg-ink/50` / `shadow-hard-lg` / `fill-accent-soft` / `stroke-ink` are used in Tasks 3 & 5. These map to existing tokens (`--radius-card`, `--ink`, `--shadow-hard-lg`, `accent-soft`, `ink`). If any utility doesn't resolve under the Tailwind v4 token setup, substitute the nearest existing semantic utility (e.g. `rounded-control`, `border-ink`) rather than introducing raw values — keep it tokenized.
