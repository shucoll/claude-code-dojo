import { Children, isValidElement, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Fence language that renders as a prompt card rather than a code surface. */
const PROMPT_LANG = 'prompt'

interface CodeChildProps {
  className?: string
  children?: ReactNode
}

/** Flatten the fenced block's text, which MDX hands us as a string or an array of strings. */
function toText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(toText).join('')
  return ''
}

/**
 * MDX renders a fence as `<pre><code class="language-x">…</code></pre>`, so the
 * language and the raw source both live on the inner `<code>` element.
 */
function readFence(children: ReactNode): { code: string; lang: string } {
  const child = Children.toArray(children).find(isValidElement)
  if (!child) return { code: '', lang: '' }
  const props = child.props as CodeChildProps
  const lang = /language-([\w-]+)/.exec(props.className ?? '')?.[1] ?? ''
  return { code: toText(props.children).replace(/\n$/, ''), lang }
}

function CopyButton({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    })
  }, [code])

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      className={cn(
        'shrink-0 cursor-pointer rounded-control px-2 py-1 font-mono text-xs font-medium',
        'text-muted-foreground transition-colors hover:text-foreground',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/**
 * `pre` override for MDX. A ```prompt fence is what the learner types into
 * Claude, so it gets the chunky card treatment; every other fence is a plain
 * code surface that recedes.
 */
export function CodeBlock({ children }: { children?: ReactNode }) {
  const { code, lang } = readFence(children)

  if (lang === PROMPT_LANG) {
    return (
      <div className="my-6 rounded-card border-2 border-ink bg-accent-soft shadow-hard">
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink px-4 py-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            Prompt:
          </span>
          <CopyButton code={code} className="text-accent-foreground hover:text-foreground" />
        </div>
        <pre className="overflow-x-auto px-4 py-3">
          <code className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
            {code}
          </code>
        </pre>
      </div>
    )
  }

  return (
    <div className="relative my-4 rounded-card border border-border bg-muted">
      <CopyButton code={code} className="absolute right-1 top-1" />
      <pre className="overflow-x-auto px-4 py-3 pr-16">
        <code className="font-mono text-sm leading-relaxed text-foreground">{code}</code>
      </pre>
    </div>
  )
}
