import { loop } from './loop'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [loop.id]: loop,
}

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}

export type { ChartDef, ChartNode, ChartEdge, ChartTarget, PopupTarget, LessonRef } from './types'
