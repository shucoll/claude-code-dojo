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
