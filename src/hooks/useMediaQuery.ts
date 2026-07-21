import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query and re-render when it flips. Reads the current
 * value synchronously on first render (via a lazy initializer) so consumers do
 * not flash the wrong layout before the first effect runs.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
