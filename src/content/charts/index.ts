import { demo } from './demo'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [demo.id]: demo,
}

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}

export type { ChartDef, ChartCard, ChartRow, ChartTone, ChartTarget, PopupTarget, LessonRef } from './types'
