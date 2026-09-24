import type { ChartDef, LessonRef } from './types'

const lesson = (ref: LessonRef) => ({ kind: 'lesson' as const, ref })

/** Each module's home lesson: where clicking that territory lands. */
const home = (module: string, lesson: string): LessonRef => ({ level: 'advanced', module, lesson })

const A1_1 = home('orchestration-and-parallel-work', 'worktrees-and-parallel-sessions')
const A2_1 = home('automation-and-ci-cd', 'headless-mode')
const A3_1 = home('production-safety-and-governance', 'prompt-injection-and-the-agent-threat-model')
const A4_1 = home('performance-cost-and-scale', 'prompt-caching-and-session-hygiene')
const A5_1 = home('building-and-distributing-extensions', 'plugin-development')
const A6_1 = home('the-agent-sdk', 'when-to-graduate-to-the-sdk')
const A7_1 = home('guided-project-ship-it-like-a-team', 'parallel-sprint-with-an-agent-team')

/**
 * The itinerary for Level 3: six territories, ordered by dependency rather than
 * difficulty. A1 supplies the primitives A2 automates; A3 is the precondition on
 * running any of it unattended; A4 through A6 are independent of each other.
 * Everything converges on the A7 capstone.
 *
 * Every node links to its module's home lesson.
 */
export const advancedStackMap: ChartDef = {
  id: 'advanced-stack-map',
  title: 'The six territories of Advanced',
  subtitle: 'A1 supplies what A2 automates, A3 gates anything unattended, and A4 through A6 stand on their own.',
  rows: [
    {
      kind: 'cards',
      cards: [
        {
          id: 'a1',
          title: 'A1 · Orchestration and Parallel Work',
          lines: ['More than one worker: worktrees, agent view, teams, workflows'],
          tone: 'blue',
          target: lesson(A1_1),
        },
      ],
    },
    { kind: 'connector', label: 'A1 first: automation is assembled from these primitives' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'a2',
          title: 'A2 · Automation and CI/CD',
          lines: ['Claude with no one watching: headless runs, CI, schedules'],
          tone: 'blue',
          target: lesson(A2_1),
        },
      ],
    },
    { kind: 'connector', label: 'the one hard ordering rule: A3 before anything runs unattended' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'a3',
          title: 'A3 · Production Safety and Governance',
          lines: ['The threat model, sandboxing, and controls users cannot override'],
          tone: 'rose',
          target: lesson(A3_1),
        },
      ],
    },
    { kind: 'connector', label: 'then these three, in whatever order your work demands' },
    {
      kind: 'grid',
      columns: 3,
      items: [
        {
          id: 'a4',
          title: 'A4 · Performance, Cost, and Scale',
          lines: ['Measure it: caching, model strategy, telemetry'],
          tone: 'violet',
          target: lesson(A4_1),
        },
        {
          id: 'a5',
          title: 'A5 · Building and Distributing Extensions',
          lines: ['Ship it: plugins as products, marketplaces, deep hooks'],
          tone: 'violet',
          target: lesson(A5_1),
        },
        {
          id: 'a6',
          title: 'A6 · The Agent SDK',
          lines: ['Embed it: the same engine, inside your own product'],
          tone: 'violet',
          target: lesson(A6_1),
        },
      ],
    },
    { kind: 'connector', label: 'all of it converging on' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'a7',
          title: 'A7 · Guided Project: Ship It Like a Team',
          lines: ['Take PulseBoard from "works on my machine" to production-operated'],
          tone: 'teal',
          target: lesson(A7_1),
        },
      ],
    },
  ],
}
