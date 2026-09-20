import type { ComponentType } from 'react'

import type { ChartDef } from './types'

const popup = (title: string, content: () => Promise<{ default: ComponentType }>) =>
  ({ kind: 'popup' as const, title, content })

/**
 * The autonomy spectrum for A2.4, laid out along one axis: how much of your
 * presence each mechanism still requires.
 *
 * The order is the curriculum's. The first three are the scheduling split the
 * docs make explicitly, ordered by what has to stay running for them to fire:
 * `/loop` needs an open session, a desktop task needs the machine, a routine
 * needs neither. `/goal` and auto mode follow because they remove supervision
 * from a session rather than scheduling one, and they remove different halves
 * of it: `/goal` the per-turn prompt, auto mode the per-tool prompt. Channels
 * sit at the far end because they invert the direction of travel, pushing an
 * event into a session instead of waking one on a timer.
 *
 * Each popup answers the three questions the lesson's mini-resolver asks, so a
 * learner can read a single card without holding the table in their head.
 */
export const automationSpectrum: ChartDef = {
  id: 'automation-spectrum',
  title: 'How much of you does it need?',
  subtitle: 'Six mechanisms on one axis, from a session you sit in to an event that arrives on its own.',
  rows: [
    {
      kind: 'cards',
      cards: [
        {
          id: 'loop',
          title: '/loop',
          lines: ['a timer inside your session', 'open session · machine on'],
          tone: 'blue',
          target: popup('/loop', () => import('./popups/automation-loop.mdx')),
        },
        {
          id: 'desktop-task',
          title: 'Desktop scheduled task',
          lines: ['a timer on your machine', 'no session · machine on'],
          tone: 'teal',
          target: popup('Desktop scheduled task', () => import('./popups/automation-desktop-task.mdx')),
        },
        {
          id: 'routine',
          title: 'Cloud routine',
          lines: ['a timer, a webhook, or a GitHub event', 'no session · machine off'],
          tone: 'violet',
          target: popup('Cloud routine', () => import('./popups/automation-routine.mdx')),
        },
      ],
    },
    { kind: 'connector', label: 'the three above schedule a session; the two below change one you are already in' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'goal',
          title: '/goal',
          lines: ['a condition checked after every turn', 'removes the per-turn prompt'],
          tone: 'amber',
          target: popup('/goal', () => import('./popups/automation-goal.mdx')),
        },
        {
          id: 'auto-mode',
          title: 'Auto mode',
          lines: ['a classifier in your place', 'removes the per-tool prompt'],
          tone: 'amber',
          target: popup('Auto mode', () => import('./popups/automation-auto-mode.mdx')),
        },
      ],
    },
    { kind: 'connector', label: 'and one that waits for the world instead of a clock' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'channels',
          title: 'Channels',
          lines: ['an event pushed into an open session', 'research preview · opt in per session'],
          tone: 'rose',
          target: popup('Channels', () => import('./popups/automation-channels.mdx')),
        },
      ],
    },
  ],
}
