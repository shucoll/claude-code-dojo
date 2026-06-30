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
