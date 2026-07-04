# Curriculum Authoring Platform — Phase 4: Chart flowchart support

**Date:** 2026-07-04
**Status:** Approved design, ready for implementation plan
**Initiative:** Curriculum Authoring Platform (parent spec:
`docs/superpowers/specs/2026-07-03-curriculum-authoring-platform-design.md`, §7 "Aspect 4 —
chart flowchart support", §10 phase 4).
**Depends on:** Phases 1–3 (generator emits the tree + `lessonPathById`; validator checks
`interactive[].spec` against the chart registry; card-flow chart engine + `ChartEmbed`
shipped). All merged to main.

## 1. Goal & scope

The card-flow `ChartDef` renders a linear vertical stack of rows; it cannot express a
**branching flowchart** — nodes plus labeled edges, including cycles. The base curriculum
needs that shape for several charts, and several of them appear even in Phase 1 static
diagrams:

- **Loops:** `agentic-loop-diagram` (gather → act → verify, a cycle), `beginner-workflow-map`
  (explore → plan → code → verify → commit with a verify-fails back-edge).
- **Decision trees** (Phase 2 behavior, Phase 1 static fallback): `clear-compact-new-tree`,
  `mechanism-decision-tree`, `orchestration-decision-tree` — question nodes, options as
  **labeled edges**, leaves that link to a home lesson or open a popup.
- A future flagship arbitrary graph (`claude-code-system-map`) — explicitly out of scope
  here (see §8).

Phase 4 delivers the **flowchart primitive** (a branching node/edge chart shape) additively
alongside the existing card-flow, and dogfoods it with two real curriculum charts (one loop,
one decision tree) so it renders live end-to-end. Per curriculum R5 / parent spec §7, the
node/edge JSON is the **stable contract** that Phase 2 guided-traversal / simulator behavior
will consume unchanged — only the rendering component swaps later.

**Out of scope:** Phase 2 interactive behavior (guided decision-tree traversal, simulators,
quizzes); the `claude-code-system-map` pan/zoom global navigator; any change to the
generator, validator, or emitter (flow charts register and validate exactly like card
charts).

## 2. Library decision (Aspect 4, decided at phase start per parent §7 criteria)

Evaluated against the parent spec's criteria (bundle size, design-system fit, Vite
compatibility, accessibility, effort to reach Phase 2 behaviors), with real bundle numbers
(min+gzip):

| Package | Size | Role | Cycles |
|---|---|---|---|
| **@dagrejs/dagre** | **13.3 KB** | layout only (node positions + edge points) | yes (breaks cycles for ranking) |
| d3-hierarchy | 5.7 KB | layout only | no — trees only |
| @xyflow/react (react-flow) | 58.5 KB | render + pan/zoom/drag; **no layout** (still needs dagre) | via a layout lib |
| elkjs | 423 KB | layout (powerful) | yes, but far too heavy |
| mermaid | large | text → render; opinionated CSS, not themeable to our style | yes |

**Decision: adopt `@dagrejs/dagre` for layout + our own tokenized renderer.** Rationale:

- **Layout is the hard part** (rank assignment, crossing minimization, cycle handling);
  dagre does exactly that in 13.3 KB and handles loops. We are *not* building a graph engine
  — we build only the renderer, which we want to own anyway for design-system fit.
- **Design-system fit:** rendering nodes ourselves reuses the existing "chunky" ink-border +
  semantic-token `ChartCardView`; no CSS-override fight (react-flow / mermaid ship their own
  styling).
- **react-flow rejected** for this phase: it does not do layout (still needs dagre on top),
  is ~4× the weight, and its pan/zoom canvas is the wrong interaction model for a diagram
  read inline in a lesson. Its one genuine use case — the flagship pan/zoom navigator — is a
  single future chart (§8), not a reason to weight every inline diagram now.
- **Phase 2 upgrade** (guided traversal / simulators): state layered over our node/edge JSON
  plus re-highlighting; fully owned, no third-party canvas in the way.
- **Cost control:** dagre is `import()`-ed lazily inside the layout module (§4.2), so it
  never enters the main bundle; only a lesson that renders a flow chart fetches it.

## 3. Architecture

Three concerns are kept separate so each can evolve independently:

```
ChartDef.rows[]  ──►  { kind: 'flow'; nodes[]; edges[]; direction? }   (data — stable contract)
                                     │
                                     ▼
                         layoutFlow(nodes, edges, dir)        (layout — lazy dagre, isolated seam)
                                     │  Promise<FlowLayout>
                                     ▼
                         <FlowView row onActivate>            (render — our SVG edges + ChartCardView nodes)
                                     │
                                     ▼
                         Chart.tsx  (flow row branch)  ◄── onActivate unchanged (node → card)
                                     │
                         ChartEmbed / registry / validation  (UNCHANGED)
```

- **Data** is the durable contract (Phase 2 builds on it).
- **Layout** is the only place a future engine swap touches.
- **Render** is ours, for design-system fit.
- **Interaction** reuses the existing card activation path verbatim.

## 4. Components

### 4.1 Data model — additive to `src/content/charts/types.ts`

```ts
export interface FlowNode {
  id: string
  title: string
  lines?: string[]
  tone?: ChartTone            // existing tones (success-green excluded)
  target?: ChartTarget        // existing: { kind:'lesson'; ref } | { kind:'popup'; ... }
  role?: 'default' | 'question' | 'leaf'   // light styling / a11y hint; defaults 'default'
}

export interface FlowEdge {
  from: string                // FlowNode id
  to: string                  // FlowNode id
  label?: string              // e.g. "yes" / "no" / an option
}

export type FlowDirection = 'TB' | 'LR'   // default 'TB'

// ChartRow union gains a third member (card-flow rows unchanged):
export type ChartRow =
  | { kind: 'cards'; cards: ChartCard[] }
  | { kind: 'connector'; label: string }
  | { kind: 'flow'; nodes: FlowNode[]; edges: FlowEdge[]; direction?: FlowDirection }
```

`FlowNode` is a superset of `ChartCard` (id, title, lines?, tone?, target?), so a node maps
to a `ChartCard` for rendering and the existing `ChartTarget`/activation path is reused
without change.

### 4.2 Layout — `src/components/charts/flowLayout.ts`

```ts
export interface PositionedNode { node: FlowNode; x: number; y: number; width: number; height: number }
export interface PositionedEdge { edge: FlowEdge; points: { x: number; y: number }[]; labelPoint?: { x: number; y: number } }
export interface FlowLayout { nodes: PositionedNode[]; edges: PositionedEdge[]; width: number; height: number }

export async function layoutFlow(
  nodes: FlowNode[], edges: FlowEdge[], direction?: FlowDirection,
): Promise<FlowLayout>
```

- **Lazy dagre:** `const { default: dagre } = await import('@dagrejs/dagre')` inside the
  function — dagre is code-split, out of the main bundle. This is a hard requirement and is
  guarded by a source-level test (§7).
- **Deterministic node sizing:** node width/height are estimated from content (a fixed width
  band; height from the number of `lines`) — **no DOM measurement pass**. Layout stays pure
  and unit-testable, and dagre input is deterministic (same data → same positions).
- Build a dagre graph (`rankdir` from `direction`), run `dagre.layout`, read node
  center/size and edge `points` (with the edge midpoint as `labelPoint`). Cycles are handled
  by dagre; a cyclic graph must lay out without throwing.
- This module is the **single seam**: swapping to another layout engine later touches only
  this file, not the data model or the renderer.

### 4.3 Renderer — `src/components/charts/FlowView.tsx`

```ts
interface FlowViewProps {
  row: Extract<ChartRow, { kind: 'flow' }>
  onActivate: (card: ChartCard) => void
}
```

- Runs `layoutFlow` in an effect; holds `FlowLayout | null` in state and renders a
  reduced-motion-aware placeholder until it resolves.
- **Edges:** SVG `<path>`/polyline through `points` with an arrowhead `<marker>`; optional
  `label` rendered as a small tokenized pill at `labelPoint`; the whole edge layer is
  `aria-hidden`.
- **Nodes:** absolutely positioned at their layout box, rendered by the existing
  **`ChartCardView`** (node → `ChartCard` map) so chunky ink-border + tone tokens +
  interactive-vs-inert button + focus ring are reused. Interactive nodes call `onActivate`.
- **Responsive:** the SVG scales inside a `max-w-full overflow-x-auto` container so wide
  graphs scroll horizontally on small screens; the page body never scrolls sideways.
- **A11y:** `role="group"` with an `aria-label`; interactive nodes are the existing focusable
  buttons; a visually-hidden text list enumerates edges ("Gather context → Take action")
  so the graph is legible to screen readers. Decorative arrowheads/labels are `aria-hidden`.
- **Reduced motion:** honors `prefers-reduced-motion` (no entrance/stagger), consistent with
  `ChartCardView`.

### 4.4 Wiring — `src/components/charts/Chart.tsx`

Add one branch to the row map: `row.kind === 'flow'` → `<FlowView row={row}
onActivate={onActivate} />`. The inter-row `DownArrow` logic is unchanged (a single flow row
renders no spurious arrow). `onActivate`'s signature is unchanged.

**`ChartEmbed.tsx`, `index.ts` registry, and the generator/validator are untouched** — flow
charts register and validate exactly like card charts (validation already checks
`interactive[].spec` against the node-safe `chartIds` list).

## 5. Dogfood (two shapes)

Two real curriculum charts, proving labeled edges and cycles:

- **Loop — `agentic-loop-diagram`** (home lesson B1.1 = `what-is-cc`): gather → act → verify
  as a cycle; stage nodes use `popup` targets. Embedded via `<ChartEmbed id="agentic-loop-diagram" />`.
- **Decision tree — `clear-compact-new-tree`** (the B2.4 resolver's static fallback): question
  nodes, options as **labeled** edges, leaves linking to home lessons / opening popups.
  Embedded in an existing beginner lesson.

Both are added to `src/content/charts/index.ts`; `src/content/charts/chartIds.ts` and its
drift-guard test in `index.test.ts` are updated to match.

## 6. Docs

- Rewrite the "Future: React Flow" section of `src/content/charts/README.md` into a real
  **Flowchart** guide: the node/edge/direction model, the dagre-layout note, and guidance on
  when to use a flow row vs card rows / connectors.
- One-line mention of flow charts in the `new-lesson` skill (charts are authored the same
  way — define, register, embed) and in the `CLAUDE.md` "Adding a chart" pointer.

## 7. Testing

- `flowLayout.test.ts`: a small tree yields deterministic, distinct node positions and edge
  points; a **cyclic** graph lays out without throwing.
- `FlowView.test.tsx`: nodes, edges, and edge **labels** render; an interactive node
  activates via `onActivate`; an inert node (no `target`) is not a button; reduced-motion
  path renders.
- `Chart.test.tsx`: a `flow` row renders a `FlowView` (and card/connector rows still render).
- registry/drift: `chartIds.ts` matches the real registry after adding the two charts.
- **Bundle guard (source-level):** assert `flowLayout.ts` imports dagre only via a dynamic
  `import()` — never a top-level import — preserving code-splitting (mirrors the existing
  loading-model guard).
- Acceptance: full Vitest suite, `tsc -b` / `npm run build`, `npm run lint`, and
  `npm run check-snippets` (0/0) all green; `curriculum.ts` regenerates deterministically.

## 8. Phase 2 readiness (decision trees)

The node/edge JSON is deliberately the **complete data contract** for Phase 2 guided
decision-tree traversal — Phase 2 adds behavior, not data. To keep that true, Phase 4
implementers MUST honor these conventions:

- **`role` distinguishes traversal states:** `question` = a branch point whose outgoing edges
  are the answer options; `leaf` = a recommendation terminus (its `lines`/popup carry the
  justification, its `target` links to the option's home lesson).
- **Edge array order defines option order:** a question node's answer options are its outgoing
  edges (`edges.filter((e) => e.from === node.id)`) in array order. Do not reorder edges
  during layout in a way that loses authored order.
- **The traversal contract is the graph itself:** guided mode is a state machine over these
  nodes/edges (start at the root `question` → present outgoing edges as options → advance to
  the picked edge's `to` → stop at a `leaf`); the **path summary** is derived from the edge
  `label`s along the chosen path. No Phase-4 data or layout choice may block this.
- **Explore mode == the Phase 1 static rendering** (`FlowView`) per curriculum §1.5 — already
  delivered by this phase.

What Phase 2 still builds (additive, none blocked here): the traversal state machine +
"start over" + path summary, and a small **active/dimmed highlight state** on nodes/edges in
the renderer (Phase 4 `FlowView` renders static nodes; adding an active state is cosmetic).
Simulators are a separate primitive (different JSON shape) and are not addressed by this
graph model.

## 9. Non-goals / deferred

- **Guided decision-tree traversal, simulators, quizzes** (curriculum Phase 2 / R5): built on
  this phase's node/edge JSON; the renderer swaps, the data does not.
- **`claude-code-system-map`** — the flagship pan/zoom "global navigator." If it genuinely
  needs an interactive canvas, that is the one place react-flow may be reconsidered, as a
  dedicated surface — not a reason to weight inline diagrams now.
- No generator/validator/emitter change; no new route; no gating.

## 10. Files

New:
- `src/components/charts/flowLayout.ts` (+ test)
- `src/components/charts/FlowView.tsx` (+ test)
- `src/content/charts/agentic-loop-diagram.ts`, `src/content/charts/clear-compact-new-tree.ts`

Changed:
- `src/content/charts/types.ts` — `FlowNode`/`FlowEdge`/`FlowDirection` + `flow` row kind
- `src/components/charts/Chart.tsx` (+ test) — flow row branch
- `src/content/charts/index.ts` — register the two charts
- `src/content/charts/chartIds.ts` + `src/content/charts/index.test.ts` — drift guard
- lesson `.mdx` (dogfood embeds)
- `src/content/charts/README.md`, `.claude/skills/new-lesson/SKILL.md`, `CLAUDE.md`
- `package.json` — add `@dagrejs/dagre` dependency

## 11. Execution

Single implementation plan. Feature branch `feat/curriculum-phase4-charts` off main, TDD,
landed via a CI-gated PR to main per the initiative's workflow convention.
