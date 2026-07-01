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

export type ChartTone = 'neutral' | 'blue' | 'violet' | 'amber' | 'rose' | 'teal'

export interface ChartCard {
  id: string
  title: string
  /** Muted description lines, e.g. "operator · the turn". */
  lines?: string[]
  /** Defaults to 'neutral'. */
  tone?: ChartTone
  /** Omitted => a plain, non-interactive card. */
  target?: ChartTarget
}

export type ChartRow =
  | { kind: 'cards'; cards: ChartCard[] }
  | { kind: 'connector'; label: string }

export interface ChartDef {
  id: string
  title?: string
  subtitle?: string
  rows: ChartRow[]
}
