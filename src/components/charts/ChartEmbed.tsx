// src/components/charts/ChartEmbed.tsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { getChart } from '../../content/charts'
import type { ChartCard, PopupTarget } from '../../content/charts/types'
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

  function handleActivate(card: ChartCard) {
    const target = card.target
    if (!target) return
    if (target.kind === 'popup') {
      setPopup(target)
      return
    }
    const { level, module, lesson, anchor } = target.ref
    const loc = findLesson(curriculum, level, module, lesson)
    if (!loc) return
    const to = anchor ? `${lessonPath(loc)}#${anchor}` : lessonPath(loc)
    navigate(to, { state: { from: `${pathname}#chart-${id}` } })
  }

  return (
    <div id={`chart-${id}`} className="my-8 flex justify-center">
      <Chart def={def} onActivate={handleActivate} />
      <ChartPopup target={popup} onClose={() => setPopup(null)} />
    </div>
  )
}
