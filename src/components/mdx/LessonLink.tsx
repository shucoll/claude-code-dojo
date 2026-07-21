import type { MouseEvent, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { findByDottedId, lessonPath } from '../../lib/curriculumNav'

interface LessonLinkProps {
  /** Canonical dotted id of the target lesson, e.g. "B2.3". */
  id: string
  children?: ReactNode
}

const linkClass = 'text-link underline underline-offset-2 hover:text-primary'

/** Marks every LessonLink anchor so its position among them is addressable. */
export const LESSON_LINK_SELECTOR = 'a[data-lesson-link]'

export function LessonLink({ id, children }: LessonLinkProps) {
  const loc = findByDottedId(curriculum, id)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (!loc) return <span>{children ?? id}</span>
  const to = lessonPath(loc)

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle modified clicks (new tab, etc.) via the real href.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return
    }
    e.preventDefault()
    // Record where the reader jumped from, down to this exact link, so the
    // target lesson's Back button returns them to this spot rather than to the
    // target's sequential previous lesson. The link's ordinal among all lesson
    // links is stable across remounts (the MDX renders identically), so it
    // survives the round trip where a generated element id would not. Consumed
    // by useBackTarget; resolved back to the element by LessonPage's scroll effect.
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(LESSON_LINK_SELECTOR))
    const index = links.indexOf(e.currentTarget)
    const from = index >= 0 ? `${pathname}#lref-${index}` : pathname
    navigate(to, { state: { from } })
  }

  return (
    <a href={to} data-lesson-link onClick={onClick} className={linkClass}>
      {children ?? loc.lesson.title}
    </a>
  )
}
