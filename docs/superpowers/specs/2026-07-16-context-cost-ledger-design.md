# The `ledger` row kind and `context-cost-ledger`

**Date:** 2026-07-16
**Status:** Approved, not yet implemented
**Scope:** A new chart row kind (`ledger`) and the `context-cost-ledger` chart, shipped as its Phase 1 fallback with Phase-2-ready data. Home lesson: I2.1.

## Why

`context-cost-ledger` is the visual anchor for Intermediate's load-bearing discipline: every feature lesson in the level must reference its cost back to I2.1's frame. It is reused by I5.3 (MCP over-connecting, "the ledger revisited live") and I7.3.

The curriculum spec tags it `simulator · Phase 2` with a `Phase 1 fallback: static stacked diagram`, and promises (§1.5, R5) that a Phase 2 upgrade is *"a rendering change only — the lesson content and chart data don't change."*

**That promise breaks if the fallback hardcodes percentages.** A `percent` is a share of a fixed whole; it cannot express what a feature costs when toggled off, so a toggleable ledger built on `percent` data would require rewriting the chart data, the exact rework R5 exists to prevent.

This design ships the fallback now with the simulator's real data model underneath, so the later upgrade is one new component and its tests.

### Why the ledger is not the expensive simulator

§1.5's simulator definition was written around `context-window-simulator`: an event palette, destructive events (`/compact`, `/clear`), thresholds that fire modeled auto-compaction, a "what survives?" panel. The ledger inherited that label by adjacency, not by difficulty. Its entire mechanic is *toggle a feature → recompute shares → restack*: derived state, no event log, no history, no thresholds, no destructive operations.

The two charts are independent and upgrade separately. `bar` does not go away.

| Chart | Row kind | Home | Phase 2 upgrade |
|---|---|---|---|
| `context-window-simulator` | `bar` (unchanged) | B2.2 | event palette + thresholds |
| `context-cost-ledger` | `ledger` (new) | I2.1 | toggle chips |

## Design

### A new row kind, not an extension of `bar`

`ChartBarSegment.percent` stays required, and B2.2's shipped chart is not touched.

A `bar` row is a **snapshot of proportions** — `percent` is inherently relative, and `context-window-simulator` uses it that way ("file reads are 30% of the window"). A ledger is a **cost breakdown by feature**: each entry is an absolute token cost, some entries are toggleable, and the shares are a *consequence* of what is switched on. Storing absolute token counts in a field named `percent` would be a lie the next reader has to decode.

Extending `ChartBarSegment` would mean making `percent` optional on the type a live lesson depends on, to serve a chart that does not exist yet. A separate kind touches nothing that currently works.

### Types

Added to `src/content/charts/types.ts`:

```typescript
/**
 * One line of a `ledger` row: a feature and what it costs. Structurally a
 * `ChartCard` (so it activates through the same lesson/popup targets) plus an
 * absolute token cost. Unlike `ChartBarSegment.percent`, `tokens` survives a
 * feature being toggled off, which is what makes the Phase 2 simulator a
 * rendering change rather than a data rewrite.
 */
export interface LedgerEntry extends ChartCard {
  /** Absolute cost. The source of truth; shares are derived. */
  tokens: number
  /** Fixed overhead (CLAUDE.md) vs optional (an MCP server). Defaults to false. */
  toggleable?: boolean
  /** Initial state for a toggleable entry. Defaults to true. */
  defaultOn?: boolean
}
```

Added to the `ChartRow` union:

```typescript
| { kind: 'ledger'; entries: LedgerEntry[]; windowTokens?: number; label?: string; caption?: string }
```

**Amended 2026-07-16, during I2.1 authoring: `windowTokens` is optional.** As originally designed it was required, on the reasoning that free space should be computed rather than invented. The real docs numbers killed that: startup is 7,850 tokens against a 200,000-token window, so a window-relative breakdown renders 96% grey and **five of the seven entries round to 0% and vanish**. Decimal places don't rescue it either; a 0.06% sliver is invisible at any precision.

A ledger therefore has two valid shapes:

- **With `windowTokens`** — entries are shares of a capacity, and the remainder renders as free space, `windowTokens - sum(enabled tokens)`, **clamped at zero**. Overflow is only reachable through bad data (toggling can only reduce the sum), so the clamp keeps a mistuned ledger rendering as a full bar rather than producing a negative-width segment.
- **Without it** — entries are shares of their own sum: a breakdown of a total, no free space. This is the only readable view when entries are a few percent of the capacity, and it's the one that makes Phase 2 toggling legible (switching on an MCP server moves a startup-relative bar and leaves a window-relative bar untouched).

`context-cost-ledger` uses the second shape for its breakdown row and a plain `bar` row beneath it for the window-relative view, so "what makes up startup" and "what startup costs you" are answered separately rather than fighting for one axis.

### Phase 1 rendering: derive and delegate

`LedgerView` computes each entry's share from `tokens` and `windowTokens`, appends a synthetic `free-space` segment for the remainder, and delegates to the existing `BarView`.

```
tokens + windowTokens ──► derive percents ──► BarView (existing, unchanged)
```

Roughly 30 LOC of adapter and zero duplicated rendering. The percents on screen today are computed exactly as the simulator will compute them, so the fallback and the simulator can never disagree.

Phase 2 replaces the delegation with toggle chips and per-entry itemization inside the same component. `Chart.tsx` dispatch, chart data, lesson MDX, and the `<ChartEmbed>` call are all untouched by that change.

### Files

| File | Change |
|---|---|
| `src/content/charts/types.ts` | `LedgerEntry`; `ledger` added to `ChartRow` |
| `src/components/charts/LedgerView.tsx` | New. Derives shares, delegates to `BarView` |
| `src/components/charts/LedgerView.test.tsx` | New |
| `src/components/charts/Chart.tsx` | One dispatch branch |
| `src/content/charts/context-cost-ledger.ts` | New. The chart data |
| `src/content/charts/chartIds.ts` | Register `context-cost-ledger` |
| `src/content/charts/index.ts` | Import, register, export `LedgerEntry` |
| `src/content/charts/index.test.ts` | **`targetsOf` needs a `ledger` case** |
| `src/content/charts/README.md` | Document the row kind |

`targetsOf` switches on row kind to collect every clickable target for validation. Without a `ledger` case the chart's popups and lesson links silently escape the anchor and lesson-ref checks — a passing suite that validates nothing.

### Data

Entry costs are the official docs' own figures, from the interactive simulation embedded in `context-window.md` (verified 2026-07-16). Per §1.5 the numbers live in the chart data rather than in code, so a maintenance pass can retune them without touching the component, and the chart carries the required "representative numbers, not exact" disclaimer in `caption`.

| Entry | Tokens |
|---|---:|
| System prompt | 4,200 |
| Project `CLAUDE.md` | 1,800 |
| Auto memory | 680 |
| Skill descriptions | 450 |
| `~/.claude/CLAUDE.md` | 320 |
| Environment info | 280 |
| MCP tool names | 120 |
| **Total** | **7,850** |

**The docs contradict the curriculum spec on the eager/lazy split.** The spec has I2.1 teaching that "CLAUDE.md and MCP tool definitions load up front and pay rent every session; skills load an index and pull their bodies on demand." MCP has since flipped: tool search is on by default, only names load (120 tokens), and `mcp.md` states that "adding more MCP servers has minimal impact on your context window." `ENABLE_TOOL_SEARCH=false` restores the old eager behavior.

Per the authoring rule, docs win. The resulting model is cleaner than the spec's: progressive disclosure now describes **both** skills and MCP, and the eager set is down to the system prompt, `CLAUDE.md`, memory, and environment info.

**This invalidates I5.3's spec'd premise** ("Every connected server's tool definitions load eagerly... which is why over-connecting is the classic intermediate mistake"). That lesson needs reframing when reached: the cost of over-connecting is now latency and tool-search noise, not context.

### Testing

- `LedgerView`: shares derive correctly from tokens; free space is the remainder; a ledger whose entries exceed `windowTokens` degrades without a negative-width segment.
- `index.test.ts`: `targetsOf` returns ledger entries, so existing lesson-ref and anchor validation covers them automatically.
- `Chart.test.tsx`: a `ledger` row dispatches to `LedgerView`.

## Notes for Phase 2

- **Derive the legend lines from `tokens`.** The Phase 1 chart hand-authors token counts into each entry's `lines` (`'4,200 tokens · you never see it'`), so the field the row kind exists for does not currently drive any rendering. Prose and data can therefore drift. `LedgerView` should format that line from `tokens` once it owns the legend, leaving `lines` for the descriptive half only.
- **`toggleable` and `defaultOn` are dormant.** `defaultOn` is respected when summing, but nothing reads `toggleable` yet; it exists to mark which entries get a chip.

## Not in scope

- **The Phase 2 simulator itself** (toggle chips, itemization, reset). Independently schedulable; this design's whole purpose is to make that a component-only change.
- **`context-window-simulator`'s Phase 2 upgrade.** Separate chart, separate path, genuinely expensive.
- **Re-embedding `context-window-simulator` in I2.1.** The spec's Interactive row says "reuses `context-window-simulator`", but per the established rule a `reuses` note is a suggestion to evaluate, not a default. Re-embedding would place B2.2's chart on the page a second time, next to a chart covering adjacent ground. I2.1 links to B2.2 instead. Consistent with I1.2 and I1.4; recorded here because it departs from the spec.

## Consequences

- One new row kind, additive; no existing chart, lesson, or type changes.
- The `bar` kind keeps a single, coherent meaning: proportions of a whole.
- Phase 2 for the ledger becomes one component and its tests.
- Cost today: ~15 LOC of types, ~30 of adapter, ~40 of tests, one dispatch branch, one README section — against ~300 for the full simulator, none of it throwaway.
