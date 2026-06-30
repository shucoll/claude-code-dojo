import { MDXProvider } from '@mdx-js/react'
import { Suspense, lazy, useMemo } from 'react'
import { mdxComponents } from '../mdx/mdxComponents'
import { Popup } from '../ui/Popup'
import type { PopupTarget } from '../../content/charts/types'

interface ChartPopupProps {
  target: PopupTarget | null
  onClose: () => void
}

export function ChartPopup({ target, onClose }: ChartPopupProps) {
  const Content = useMemo(() => (target ? lazy(target.content) : null), [target])

  return (
    <Popup open={target !== null} onClose={onClose} title={target?.title}>
      {Content && (
        <MDXProvider components={mdxComponents}>
          <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
            <Content />
          </Suspense>
        </MDXProvider>
      )}
    </Popup>
  )
}
