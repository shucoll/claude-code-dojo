import { useLocation, useParams } from 'react-router-dom'
import { curriculum } from '../content/curriculum'
import { lessonPath, prevLesson } from './curriculumNav'

export function useBackTarget(): string | null {
  const location = useLocation()
  const { lessonId } = useParams()
  const from = (location.state as { from?: string } | null)?.from
  if (from) return from
  const prev = lessonId ? prevLesson(curriculum, lessonId) : undefined
  return prev ? lessonPath(prev) : null
}
