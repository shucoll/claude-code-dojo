# Interactive Charts — Design

**Status:** Approved (brainstorm)
**Date:** 2026-06-30
**Phase:** 5 (interactive charts — §8 of the master spec)
**Depends on:** Content engine (MDX + `Snippet`/`TryPrompt`/`WhenLang`, `MDXProvider`,
`mdxComponents`), app shell (`AppShell`, `RequireOnboarded`), routing, `curriculum.ts`,
`lessonPath`, `resolveLandingPath`.

## Purpose

Teach with clickable diagrams. A chart is a small node-graph embedded in a lesson.
Clicking an interactive node either **navigates to an existing lesson** or **opens an
inline popup** rendered through the existing content engine. The chart owns
**interaction + animation**; lesson/popup MDX owns **content**; the router and a modal
glue them — the split described in §8 of the master spec, refined to drop the separate
chart-detail route.

This phase ships the **generic machinery + a single demo chart only**. Real domain
charts (tools, workflow, permissions, …) are authored later against the same data model
and the same click contract.

## Scope

**In scope**

- A `ChartDef` data model: nodes with hand-authored positions, optional per-node
  targets, and edges. Plus a chart registry.
- A presentational `<Chart>` SVG primitive (custom SVG + Framer Motion).
- A `ChartEmbed` wrapper (exposed to MDX) that handles node activation: navigate to a
  lesson, open a popup, or do nothing (targetless node).
- A `ChartPopup` modal: dynamically sized, scrollable, focus-trapped, renders node MDX
  via the shared `mdxComponents` map.
- A **Back button on every lesson** that returns the user to where they came from.
- One **demo chart** (`loop`) exercising all three node kinds (lesson target, popup
  target, targetless), embedded in the existing advanced `subagents.mdx` lesson.

**Out of scope (deferred)**

- A separate `/chart/:chartId/:itemId` route and `ChartDetailPage` — **removed**;
  node content is either an existing lesson or an inline popup.
- React Flow / pan / zoom / drag. Reserved behind the same data model + contract for a
  future genuinely-interactive chart; not added now.
- Real tool/workflow chart content. Lesson targets point at existing stub lessons; the
  demo popup is stub MDX (with a `<Snippet>` to prove language-awareness).
- Auto-layout. Positions are hand-authored.

## Rendering decision

Custom **SVG + Framer Motion**, not React Flow. The diagram is small, static, and
non-draggable; custom SVG keeps a new dependency out, lets the chunky/ink design tokens
flow straight through, and keeps every interactive node a real DOM control that is
trivially clickable/keyboard-operable in jsdom. React Flow stays available behind the
same `ChartDef` contract if a future chart genuinely needs drag/zoom/auto-layout.

## Data model

```ts
// src/content/charts/types.ts
import type { ComponentType } from 'react'

// Reference to an existing curriculum lesson (validated against curriculum.ts).
export interface LessonRef {
  level: string
  module: string
  lesson: string
}

export type ChartTarget =
  | { kind: 'lesson'; ref: LessonRef }
  | { kind: 'popup'; title?: string; content: () => Promise<{ default: ComponentType }> }

export interface ChartNode {
  id: string
  label: string
  x: number  // position in a normalized 0–100 viewBox space
  y: number
  target?: ChartTarget  // omitted => a plain, non-interactive node
}

export interface ChartEdge {
  from: string  // ChartNode.id
  to: string    // ChartNode.id
}

export interface ChartDef {
  id: string
  title?: string
  nodes: ChartNode[]
  edges: ChartEdge[]
}
```

- Positions live in a fixed normalized `viewBox` (0–100) so the SVG scales responsively
  with no runtime layout math.
- **Targetless nodes** (`target` omitted) are structural/decorative: rendered as plain
  nodes, **not** focusable, no `role="button"`, no hover/click affordance, out of tab
  order.
- A **registry** (`src/content/charts/index.ts`) maps `chartId → ChartDef` and exposes
  `getChart(id): ChartDef | undefined`.
- Demo chart `loop` (`src/content/charts/loop.ts`): nodes `prompt` (popup), `agent`
  (targetless hub), `edit` (lesson target → an existing lesson), `bash` (popup); edges
  `prompt→agent`, `agent→edit`, `agent→bash`. Exercises all three kinds.

## Components (`src/components/charts/`)

### `<Chart>` — presentational primitive

- Renders one `<svg viewBox="0 0 100 …">`: **edges first** (`<line>`/`<path>`), then
  **nodes** (chunky `<rect>` + `<text>`, ink border + hard offset shadow via tokens).
- Props: `def: ChartDef`, `onActivate(node: ChartNode): void`.
- A node **with a target** is a focusable control (`role="button"`, `tabIndex=0`,
  `aria-label` from label; click and Enter/Space both fire `onActivate(node)`). A node
  **without** a target renders inert.
- Framer Motion: entrance (nodes fade/scale in, stagger) + hover highlight on interactive
  nodes — all gated by `useReducedMotion`.
- **Knows nothing about routing or modals.** Pure interaction + presentation.

### `ChartEmbed` — MDX-facing wrapper

- Props: `id: string` (chart id). Looks up the chart via the registry; renders nothing
  (or a small fallback) for an unknown id.
- Wraps `<Chart>` in an element with `id="chart-<chartId>"` (the scroll anchor).
- Handles `onActivate(node)` by `node.target?.kind`:
  - `'lesson'` → resolve the ref via `findLesson(curriculum, ref.level, ref.module,
    ref.lesson)`, then `navigate(lessonPath(loc), { state: { from:
    `${pathname}#chart-${chartId}` } })`. An unresolvable ref is a no-op (and a dev
    warning).
  - `'popup'` → open `<ChartPopup>` with the node's content (local state; no routing).
  - `undefined` → no-op (shouldn't fire — inert node — but guarded anyway).
- Registered in the shared `mdxComponents` map next to `Snippet`/`TryPrompt`/`WhenLang`,
  so lessons embed a chart with `<ChartEmbed id="loop" />`.

### `Popup` — generic modal primitive (`src/components/ui/Popup.tsx`)

A reusable, content-agnostic modal that owns all the modal mechanics, so it can back any
future overlay (not just charts):

- Props: `open: boolean`, `onClose(): void`, `title?: ReactNode`, `children`.
- Dynamically sized to content with a `max-h`/`max-w` cap and an internally **scrollable**
  body; `z-[var(--z-modal)]`, backdrop, design-system surface (ink border, chunky style).
- Closeable via X button, backdrop click, and Esc; focus is trapped while open and
  restored to the previously-focused element on close; `role="dialog"`, `aria-modal`,
  labelled by `title`.
- Renders nothing when `open` is false. Knows nothing about MDX, charts, or routing.

### `ChartPopup` — chart-specific wrapper (`src/components/charts/ChartPopup.tsx`)

A thin wrapper around `Popup` that adds the chart-specific behavior:

- Props: the popup `target` (title + lazy `content`), `open`, `onClose`.
- Renders the node's MDX inside `<Suspense>` through the **same** `MDXProvider` +
  `mdxComponents` map used by lessons (so `Snippet`/`TryPrompt`/`WhenLang` work), passing
  the node's title through to `Popup`.

## Lesson Back button ("where you came from")

Every lesson renders a **Back** button (design-system secondary). Its target resolves in
order:

1. `location.state.from` if present — set by any in-app navigation into the lesson:
   chart→lesson (returns to the chart's lesson, scroll-restored to `#chart-<id>`),
   the lesson's own Next/Prev controls, and sidebar links.
2. else the **previous lesson in curriculum order** (covers sequential reading after a
   refresh/deep-link where no state survives) — via a new `prevLesson` helper mirroring
   the existing `nextLesson` in `curriculumNav.ts`.
3. else **hidden** — the first lesson with no origin has nothing to go back to.

To make (1) reliable, the lesson Next/Prev controls, the sidebar `Link`s, and
`ChartEmbed`'s lesson navigation all pass `state.from`. A small helper
(`useBackTarget()`) encapsulates the resolution so `LessonPage` stays thin. On lesson
mount, if the URL carries a `#chart-<id>` hash, scroll that anchor into view (the chart
return path).

## Routing

No new routes. `/chart/*` is **not** added (and any earlier reference to it is removed).
Charts live inside lessons; activation either reuses an existing lesson route under
`AppShell`/`RequireOnboarded` or opens an in-page modal.

## File plan

```
src/content/charts/
  types.ts                 # LessonRef / ChartTarget / ChartNode / ChartEdge / ChartDef
  loop.ts                  # demo chart definition (3 node kinds)
  index.ts                 # registry + getChart()
  popups/
    prompt.mdx  bash.mdx   # stub popup MDX (one includes a <Snippet>)
src/components/ui/
  Popup.tsx                # generic scrollable focus-trapped modal primitive
src/components/charts/
  Chart.tsx                # presentational SVG primitive
  ChartEmbed.tsx           # MDX-facing wrapper (routing + popup + anchor)
  ChartPopup.tsx           # thin wrapper: Popup + lazy MDX rendering
src/lib/
  useBackTarget.ts         # resolves state.from -> prev lesson -> none
# edits:
src/lib/curriculumNav.ts                      # add prevLesson() (mirror of nextLesson)
src/components/mdx/mdxComponents.tsx          # register ChartEmbed in the shared map
src/pages/LessonPage.tsx                      # add Back button + scroll-to-chart-anchor
src/components/shell/<Sidebar>                 # sidebar Links pass state.from
src/content/lessons/advanced/subagents.mdx    # embed <ChartEmbed id="loop" />
```

(The `edit` node's lesson target points at an existing stub lesson — no new lesson files
are required.)

## Testing

Vitest + React Testing Library (jsdom):

- **Registry:** `getChart` returns the def for a known id and `undefined` otherwise.
- **`<Chart>`:** renders one element per node and per edge; an interactive node fires
  `onActivate` on click and on Enter/Space; a targetless node is inert (no button role,
  not focusable, no activation); reduced-motion path renders and stays interactive.
- **`ChartEmbed`:** unknown id renders fallback; activating a lesson node navigates to the
  resolved `lessonPath` with `state.from`; activating a popup node opens `ChartPopup` and
  does not navigate; anchor `id="chart-<id>"` present.
- **`Popup` (generic):** renders nothing when closed; when open shows title + children,
  closes via Esc, backdrop, and X, traps focus, and restores focus to the trigger on close.
- **`ChartPopup`:** renders the node's MDX (assert stub content + the `<Snippet>`) inside
  the `Popup`, with the node title passed through.
- **`useBackTarget` / Back button:** resolves `state.from` when present; falls back to the
  previous curriculum lesson; hidden on the first lesson with no origin. Back navigation
  goes to the resolved target.

Manual/visual (user, in browser): entrance/hover animation, popup sizing/scroll, dark
mode, chart return scroll-restore.

## Invariants honored

- Semantic tokens only (ink border, offset shadow, `bg-background`, `text-*`); brand
  coral, green reserved for success.
- Language-specific content stays in snippet packs; popup/lesson MDX is language-aware via
  the existing engine, not via chart-specific language logic.
- `curriculum.ts` remains the single source of truth for the sidebar and for validating
  lesson targets; charts add no sidebar entries.
- TypeScript strict, no `any`.
