import type { MDXComponents } from 'mdx/types'
import { cn } from '../../lib/cn'
import { ChartEmbed } from '../charts/ChartEmbed'
import { CodeBlock } from './CodeBlock'
import { LessonLink } from './LessonLink'
import { Snippet } from './Snippet'
import { TryPrompt } from './TryPrompt'
import { WhenLang } from './WhenLang'

export const mdxComponents = {
  Snippet,
  TryPrompt,
  WhenLang,
  ChartEmbed,
  LessonLink,
  h1: (props) => <h1 className="mt-0 mb-4 font-mono text-3xl font-bold" {...props} />,
  h2: (props) => <h2 className="mt-8 mb-3 font-mono text-2xl font-semibold" {...props} />,
  h3: (props) => <h3 className="mt-6 mb-2 font-mono text-xl font-semibold" {...props} />,
  p: (props) => <p className="my-4 leading-relaxed text-foreground" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-1 pl-6" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-1 pl-6" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: ({ href, children, ...props }) => {
    // Links that leave the platform (http/https) open in a new tab and carry an
    // external-link marker, matching the "Official docs" footer. Internal links
    // (in-page anchors, relative routes) render plainly.
    const isExternal = typeof href === 'string' && /^https?:\/\//i.test(href)
    return (
      <a
        href={href}
        className="text-link underline underline-offset-2 hover:text-primary"
        {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...props}
      >
        {children}
        {isExternal ? <span aria-hidden="true"> ↗</span> : null}
      </a>
    )
  },
  pre: CodeBlock,
  code: ({ className, ...props }) => {
    // Fenced blocks carry a `language-*` class and are styled by CodeBlock; only
    // inline code gets the pill treatment.
    if (typeof className === 'string' && className.includes('language-')) {
      return <code className={className} {...props} />
    }
    return (
      <code
        className={cn('rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]', className)}
        {...props}
      />
    )
  },
  blockquote: (props) => (
    <blockquote
      className="my-4 border-l-4 border-accent bg-muted/50 py-2 pl-4 text-muted-foreground"
      {...props}
    />
  ),
  table: (props) => (
    <div className="my-6 overflow-x-auto rounded-card border-2 border-ink">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="border-b-2 border-ink bg-muted" {...props} />,
  th: (props) => <th className="px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-foreground" {...props} />,
  td: (props) => <td className="border-t border-border px-3 py-2 align-top leading-relaxed text-foreground" {...props} />,
} satisfies MDXComponents
