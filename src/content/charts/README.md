# Chart Authoring Guide

## Overview

Charts are interactive card-flow stacks embedded in lessons. Each chart is a vertical stack of rows, where each row contains either a set of cards or a connector pill with a label. Click an interactive card to navigate to a lesson in the curriculum or open a modal popup with additional content. Non-interactive (targetless) cards are inert.

## Data Model

All charts are defined as a `ChartDef`, which has:

```typescript
interface ChartDef {
  id: string              // unique identifier
  title?: string          // optional title displayed above the chart
  subtitle?: string       // optional subtitle displayed below the title
  rows: ChartRow[]        // vertical stack of rows
}
```

### Rows

Each row is one of two kinds:

**Cards row:**
```typescript
{ kind: 'cards', cards: ChartCard[] }
```
Displays one or more cards. A single card spans full width; two or three cards split horizontally and stack on mobile.

**Connector row:**
```typescript
{ kind: 'connector', label: string }
```
Displays a labeled pill (e.g., "unlock: unlock advanced features"). Arrows auto-connect above and below.

### Cards

Each card in a cards row:

```typescript
interface ChartCard {
  id: string              // unique within the chart
  title: string           // card headline
  lines?: string[]        // optional muted description lines
  tone?: ChartTone        // color variant; defaults to 'neutral'
  target?: ChartTarget    // click behavior; omit for inert card
}
```

**Tones** control the card's color. Choose from:
- `'neutral'` — default, muted
- `'blue'` — primary accent
- `'violet'` — secondary accent
- `'amber'` — warning/caution
- `'rose'` — error/destructive
- `'teal'` — success/goal

Note: success-green is intentionally excluded; use `'teal'` for positive outcomes.

### Targets

A card's `target` controls what happens when clicked. If omitted, the card is non-interactive.

**Lesson target:**
```typescript
{ kind: 'lesson', ref: { level: string, module: string, lesson: string } }
```
Navigates to a lesson in the curriculum. The `ref` must match an existing lesson in `src/content/curriculum.ts`:
```typescript
// example
target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } }
```

**Popup target:**
```typescript
{ kind: 'popup', title?: string, content: () => Promise<{ default: ComponentType }> }
```
Opens a modal with custom content loaded from an MDX file:
```typescript
// example
target: {
  kind: 'popup',
  title: 'Bash',
  content: () => import('./popups/bash.mdx')
}
```
The MDX file is dynamically imported and rendered in a modal. The `title` is optional and displayed in the modal header.

## Adding a Chart

### 1. Create the chart definition

Create a new file `src/content/charts/<id>.ts` exporting a `ChartDef`:

```typescript
// src/content/charts/my-chart.ts
import type { ChartDef } from './types'

export const myChart: ChartDef = {
  id: 'my-chart',
  title: 'My Chart Title',
  subtitle: 'Optional subtitle',
  rows: [
    {
      kind: 'cards',
      cards: [
        { id: 'card-1', title: 'First Card' },
        { id: 'card-2', title: 'Second Card' }
      ]
    },
    { kind: 'connector', label: 'and then' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'card-3',
          title: 'Next Level',
          lines: ['learn · apply · master'],
          tone: 'blue',
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } }
        }
      ]
    }
  ]
}
```

### 2. Register the chart

Add your chart to the charts registry in `src/content/charts/index.ts`:

```typescript
import { demo } from './demo'
import { myChart } from './my-chart'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [demo.id]: demo,
  [myChart.id]: myChart,
}

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}
```

### 3. Create popup content (if needed)

If your chart uses popup targets, create an MDX file under `src/content/charts/popups/<name>.mdx`:

```mdx
# Popup Title

Your content here. You can use any markdown, including:
- Lists
- Code blocks
- Embedded components like `<Snippet />`

The popup is rendered in a modal with auto-sizing.
```

Example: `src/content/charts/popups/bash.mdx`
```mdx
# Bash

Claude Code can run shell commands on your behalf. The example below is rendered
through the same language-aware engine the lessons use:

<Snippet id="edit-function" />
```

### 4. Embed in a lesson

In your lesson MDX, use the `<ChartEmbed />` component with the chart's `id`:

```mdx
# My Lesson

Some intro text.

<ChartEmbed id="my-chart" />

More content after the chart.
```

The chart will render inline with automatic spacing and card activation wired to lesson navigation and popup opens.

## Layout

- **Single card row:** spans full width
- **Two–three card row:** splits horizontally; stacks to full-width on mobile
- **Connector row:** labeled pill; a centered connector line is rendered between consecutive rows
- **Arrows:** simple centered connectors between consecutive rows (not SVG edge-routing)
- **Reduced motion:** respects prefers-reduced-motion; disables animations

## Example: Full Chart

Here's a complete, working example adapted from the demo:

```typescript
// src/content/charts/levels.ts
import type { ChartDef } from './types'

export const levelChart: ChartDef = {
  id: 'levels',
  title: 'Claude Code: levels',
  subtitle: 'Click a layer to go deeper →',
  rows: [
    {
      kind: 'cards',
      cards: [
        {
          id: 'start',
          title: 'Start here',
          lines: ['Pick a path and go deeper'],
          tone: 'neutral'
        }
      ]
    },
    {
      kind: 'cards',
      cards: [
        {
          id: 'beginner',
          title: 'Beginner',
          lines: ['operator · the turn', 'approve diffs · /init'],
          tone: 'blue',
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } }
        },
        {
          id: 'bash',
          title: 'Bash',
          lines: ['run shell commands'],
          tone: 'amber',
          target: { kind: 'popup', title: 'Bash', content: () => import('./popups/bash.mdx') }
        }
      ]
    },
    {
      kind: 'connector',
      label: 'unlock: configure the agent\'s environment'
    },
    {
      kind: 'cards',
      cards: [
        {
          id: 'advanced',
          title: 'Advanced',
          lines: ['orchestrator · the fleet', 'parallel agents · CI'],
          tone: 'violet'
        }
      ]
    }
  ]
}
```

Then register in `index.ts` and embed with `<ChartEmbed id="levels" />`.

## Future: React Flow

This card-flow renderer is a linear vertical stack of rows with simple connectors. Genuinely graph-shaped charts—those with loops, multiple edges between nodes, or edge labels—are planned as a future React Flow renderer behind the same `ChartDef` contract and will not be supported by this linear stack implementation.
