import type { ChartDef } from './types'

/**
 * Demo card-flow chart. Exercises all three card kinds (targetless, lesson,
 * popup), a two-card split row, a connector pill, and several tones.
 */
export const demo: ChartDef = {
  id: 'demo',
  title: 'Claude Code: levels',
  subtitle: 'Click a layer to go deeper →',
  rows: [
    {
      kind: 'cards',
      cards: [{ id: 'start', title: 'Start here', lines: ['Pick a path and go deeper'], tone: 'neutral' }],
    },
    {
      kind: 'cards',
      cards: [
        {
          id: 'beginner',
          title: 'Beginner',
          lines: ['operator · the turn', 'approve diffs · /init'],
          tone: 'blue',
          target: {
            kind: 'lesson',
            ref: { level: 'beginner', module: 'meet-claude-code', lesson: 'from-chat-to-agent' },
          },
        },
        {
          id: 'bash',
          title: 'Bash',
          lines: ['run shell commands'],
          tone: 'amber',
          target: { kind: 'popup', title: 'Bash', content: () => import('./popups/bash.mdx') },
        },
      ],
    },
    { kind: 'connector', label: 'unlock: configure the agent\'s environment' },
    {
      kind: 'cards',
      cards: [{ id: 'advanced', title: 'Advanced', lines: ['orchestrator · the fleet', 'parallel agents · CI'], tone: 'violet' }],
    },
  ],
}
